import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_USER_ID = "0d02a609-fde3-435a-9154-078fdce7ed34";
const SITE_URL = "https://www.woonpeek.nl";
const INDEXNOW_KEY = "b8f3e2a1d4c5f6e7a9b0c1d2e3f4a5b6";

async function submitToIndexNow(urls: string[]) {
  if (urls.length === 0) return;
  try {
    const body = {
      host: "www.woonpeek.nl",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls.slice(0, 10000),
    };
    const resp = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    console.log(`IndexNow: submitted ${urls.length} URLs, status ${resp.status}`);
  } catch (e) {
    console.error("IndexNow submission error:", e);
  }
}

function stripHtml(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function mapPropertyType(typeStr: string): "appartement" | "huis" | "studio" | "kamer" {
  const t = (typeStr || "").toLowerCase();
  if (t.includes("appartement") || t.includes("flat") || t.includes("etage")) return "appartement";
  if (t.includes("studio")) return "studio";
  if (t.includes("kamer") || t.includes("room")) return "kamer";
  if (t.includes("woning") || t.includes("huis") || t.includes("maisonette") || t.includes("eengezins") || t.includes("villa") || t.includes("tussenwoning") || t.includes("hoekwoning")) return "huis";
  return "appartement";
}

function mapListingType(typeStr: string): "huur" | "koop" {
  const t = (typeStr || "").toLowerCase();
  if (t.includes("koop") || t.includes("buy") || t.includes("sale") || t.includes("te koop")) return "koop";
  return "huur";
}

function parseEnergyLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  const clean = label.toUpperCase().trim();
  const valid = ["A++", "A+", "A", "B", "C", "D", "E", "F", "G"];
  if (valid.includes(clean)) return clean;
  if (clean.includes("A++")) return "A++";
  if (clean.includes("A+")) return "A+";
  for (const v of valid) {
    if (clean.includes(v)) return v;
  }
  return null;
}

interface XmlProperty {
  title?: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  price?: number;
  listing_type?: string;
  property_type?: string;
  surface_area?: number;
  bedrooms?: number;
  bathrooms?: number;
  energy_label?: string;
  build_year?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
  source_url?: string;
  description?: string;
  neighborhood?: string;
}

// Parse XML feed - handles common Dutch real estate XML formats (Pararius, Realworks, etc.)
function parseXmlFeed(xmlText: string): XmlProperty[] {
  const properties: XmlProperty[] = [];

  // Try to find property items - support various tag names
  const itemPatterns = [
    /<(?:property|object|woning|item|listing|dwelling|pand)[\s>]([\s\S]*?)<\/(?:property|object|woning|item|listing|dwelling|pand)>/gi,
  ];

  let items: string[] = [];
  for (const pattern of itemPatterns) {
    const matches = xmlText.matchAll(pattern);
    for (const m of matches) {
      items.push(m[0]);
    }
    if (items.length > 0) break;
  }

  if (items.length === 0) {
    console.log("No property items found in XML, trying root-level parsing...");
    // Maybe it's a flat structure
    items = [xmlText];
  }

  for (const itemXml of items) {
    const prop: XmlProperty = {};

    // Helper to extract text from XML tag
    const getTag = (names: string[]): string | null => {
      for (const name of names) {
        const re = new RegExp(`<${name}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${name}>`, "i");
        const match = itemXml.match(re);
        if (match) return match[1].trim();

        const re2 = new RegExp(`<${name}[^>]*>([^<]*)<\\/${name}>`, "i");
        const match2 = itemXml.match(re2);
        if (match2) return match2[1].trim();
      }
      return null;
    };

    const getNum = (names: string[]): number | null => {
      const val = getTag(names);
      if (!val) return null;
      const n = parseFloat(val.replace(/[^0-9.,]/g, "").replace(",", "."));
      return isNaN(n) ? null : n;
    };

    // Extract fields - support many naming variants
    prop.title = getTag(["title", "titel", "naam", "name", "adres", "address"]);
    prop.street = getTag(["street", "straat", "streetname", "straatnaam"]);
    prop.house_number = getTag(["housenumber", "house_number", "huisnummer", "number", "nummer"]);
    prop.city = getTag(["city", "stad", "plaats", "woonplaats", "town", "municipality"]);
    prop.postal_code = getTag(["postalcode", "postal_code", "postcode", "zipcode", "zip"]);
    prop.price = getNum(["price", "prijs", "huurprijs", "koopprijs", "rent", "askingprice", "asking_price"]);
    prop.surface_area = getNum(["surface", "surface_area", "oppervlakte", "area", "woonoppervlakte", "living_area", "livingarea"]);
    prop.bedrooms = getNum(["bedrooms", "slaapkamers", "aantalSlaapkamers", "bedroom_count"]);
    prop.bathrooms = getNum(["bathrooms", "badkamers", "aantalBadkamers", "bathroom_count"]);
    prop.build_year = getNum(["buildyear", "build_year", "bouwjaar", "constructionyear", "construction_year"]);
    prop.latitude = getNum(["latitude", "lat", "breedtegraad"]);
    prop.longitude = getNum(["longitude", "lon", "lng", "lengtegraad"]);
    prop.neighborhood = getTag(["neighborhood", "wijk", "buurt", "district"]);

    const listingTypeStr = getTag(["listingtype", "listing_type", "transactietype", "type", "soort", "koophuur", "rent_buy"]);
    if (listingTypeStr) prop.listing_type = listingTypeStr;

    const propTypeStr = getTag(["propertytype", "property_type", "woningtype", "objecttype", "dwelling_type", "categorie"]);
    if (propTypeStr) prop.property_type = propTypeStr;

    const energyStr = getTag(["energylabel", "energy_label", "energielabel", "energy"]);
    if (energyStr) prop.energy_label = energyStr;

    const descStr = getTag(["description", "beschrijving", "omschrijving", "tekst", "text"]);
    if (descStr) prop.description = descStr;

    prop.source_url = getTag(["url", "link", "detailurl", "detail_url", "pageurl", "page_url", "deeplink"]);

    // Images
    const images: string[] = [];
    // Pattern 1: <image>url</image> or <photo>url</photo>
    const imgPatterns = [
      /<(?:image|photo|foto|picture|media|img)[^>]*>(?:<!\[CDATA\[)?(https?:\/\/[^\]<\s]+)(?:\]\]>)?<\/(?:image|photo|foto|picture|media|img)>/gi,
      /<(?:image|photo|foto)_?\d*[^>]*>(?:<!\[CDATA\[)?(https?:\/\/[^\]<\s]+)(?:\]\]>)?<\/(?:image|photo|foto)_?\d*>/gi,
    ];
    for (const pattern of imgPatterns) {
      const matches = itemXml.matchAll(pattern);
      for (const m of matches) {
        if (m[1] && !images.includes(m[1])) images.push(m[1]);
      }
    }
    // Pattern 2: <images><url>...</url></images>
    const imgBlockMatch = itemXml.match(/<(?:images|photos|fotos|media)[^>]*>([\s\S]*?)<\/(?:images|photos|fotos|media)>/i);
    if (imgBlockMatch) {
      const urlMatches = imgBlockMatch[1].matchAll(/<(?:url|src|path)[^>]*>(?:<!\[CDATA\[)?(https?:\/\/[^\]<\s]+)(?:\]\]>)?<\/(?:url|src|path)>/gi);
      for (const m of urlMatches) {
        if (m[1] && !images.includes(m[1])) images.push(m[1]);
      }
    }
    if (images.length > 0) prop.images = images;

    // Skip if we don't have minimum data
    if (!prop.city && !prop.street && !prop.source_url) continue;

    properties.push(prop);
  }

  return properties;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const { scraper_id, feed_url } = body;

    // If no specific scraper_id, fetch all active makelaar scrapers
    let scrapers: any[] = [];
    if (scraper_id) {
      const { data } = await supabase
        .from("scrapers")
        .select("*")
        .eq("id", scraper_id)
        .single();
      if (data) scrapers = [data];
    } else {
      const { data } = await supabase
        .from("scrapers")
        .select("*")
        .eq("is_active", true)
        .like("description", "%makelaar-feed%");
      scrapers = data || [];
    }

    // Also allow direct feed_url for testing
    if (scrapers.length === 0 && feed_url) {
      scrapers = [{ id: "test", name: "Direct feed", config: { feed_url }, is_active: true }];
    }

    if (scrapers.length === 0) {
      return new Response(JSON.stringify({ message: "No active makelaar feeds found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let grandTotalImported = 0;
    let grandTotalSkipped = 0;
    let grandTotalErrors = 0;
    const allIndexNowUrls: string[] = [];

    for (const scraper of scrapers) {
      const feedUrl = scraper.config?.feed_url || feed_url;
      if (!feedUrl) {
        console.log(`Scraper ${scraper.name}: no feed_url configured, skipping`);
        continue;
      }

      const sourceSite = scraper.config?.source_name || scraper.name;
      console.log(`Importing from ${sourceSite}: ${feedUrl}`);

      let totalImported = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      try {
        const response = await fetch(feedUrl, {
          headers: { Accept: "application/xml, text/xml, */*" },
        });

        if (!response.ok) {
          console.error(`Feed error for ${sourceSite}: ${response.status}`);
          totalErrors++;
          continue;
        }

        const xmlText = await response.text();
        console.log(`Feed ${sourceSite}: received ${xmlText.length} bytes`);

        const parsed = parseXmlFeed(xmlText);
        console.log(`Feed ${sourceSite}: parsed ${parsed.length} properties`);

        for (const item of parsed) {
          try {
            const sourceUrl = item.source_url || `${feedUrl}#${item.street}-${item.house_number}-${item.city}`;

            // Check if already exists
            const { data: existing } = await supabase
              .from("properties")
              .select("id, slug")
              .eq("source_url", sourceUrl)
              .maybeSingle();

            if (existing) {
              totalSkipped++;
              continue;
            }

            const street = item.street || "Onbekend";
            const houseNumber = item.house_number || "";
            const city = item.city || "Onbekend";
            const title = item.title || `${street} ${houseNumber}, ${city}`;

            const propertyData = {
              title,
              street,
              house_number: houseNumber || "-",
              city,
              postal_code: item.postal_code || "0000AA",
              neighborhood: item.neighborhood || null,
              price: item.price || 0,
              listing_type: mapListingType(item.listing_type || ""),
              property_type: mapPropertyType(item.property_type || ""),
              surface_area: item.surface_area || null,
              bedrooms: item.bedrooms || null,
              bathrooms: item.bathrooms || null,
              energy_label: parseEnergyLabel(item.energy_label),
              build_year: item.build_year || null,
              latitude: item.latitude || null,
              longitude: item.longitude || null,
              images: item.images || [],
              source_url: sourceUrl,
              source_site: sourceSite,
              user_id: SYSTEM_USER_ID,
              status: "actief" as const,
              description: stripHtml(item.description),
            };

            const { data: inserted, error } = await supabase
              .from("properties")
              .insert(propertyData)
              .select("slug")
              .single();

            if (error) {
              if (error.code === "23505") {
                totalSkipped++;
              } else {
                console.error(`Insert error: ${error.message}`);
                totalErrors++;
              }
            } else {
              totalImported++;
              if (inserted?.slug) {
                allIndexNowUrls.push(`${SITE_URL}/woning/${inserted.slug}`);
              }
            }
          } catch (e) {
            console.error(`Error processing property:`, e);
            totalErrors++;
          }
        }

        // Update scraper stats
        if (scraper.id !== "test") {
          await supabase
            .from("scrapers")
            .update({
              last_run_at: new Date().toISOString(),
              last_run_status: totalErrors > 0 ? "partial" : "success",
              properties_found: (scraper.properties_found || 0) + totalImported,
            })
            .eq("id", scraper.id);

          // Log
          await supabase.from("scraper_logs").insert({
            scraper_id: scraper.id,
            status: totalErrors > 0 ? "partial" : "success",
            properties_scraped: totalImported,
            message: `Imported: ${totalImported}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`,
          });
        }

        console.log(`${sourceSite}: imported=${totalImported}, skipped=${totalSkipped}, errors=${totalErrors}`);
      } catch (e) {
        console.error(`Feed ${sourceSite} failed:`, e);
        totalErrors++;
      }

      grandTotalImported += totalImported;
      grandTotalSkipped += totalSkipped;
      grandTotalErrors += totalErrors;
    }

    // Submit new URLs to IndexNow
    if (allIndexNowUrls.length > 0) {
      await submitToIndexNow(allIndexNowUrls);
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: grandTotalImported,
        skipped: grandTotalSkipped,
        errors: grandTotalErrors,
        feeds_processed: scrapers.length,
        indexed: allIndexNowUrls.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Makelaar feed import error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
