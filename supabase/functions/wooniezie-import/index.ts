import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WOONIEZIE_API_RENT = "https://www.wooniezie.nl/portal/object/frontend/getallobjects/format/json?configurationKey=rent";
const WOONIEZIE_API_BUY = "https://www.wooniezie.nl/portal/object/frontend/getallobjects/format/json?configurationKey=buy";
const WOONIEZIE_BASE = "https://www.wooniezie.nl";
const SOURCE_SITE = "Wooniezie";
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

interface WooniezieProperty {
  id: string;
  urlKey: string;
  street: string;
  houseNumber: string;
  houseNumberAddition?: string;
  postalcode: string;
  city: { name: string };
  municipality: { name: string };
  neighborhood?: { name: string };
  dwellingType: { localizedName: string; categorie: string };
  netRent: number;
  totalRent: number;
  sellingPrice: number;
  rentBuy: string;
  sleepingRoom?: { amountOfRooms: string };
  energyLabel?: { icon: string };
  constructionYear?: number;
  areaDwelling?: number;
  latitude: string;
  longitude: string;
  pictures: Array<{ uri: string; type: string }>;
  publicationDate: string;
  closingDate: string;
  availableFrom?: string;
  isGepubliceerd: boolean;
}

function parseEnergyLabel(icon: string | undefined): string | null {
  if (!icon) return null;
  const map: Record<string, string> = {
    "icon_label_a_plus_plus": "A++",
    "icon_label_a_plus": "A+",
    "icon_label_a": "A",
    "icon_label_b": "B",
    "icon_label_c": "C",
    "icon_label_d": "D",
    "icon_label_e": "E",
    "icon_label_f": "F",
    "icon_label_g": "G",
  };
  return map[icon] || null;
}

function mapPropertyType(dwellingType: string): "appartement" | "huis" | "studio" | "kamer" {
  const t = dwellingType.toLowerCase();
  if (t.includes("appartement") || t.includes("flat") || t.includes("etage")) return "appartement";
  if (t.includes("studio")) return "studio";
  if (t.includes("kamer") || t.includes("room")) return "kamer";
  if (t.includes("eengezins") || t.includes("woning") || t.includes("huis") || t.includes("maisonette")) return "huis";
  return "appartement";
}

function mapToProperty(item: WooniezieProperty) {
  const isRent = item.rentBuy === "Huur";
  const price = isRent ? item.totalRent || item.netRent : item.sellingPrice;
  const houseNumber = item.houseNumberAddition
    ? `${item.houseNumber} ${item.houseNumberAddition}`.trim()
    : item.houseNumber;

  const images = item.pictures
    .filter(p => p.uri)
    .map(p => p.uri.startsWith("http") ? p.uri : `${WOONIEZIE_BASE}${p.uri}`);

  const sourceUrl = `${WOONIEZIE_BASE}/aanbod/nu-te-huur/te-huur/details?dwellingID=${item.id}`;
  const title = `${item.street} ${houseNumber}, ${item.city.name}`;

  return {
    title,
    street: item.street,
    house_number: houseNumber,
    city: item.city.name,
    postal_code: item.postalcode,
    neighborhood: item.neighborhood?.name || null,
    price,
    listing_type: isRent ? "huur" as const : "koop" as const,
    property_type: mapPropertyType(item.dwellingType.localizedName),
    surface_area: item.areaDwelling && item.areaDwelling > 0 ? item.areaDwelling : null,
    bedrooms: item.sleepingRoom ? parseInt(item.sleepingRoom.amountOfRooms) || null : null,
    energy_label: parseEnergyLabel(item.energyLabel?.icon),
    build_year: item.constructionYear || null,
    latitude: item.latitude ? parseFloat(item.latitude) : null,
    longitude: item.longitude ? parseFloat(item.longitude) : null,
    images,
    source_url: sourceUrl,
    source_site: SOURCE_SITE,
    user_id: SYSTEM_USER_ID,
    status: "actief" as const,
    description: null,
  };
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
    const includeKoop = body.include_koop === true;

    const apis = [{ url: WOONIEZIE_API_RENT, type: "huur" }];
    if (includeKoop) {
      apis.push({ url: WOONIEZIE_API_BUY, type: "koop" });
    }

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalDeactivated = 0;
    const indexNowUrls: string[] = [];

    // Collect all active source URLs from the API
    const activeSourceUrls = new Set<string>();

    for (const api of apis) {
      console.log(`Fetching Wooniezie ${api.type}...`);

      const response = await fetch(api.url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        console.error(`Wooniezie API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const items: WooniezieProperty[] = data.result || [];

      console.log(`Wooniezie ${api.type}: ${items.length} listings found`);

      for (const item of items) {
        if (!item.isGepubliceerd) {
          totalSkipped++;
          continue;
        }

        const sourceUrl = `${WOONIEZIE_BASE}/aanbod/nu-te-huur/te-huur/details?dwellingID=${item.id}`;
        activeSourceUrls.add(sourceUrl);

        // Check if already exists
        const { data: existing } = await supabase
          .from("properties")
          .select("id, status")
          .eq("source_url", sourceUrl)
          .maybeSingle();

        if (existing) {
          // Reactivate if it was set to inactive
          if (existing.status === "inactief") {
            await supabase
              .from("properties")
              .update({ status: "actief", updated_at: new Date().toISOString() })
              .eq("id", existing.id);
            console.log(`Reactivated: ${sourceUrl}`);
          }
          totalSkipped++;
          continue;
        }

        const propertyData = mapToProperty(item);

        const { data: inserted, error: insertErr } = await supabase
          .from("properties")
          .insert(propertyData)
          .select("slug")
          .maybeSingle();

        if (insertErr) {
          console.error(`Insert error for "${propertyData.title}": ${insertErr.message}`);
          totalErrors++;
        } else {
          totalImported++;
          if (inserted?.slug) indexNowUrls.push(`${SITE_URL}/woning/${inserted.slug}`);
        }
      }
    }

    // Note: Deactivation is handled by the separate deactivate-properties function

    // Submit new URLs to IndexNow for instant indexing
    await submitToIndexNow(indexNowUrls);

    const { data: scraper } = await supabase
      .from("scrapers")
      .select("id, properties_found")
      .ilike("name", "%wooniezie%")
      .maybeSingle();

    if (scraper) {
      await supabase
        .from("scrapers")
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: totalErrors > 0 ? "partial" : "success",
          properties_found: (scraper.properties_found || 0) + totalImported,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scraper.id);

      await supabase.from("scraper_logs").insert({
        scraper_id: scraper.id,
        status: totalErrors > 0 ? "partial" : "success",
        properties_scraped: totalImported,
        message: `Imported ${totalImported}, skipped ${totalSkipped}, deactivated ${totalDeactivated}, errors ${totalErrors}`,
      });
    }

    console.log(`Wooniezie import done: ${totalImported} imported, ${totalSkipped} skipped, ${totalDeactivated} deactivated, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: totalImported,
        skipped: totalSkipped,
        deactivated: totalDeactivated,
        errors: totalErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Wooniezie scraper error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
