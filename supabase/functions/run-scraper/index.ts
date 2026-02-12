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

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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
        const slug = `${streetName}-${houseNum || ""}-${cityName}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const detailUrl = `https://www.wooniezie.nl/aanbod/nu-te-huur/te-huur/details/${id}-${slug}`;

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
        const price = d.totalRent || d.netRent || d.kaleHuur || d.totalPrice || d.price || null;

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
        const listingType = (d.rentBuy || "").toLowerCase() === "koop" ? "koop" : "huur";

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
    const html = await fetchPage("https://kamernet.nl/huren/kamers-nederland");
    const patterns = [
      /href="(\/huren\/kamer-[^"]+)"/gi,
      /href="(\/en\/for-rent\/room-[^"]+)"/gi,
    ];

    for (const pattern of patterns) {
      for (const match of html.matchAll(pattern)) {
        let url = match[1];
        if (!url.startsWith("http")) url = `https://kamernet.nl${url}`;
        properties.push({
          source_url: url,
          source_site: "kamernet",
          title: "Kamer Kamernet",
          price: null,
          city: null, postal_code: null, street: null, house_number: null,
          surface_area: null, bedrooms: 1,
          property_type: "kamer",
          listing_type: "huur",
          description: null, images: [],
          raw_data: {},
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

    if (properties.length > 0) {
      const { error: insertError } = await supabase
        .from("scraped_properties")
        .insert(properties.map((p) => ({ ...p, scraper_id })));

      if (insertError) {
        console.error("Error inserting scraped properties:", insertError);
        errorMessage = insertError.message;
      }
    }

    const logStatus = errorMessage ? "error" : properties.length === 0 ? "warning" : "success";
    await supabase.from("scraper_logs").insert({
      scraper_id,
      status: logStatus,
      message: errorMessage || `Scraped ${properties.length} properties`,
      properties_scraped: properties.length,
      duration_ms: durationMs,
    });

    await supabase
      .from("scrapers")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: logStatus,
        properties_found: (scraper.properties_found || 0) + properties.length,
      })
      .eq("id", scraper_id);

    return new Response(
      JSON.stringify({
        success: !errorMessage && properties.length > 0,
        properties_scraped: properties.length,
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
