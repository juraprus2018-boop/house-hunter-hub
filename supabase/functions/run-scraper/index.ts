import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScrapedProperty {
  source_url: string;
  source_site: string;
  title: string;
  price: number | null;
  city: string | null;
  postal_code: string | null;
  street: string | null;
  house_number: string | null;
  surface_area: number | null;
  bedrooms: number | null;
  property_type: string | null;
  listing_type: string | null;
  description: string | null;
  images: string[];
  raw_data: Record<string, unknown>;
}

const SYSTEM_USER_ID = "0d02a609-fde3-435a-9154-078fdce7ed34";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 60);
}

async function uploadImagesToStorage(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  images: string[],
  city: string,
  title: string,
  propertyId: string
): Promise<string[]> {
  const storedUrls: string[] = [];
  const citySlug = slugify(city || "onbekend");
  const titleSlug = slugify(title || "woning");
  const basePath = `${citySlug}/${titleSlug}-${propertyId.substring(0, 8)}`;

  for (let i = 0; i < Math.min(images.length, 15); i++) {
    try {
      const imgUrl = images[i];
      if (!imgUrl || !imgUrl.startsWith("http")) continue;

      const res = await fetch(imgUrl, {
        headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const filePath = `${basePath}/${i + 1}.${ext}`;

      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.warn(`Upload failed for image ${i}: ${uploadError.message}`);
        storedUrls.push(imgUrl); // fallback to original URL
        continue;
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/property-images/${filePath}`;
      storedUrls.push(publicUrl);
    } catch (e) {
      console.warn(`Failed to download image ${i}:`, e);
      storedUrls.push(images[i]); // fallback to original URL
    }
  }
  return storedUrls;
}

async function fetchPage(url: string): Promise<string> {
  console.log(`Fetching: ${url}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "nl-NL,nl;q=0.9",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    const text = await response.text();
    console.log(`Fetched ${text.length} characters from ${url}`);
    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function deduplicateUrls(properties: ScrapedProperty[]): ScrapedProperty[] {
  return [...new Map(properties.map((p) => [p.source_url, p])).values()];
}

// ============ WOONIEZIE SCRAPER (via JSON API) ============

async function scrapeWooniezie(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    // Wooniezie uses an AngularJS app that loads data from a JSON API
    const rawText = await fetchPage(
      "https://www.wooniezie.nl/portal/object/frontend/getallobjects/format/json"
    );

    // The response is JSON wrapped in HTML tags sometimes, extract the JSON
    let jsonStr = rawText;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const data = JSON.parse(jsonStr);

    // Log ALL top-level keys to understand the structure
    console.log(`Wooniezie API top-level keys: ${JSON.stringify(Object.keys(data))}`);
    for (const key of Object.keys(data)) {
      const val = data[key];
      const type = Array.isArray(val) ? `array(${val.length})` : typeof val;
      const preview = typeof val === 'string' ? val.substring(0, 200) : '';
      console.log(`Key "${key}": type=${type}, preview=${preview}`);
    }

    // Parse sAngularServiceData
    let serviceData: unknown[] = [];
    if (data.sAngularServiceData) {
      serviceData = JSON.parse(data.sAngularServiceData);
    }

    // Also check for direct arrays like aObjecten, result, dwellings etc
    // deno-lint-ignore no-explicit-any
    let dwellings: any[] = [];

    // Check if data itself has dwelling arrays
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
        console.log(`Direct array "${key}" first item keys: ${JSON.stringify(Object.keys(val[0]).slice(0, 15))}`);
        if (val[0].street || val[0].straat || val[0].city || val[0].plaats || val[0].id) {
          dwellings = val;
          console.log(`Found dwellings in direct key "${key}"`);
          break;
        }
      }
    }

    // Check service data
    if (dwellings.length === 0) {
      for (const service of serviceData) {
        // deno-lint-ignore no-explicit-any
        const s = service as any;
        if (s.data?.objecten) {
          dwellings = s.data.objecten;
          break;
        }
        if (s.data?.dwellings) {
          dwellings = s.data.dwellings;
          break;
        }
      }
    }

    console.log(`Wooniezie API: found ${serviceData.length} service entries`);
    console.log(`Wooniezie: found ${dwellings.length} dwellings in API response`);

    // Log first service data structure for debugging
    if (serviceData.length > 0) {
      for (let i = 0; i < Math.min(serviceData.length, 5); i++) {
        // deno-lint-ignore no-explicit-any
        const s = serviceData[i] as any;
        const keys = s.data ? Object.keys(s.data).slice(0, 10) : [];
        console.log(`Service ${i}: url=${s.url}, data keys: ${JSON.stringify(keys)}, isArray: ${Array.isArray(s.data)}, length: ${Array.isArray(s.data) ? s.data.length : 'N/A'}`);
        if (Array.isArray(s.data) && s.data.length > 0) {
          console.log(`Service ${i} first item keys: ${JSON.stringify(Object.keys(s.data[0]).slice(0, 20))}`);
        }
      }
    }

    // deno-lint-ignore no-explicit-any
    for (const dwelling of dwellings) {
      try {
        const d = dwelling as Record<string, any>;

        const id = d.id || d.dwellingId || "";
        const streetName = d.street || d.straat || "";
        const houseNum = d.houseNumber || d.huisnummer || d.houseNumberAddition
          ? `${d.houseNumber || ""}${d.houseNumberAddition || ""}`.trim()
          : null;
        const cityName = d.city?.name || d.city || d.plaats || "";
        const postalCode = d.postalcode || d.postcode || null;

        // Build detail URL
        const isKoop = (d.rentBuy || "").toLowerCase() === "koop";
        const slug = `${streetName}-${houseNum || ""}-${cityName}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const detailUrl = isKoop
          ? `https://www.wooniezie.nl/aanbod/nu-te-koop/te-koop/details/${id}-${slug}`
          : `https://www.wooniezie.nl/aanbod/nu-te-huur/te-huur/details/${id}-${slug}`;

        // Images
        const images: string[] = [];
        if (d.pictures && Array.isArray(d.pictures)) {
          for (const pic of d.pictures) {
            const picUrl = typeof pic === "string"
              ? pic
              : pic.uri || pic.url || pic.path || "";
            if (picUrl) {
              const fullPicUrl = picUrl.startsWith("http")
                ? picUrl
                : `https://www.wooniezie.nl${picUrl}`;
              images.push(fullPicUrl);
            }
          }
        }

        // Price
        const price = isKoop
          ? (d.sellingPrice || d.koopprijs || d.price || d.totalPrice || null)
          : (d.totalRent || d.netRent || d.kaleHuur || d.totalPrice || d.price || null);

        // Surface area
        const surfaceArea = d.areaDwelling || d.oppervlakteWoning || d.surface || null;

        // Bedrooms
        const bedrooms = d.sleepingRoom?.amountOfRooms || d.aantalSlaapkamers || d.bedrooms || null;

        // Bathrooms
        const bathrooms = d.bathRoom?.amountOfRooms || d.aantalBadkamers || d.bathrooms || null;

        // Build year
        const buildYear = d.constructionYear || d.bouwjaar || d.buildYear || null;

        // Energy label
        const energyLabel = d.energielabel || d.energyLabel || d.energyIndex || null;

        // Property type mapping
        let propertyType: string | null = null;
        const typeStr = (d.dwellingType?.categorie || d.woningtype || d.type || "").toLowerCase();
        if (typeStr.includes("appartement")) propertyType = "appartement";
        else if (typeStr.includes("studio")) propertyType = "studio";
        else if (typeStr.includes("kamer")) propertyType = "kamer";
        else if (typeStr.includes("woning") || typeStr.includes("huis") || typeStr.includes("eengezins")) propertyType = "huis";

        // Listing type
        const listingType = isKoop ? "koop" : "huur";

        const title = [streetName, houseNum, cityName].filter(Boolean).join(" ");

        // Build rich description from all available fields
        const descParts: string[] = [];
        
        // Doelgroep / target group
        const targetGroup = d.targetGroup || d.doelgroep || d.dwellingType?.targetGroup || null;
        if (targetGroup) descParts.push(`Doelgroep: ${targetGroup}`);
        
        // Dwelling type
        if (d.dwellingType?.label || typeStr) descParts.push(`Woningtype: ${d.dwellingType?.label || typeStr}`);
        
        // Build year
        if (buildYear) descParts.push(`Bouwjaar: ${buildYear}`);
        
        // Energy label
        if (energyLabel) descParts.push(`Energielabel: ${energyLabel}`);
        
        // Heating
        const heating = d.heating || d.verwarming || d.heatingType || null;
        if (heating) descParts.push(`Verwarming: ${heating}`);
        
        // Solar panels
        if (d.solarPanels || d.zonnepanelen) descParts.push("Zonnepanelen: Ja");
        
        // Surface
        if (surfaceArea) descParts.push(`Oppervlakte woning: ${surfaceArea} m²`);
        
        // Living room area
        const livingRoomArea = d.areaLivingRoom || d.oppervlakteWoonkamer || null;
        if (livingRoomArea) descParts.push(`Oppervlakte woonkamer: ${livingRoomArea} m²`);
        
        // Bedrooms
        if (bedrooms) descParts.push(`Slaapkamers: ${bedrooms}`);
        
        // Bedroom areas
        const bedroomAreas = d.sleepingRoom?.areas || d.oppervlakteSlaapkamers || null;
        if (bedroomAreas) descParts.push(`Oppervlakte slaapkamer(s): ${bedroomAreas}`);
        
        // Kitchen
        const kitchen = d.kitchen || d.keuken || null;
        if (kitchen) descParts.push(`Keuken: ${typeof kitchen === 'string' ? kitchen : kitchen.type || 'Ja'}`);
        
        // Attic
        const attic = d.attic || d.zolder || null;
        if (attic) descParts.push(`Zolder: ${typeof attic === 'string' ? attic : 'Ja'}`);
        
        // Garden, balcony, storage
        if (d.garden) descParts.push("Tuin: Ja");
        if (d.balcony) descParts.push("Balkon: Ja");
        if (d.storage || d.berging) descParts.push("Berging: Ja");
        if (d.elevator) descParts.push("Lift: Ja");
        if (d.parking) descParts.push("Parkeren: Ja");
        
        // Zero-step / nultreden
        if (d.zeroStep || d.nultreden || d.accessible) descParts.push("Nultreden woning");
        
        // Neighborhood
        if (d.neighborhood?.name) descParts.push(`Wijk: ${d.neighborhood.name}`);
        
        // Available from
        const availableFrom = d.availableFromDate || d.beschikbaarVanaf || null;
        if (availableFrom) descParts.push(`Beschikbaar vanaf: ${availableFrom}`);
        
        // Costs breakdown
        const netRent = d.netRent || d.kaleHuur || null;
        const serviceCosts = d.serviceCosts || d.servicekosten || null;
        if (netRent) descParts.push(`Kale huurprijs: €${netRent}`);
        if (serviceCosts) descParts.push(`Servicekosten: €${serviceCosts}`);

        // Use full description text if available, otherwise use built parts
        const fullDescription = d.description || d.omschrijving || null;
        const descriptionText = fullDescription 
          ? `${descParts.join(" • ")}\n\n${fullDescription}`
          : descParts.length > 0 ? descParts.join(" • ") : null;

        // Corporation / aanbieder info
        const corporationName = d.corporation?.name || d.aanbieder || d.owner?.name || null;
        const corporationLogo = d.corporation?.logo || d.corporation?.logoUrl || null;

        if (!title) continue;

        properties.push({
          source_url: detailUrl,
          source_site: "wooniezie",
          title,
          price: typeof price === "number" ? price : null,
          city: cityName || null,
          postal_code: postalCode,
          street: streetName || null,
          house_number: houseNum,
          surface_area: typeof surfaceArea === "number" ? surfaceArea : null,
          bedrooms: typeof bedrooms === "number" ? bedrooms : null,
          property_type: propertyType,
          listing_type: listingType,
          description: descriptionText,
          images,
          raw_data: {
            wooniezie_id: id,
            energy_label: energyLabel,
            build_year: buildYear,
            bathrooms: typeof bathrooms === "number" ? bathrooms : null,
            neighborhood: d.neighborhood?.name || d.wijk || null,
            dwelling_type: d.dwellingType?.label || typeStr || null,
            corporation_name: corporationName,
            corporation_logo: corporationLogo,
            target_group: targetGroup,
            heating: heating,
            solar_panels: d.solarPanels || d.zonnepanelen || false,
            balcony: d.balcony || false,
            garden: d.garden || false,
            parking: d.parking || false,
            elevator: d.elevator || false,
            storage: d.storage || d.berging || false,
            accessible: d.zeroStep || d.nultreden || d.accessible || false,
            floor: d.floor || null,
            living_room_area: livingRoomArea,
            kitchen: kitchen,
            attic: attic,
            available_from: availableFrom,
            net_rent: netRent,
            service_costs: serviceCosts,
            floorplans: d.floorplans || d.plattegronden || null,
          },
        });
      } catch (itemError) {
        console.error("Error parsing Wooniezie dwelling:", itemError);
      }
    }

    console.log(`Wooniezie: parsed ${properties.length} listings with full data`);
  } catch (e) {
    console.error("Error scraping Wooniezie:", e);
  }
  return deduplicateUrls(properties);
}

// ============ OTHER SCRAPERS ============

async function scrapePararius(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.pararius.nl/huurwoningen/nederland");
    const listingMatches = html.matchAll(
      /href="(\/(?:huis|appartement|studio|kamer)-te-huur\/[^"]+\/[a-f0-9-]+\/[^"]+)"/gi
    );

    for (const match of listingMatches) {
      const url = match[1];
      if (url.includes("/pagina/") || url.includes("?") || url.endsWith("/nederland")) continue;

      const fullUrl = `https://www.pararius.nl${url}`;
      let propertyType = null;
      if (url.includes("/huis-")) propertyType = "huis";
      else if (url.includes("/appartement-")) propertyType = "appartement";
      else if (url.includes("/studio-")) propertyType = "studio";
      else if (url.includes("/kamer-")) propertyType = "kamer";

      const pathParts = url.split("/");
      const city = pathParts.length >= 3 ? pathParts[2] : null;

      properties.push({
        source_url: fullUrl,
        source_site: "pararius",
        title: `Huurwoning ${city || "Pararius"}`,
        price: null,
        city: city ? city.charAt(0).toUpperCase() + city.slice(1) : null,
        postal_code: null, street: null, house_number: null,
        surface_area: null, bedrooms: null,
        property_type: propertyType,
        listing_type: "huur",
        description: null, images: [],
        raw_data: { url },
      });
    }
    console.log(`Pararius: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Pararius:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeKamernet(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    // Kamernet is a Next.js app - __NEXT_DATA__ contains listing data
    const html = await fetchPage("https://kamernet.nl/huren/kamers-nederland?pageNo=1&sort=1");

    // Extract __NEXT_DATA__ JSON
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1]);
      const pageProps = nextData?.props?.pageProps;
      // Try multiple paths to find listings
      const listings = pageProps?.listings || pageProps?.searchResults?.listings || pageProps?.data?.listings || pageProps?.initialListings || [];

      console.log(`Kamernet __NEXT_DATA__: found ${listings.length} listings, pageProps keys: ${JSON.stringify(Object.keys(pageProps || {}))}`);
      if (listings.length > 0) {
        console.log(`Kamernet first listing keys: ${JSON.stringify(Object.keys(listings[0]))}`);
        console.log(`Kamernet first listing sample: ${JSON.stringify(listings[0]).substring(0, 500)}`);
      }

      // deno-lint-ignore no-explicit-any
      for (const listing of listings as any[]) {
        try {
          const id = listing.id || listing.listingId || "";
          const title = listing.dutchTitle || listing.englishTitle || listing.title || `Kamer ${listing.city || ""}`;
          const city = listing.city || listing.cityName || null;
          const street = listing.street || listing.streetName || null;
          const postalCode = listing.postalCode || listing.zipCode || null;
          const price = listing.rent || listing.price || listing.monthlyRent || null;
          const surfaceArea = listing.surfaceArea || listing.size || listing.surface || null;
          const listingUrl = listing.url || (id ? `https://kamernet.nl/huren/kamer-${(city || "").toLowerCase().replace(/\s+/g, "-")}/${(street || "").toLowerCase().replace(/\s+/g, "-")}/kamer-${id}` : null);

          if (!listingUrl) continue;
          const fullUrl = listingUrl.startsWith("http") ? listingUrl : `https://kamernet.nl${listingUrl}`;

          // Images
          const images: string[] = [];
          if (listing.image && Array.isArray(listing.image)) {
            for (const img of listing.image) {
              const imgUrl = typeof img === "string" ? img : (img.url || img.src || img.path || "");
              if (imgUrl) images.push(imgUrl.startsWith("http") ? imgUrl : `https://resources.kamernet.nl${imgUrl}`);
            }
          } else if (listing.image && typeof listing.image === "string") {
            images.push(listing.image.startsWith("http") ? listing.image : `https://resources.kamernet.nl${listing.image}`);
          } else if (listing.thumbnail) {
            const thumb = typeof listing.thumbnail === "string" ? listing.thumbnail : (listing.thumbnail.url || "");
            if (thumb) images.push(thumb.startsWith("http") ? thumb : `https://resources.kamernet.nl${thumb}`);
          }

          // Property type
          let propertyType: string | null = "kamer";
          const typeStr = String(listing.listingType || listing.propertyType || listing.type || "").toLowerCase();
          if (typeStr.includes("appartement") || typeStr.includes("apartment")) propertyType = "appartement";
          else if (typeStr.includes("studio")) propertyType = "studio";
          else if (typeStr.includes("huis") || typeStr.includes("house")) propertyType = "huis";

          const description = listing.dutchDescription || listing.englishDescription || listing.description || null;

          properties.push({
            source_url: fullUrl,
            source_site: "kamernet",
            title,
            price: typeof price === "number" ? price : (price ? parseFloat(String(price)) : null),
            city,
            postal_code: postalCode,
            street,
            house_number: listing.houseNumber || listing.houseNr || null,
            surface_area: typeof surfaceArea === "number" ? surfaceArea : null,
            bedrooms: listing.bedrooms || 1,
            property_type: propertyType,
            listing_type: "huur",
            description,
            images,
            raw_data: {
              kamernet_id: id,
              available_from: listing.availableFrom || listing.moveInDate || null,
              landlord: listing.landlordName || listing.landlord || null,
              furnished: listing.furnished ?? listing.isFurnished ?? null,
              roommates: listing.currentResidents || listing.roommates || null,
              gender_preference: listing.genderPreference || listing.preferredGender || null,
            },
          });
        } catch (itemError) {
          console.error("Error parsing Kamernet listing:", itemError);
        }
      }
    } else {
      console.log("Kamernet: __NEXT_DATA__ not found, falling back to URL extraction");
      // Fallback
      const cardMatches = html.matchAll(/href="(\/huren\/kamer-[^"]+\/kamer-(\d+))"/gi);
      for (const match of cardMatches) {
        properties.push({
          source_url: `https://kamernet.nl${match[1]}`,
          source_site: "kamernet",
          title: "Kamer Kamernet",
          price: null, city: null, postal_code: null, street: null, house_number: null,
          surface_area: null, bedrooms: 1,
          property_type: "kamer", listing_type: "huur",
          description: null, images: [],
          raw_data: { kamernet_id: match[2] },
        });
      }
    }

    console.log(`Kamernet: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Kamernet:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeHuurwoningen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.huurwoningen.nl/aanbod-huurwoningen/");
    const listingMatches = html.matchAll(
      /href="(https:\/\/www\.huurwoningen\.nl\/huren\/([^\/]+)\/([^\/]+)\/([^\/]+)\/)"/gi
    );

    for (const match of listingMatches) {
      properties.push({
        source_url: match[1],
        source_site: "huurwoningen",
        title: `${match[4].replace(/-/g, " ")} - ${match[2]}`,
        price: null,
        city: match[2].charAt(0).toUpperCase() + match[2].slice(1),
        postal_code: null,
        street: match[4].replace(/-/g, " "),
        house_number: null,
        surface_area: null, bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null, images: [],
        raw_data: {},
      });
    }
    console.log(`Huurwoningen.nl: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Huurwoningen.nl:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeDirectWonen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://directwonen.nl/huurwoningen-huren/nederland");
    const listingMatches = html.matchAll(
      /href="(https:\/\/directwonen\.nl\/huurwoningen-huren\/([^\/]+)\/([^\/]+)\/([\w]+-\d+))"/gi
    );

    for (const match of listingMatches) {
      const typePart = match[4].split("-")[0];
      let propertyType = null;
      if (typePart === "appartement") propertyType = "appartement";
      else if (typePart === "woning" || typePart === "huis") propertyType = "huis";
      else if (typePart === "studio") propertyType = "studio";
      else if (typePart === "kamer") propertyType = "kamer";

      properties.push({
        source_url: match[1],
        source_site: "directwonen",
        title: `${match[3].replace(/-/g, " ")}, ${match[2]}`,
        price: null,
        city: match[2].charAt(0).toUpperCase() + match[2].slice(1).replace(/-/g, " "),
        postal_code: null,
        street: match[3].replace(/-/g, " "),
        house_number: null,
        surface_area: null, bedrooms: null,
        property_type: propertyType,
        listing_type: "huur",
        description: null, images: [],
        raw_data: { typeId: match[4] },
      });
    }
    console.log(`DirectWonen: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping DirectWonen:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeVesteda(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.vesteda.com/nl/huurwoningen");
    const listingMatches = html.matchAll(
      /href="(https:\/\/www\.vesteda\.com\/nl\/huurwoningen-[^"]+\/[^"]+\/[^"]+)"/gi
    );

    for (const match of listingMatches) {
      const fullUrl = match[1];
      if (fullUrl.includes("?") || fullUrl.endsWith("/huurwoningen")) continue;

      properties.push({
        source_url: fullUrl,
        source_site: "vesteda",
        title: "Huurwoning Vesteda",
        price: null,
        city: null, postal_code: null, street: null, house_number: null,
        surface_area: null, bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null, images: [],
        raw_data: {},
      });
    }
    console.log(`Vesteda: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Vesteda:", e);
  }
  return deduplicateUrls(properties);
}

function blockedScraper(name: string, reason: string) {
  return async (): Promise<ScrapedProperty[]> => {
    console.log(`${name}: ${reason}`);
    return [];
  };
}

// ============ MAIN HANDLER ============

const scraperMap: Record<string, () => Promise<ScrapedProperty[]>> = {
  wooniezie: scrapeWooniezie,
  pararius: scrapePararius,
  kamernet: scrapeKamernet,
  "huurwoningen.nl": scrapeHuurwoningen,
  directwonen: scrapeDirectWonen,
  vesteda: scrapeVesteda,
  funda: blockedScraper("Funda", "Cloudflare-beschermd"),
  "jaap.nl": blockedScraper("Jaap.nl", "Cloudflare-beschermd"),
  housinganywhere: blockedScraper("HousingAnywhere", "SPA/JavaScript-gerenderd"),
  "123wonen": blockedScraper("123Wonen", "JavaScript-gerenderd"),
  "de key": blockedScraper("De Key", "Geblokkeerd"),
  nederwoon: blockedScraper("Nederwoon", "404"),
  rochdale: blockedScraper("Rochdale", "404"),
  woonbron: blockedScraper("Woonbron", "JavaScript-gerenderd"),
  "woonstad rotterdam": blockedScraper("Woonstad Rotterdam", "JavaScript-gerenderd"),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { scraper_id } = await req.json();

    if (!scraper_id) {
      return new Response(
        JSON.stringify({ success: false, error: "scraper_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase configuration");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: scraper, error: scraperError } = await supabase
      .from("scrapers")
      .select("*")
      .eq("id", scraper_id)
      .single();

    if (scraperError || !scraper) {
      return new Response(
        JSON.stringify({ success: false, error: "Scraper not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting scraper: ${scraper.name}`);

    let properties: ScrapedProperty[] = [];
    let errorMessage: string | null = null;

    try {
      const scraperName = scraper.name.toLowerCase();
      const scraperFn = scraperMap[scraperName];

      if (scraperFn) {
        properties = await scraperFn();
        console.log(`Scraped ${properties.length} properties from ${scraper.name}`);
        if (properties.length === 0) {
          errorMessage = `Geen woningen gevonden voor ${scraper.name}`;
        }
      } else {
        errorMessage = `Geen implementatie voor: ${scraper.name}`;
      }
    } catch (scrapeError) {
      errorMessage = scrapeError instanceof Error ? scrapeError.message : "Unknown scrape error";
      console.error("Scrape error:", errorMessage);
    }

    const durationMs = Date.now() - startTime;

    let published = 0;
    let skippedDuplicates = 0;

    if (properties.length > 0) {
      // Get all existing source_urls for this site to deduplicate
      const sourceUrls = properties.map((p) => p.source_url);
      const { data: existingUrls } = await supabase
        .from("scraped_properties")
        .select("source_url")
        .in("source_url", sourceUrls);

      const existingSet = new Set((existingUrls || []).map((e) => e.source_url));

      // Update last_seen_at for existing approved ones
      if (existingSet.size > 0) {
        await supabase
          .from("scraped_properties")
          .update({ last_seen_at: new Date().toISOString() })
          .in("source_url", [...existingSet])
          .eq("status", "approved");
        skippedDuplicates = existingSet.size;
      }

      // Filter to only new properties
      const newProperties = properties.filter((p) => !existingSet.has(p.source_url));
      console.log(`${newProperties.length} new, ${skippedDuplicates} duplicates skipped`);

      if (newProperties.length > 0) {
        // Insert into scraped_properties as approved
        const { data: inserted, error: insertError } = await supabase
          .from("scraped_properties")
          .insert(newProperties.map((p) => ({ ...p, scraper_id, status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: SYSTEM_USER_ID, last_seen_at: new Date().toISOString() })))
          .select("id, title, description, price, city, street, house_number, postal_code, property_type, listing_type, bedrooms, bathrooms, surface_area, images, raw_data, source_url");

        if (insertError) {
          console.error("Error inserting scraped properties:", insertError);
          errorMessage = insertError.message;
        }

        // Auto-publish each new property to properties table
        if (inserted) {
          const validEnergyLabels = ["A++", "A+", "A", "B", "C", "D", "E", "F", "G"];

          for (const sp of inserted) {
            if (!sp.title || !sp.city || !sp.street || !sp.house_number || !sp.postal_code || !sp.price) {
              continue;
            }

            let propertyType = "appartement";
            if (["appartement", "huis", "studio", "kamer"].includes(sp.property_type || "")) {
              propertyType = sp.property_type!;
            }

            let listingType = "huur";
            if (["huur", "koop"].includes(sp.listing_type || "")) {
              listingType = sp.listing_type!;
            }

            // Extract from raw_data
            const rawData = (sp.raw_data || {}) as Record<string, unknown>;
            let energyLabel: string | null = null;
            const rawEl = String(rawData.energy_label || "");
            if (rawEl) {
              const cleaned = rawEl.replace(/energielabel\s*/i, "").trim().toUpperCase();
              if (validEnergyLabels.includes(cleaned)) energyLabel = cleaned;
            }
            const buildYear = rawData.build_year ? Number(rawData.build_year) : null;
            const bathrooms = sp.bathrooms || (rawData.bathrooms ? Number(rawData.bathrooms) : null);

            // Geocode
            let latitude: number | null = null;
            let longitude: number | null = null;
            try {
              const address = `${sp.street} ${sp.house_number}, ${sp.postal_code} ${sp.city}, Netherlands`;
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
                { headers: { "User-Agent": "WoningPlatform/1.0" } }
              );
              const geoData = await geoRes.json();
              if (geoData && geoData.length > 0) {
                latitude = parseFloat(geoData[0].lat);
                longitude = parseFloat(geoData[0].lon);
              }
            } catch (_e) { /* skip geocoding errors */ }

            // Upload images to own storage
            const tempId = crypto.randomUUID();
            const storedImages = (sp.images && sp.images.length > 0)
              ? await uploadImagesToStorage(supabase, supabaseUrl!, sp.images as string[], sp.city!, sp.title, tempId)
              : [];

            const { data: newProp, error: pubError } = await supabase
              .from("properties")
              .insert({
                title: sp.title,
                description: sp.description || null,
                price: sp.price,
                city: sp.city,
                street: sp.street,
                house_number: sp.house_number,
                postal_code: sp.postal_code,
                property_type: propertyType,
                listing_type: listingType,
                bedrooms: sp.bedrooms || null,
                bathrooms,
                surface_area: sp.surface_area || null,
                images: storedImages,
                user_id: SYSTEM_USER_ID,
                status: "actief",
                latitude,
                longitude,
                energy_label: energyLabel,
                build_year: buildYear && buildYear > 1800 && buildYear < 2030 ? buildYear : null,
              })
              .select("id")
              .single();

            if (!pubError && newProp) {
              await supabase
                .from("scraped_properties")
                .update({ published_property_id: newProp.id })
                .eq("id", sp.id);
              published++;
            }
          }
          console.log(`Auto-published ${published} properties`);
        }
      }
    }

    const logStatus = errorMessage ? "error" : properties.length === 0 ? "warning" : "success";
    await supabase.from("scraper_logs").insert({
      scraper_id,
      status: logStatus,
      message: errorMessage || `Scraped ${properties.length}, published ${published}, dupes ${skippedDuplicates}`,
      properties_scraped: published,
      duration_ms: durationMs,
    });

    await supabase
      .from("scrapers")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: logStatus,
        properties_found: (scraper.properties_found || 0) + published,
      })
      .eq("id", scraper_id);

    return new Response(
      JSON.stringify({
        success: !errorMessage && properties.length > 0,
        properties_scraped: properties.length,
        published,
        duplicates_skipped: skippedDuplicates,
        duration_ms: durationMs,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in run-scraper:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
