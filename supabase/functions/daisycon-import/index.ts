import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAISYCON_TOKEN_URL = "https://login.daisycon.com/oauth/access-token";
const DAISYCON_CLI_REDIRECT = "https://login.daisycon.com/oauth/cli";
const SYSTEM_USER_ID = "0d02a609-fde3-435a-9154-078fdce7ed34";

async function getValidAccessToken(supabase: any): Promise<string> {
  const { data: tokenRow, error } = await supabase
    .from("daisycon_tokens")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !tokenRow) {
    throw new Error("Daisycon not connected. Please authenticate first.");
  }

  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() < expiresAt - 2 * 60 * 1000) {
    return tokenRow.access_token;
  }

  console.log("Refreshing Daisycon access token...");
  const clientId = Deno.env.get("DAISYCON_CLIENT_ID")!;
  const clientSecret = Deno.env.get("DAISYCON_CLIENT_SECRET")!;

  const tokenResponse = await fetch(DAISYCON_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: DAISYCON_CLI_REDIRECT,
      refresh_token: tokenRow.refresh_token,
    }),
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Token refresh failed [${tokenResponse.status}]: ${errText}`);
  }

  const newTokens = await tokenResponse.json();

  await supabase
    .from("daisycon_tokens")
    .update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: new Date(Date.now() + 29 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", tokenRow.id);

  return newTokens.access_token;
}

interface DaisyconProduct {
  // Standard datafeed fields
  title?: string;
  description?: string;
  price?: number | string;
  price_old?: number | string;
  link?: string;
  link_url?: string;
  deeplink?: string;
  image_url?: string;
  image_large?: string;
  image_url_large?: string;
  additional_image_urls?: string[];
  extra_image_url_1?: string;
  extra_image_url_2?: string;
  extra_image_url_3?: string;
  city?: string;
  address?: string;
  street?: string;
  house_number?: string;
  housenumber?: string;
  zipcode?: string;
  postal_code?: string;
  postcode?: string;
  surface?: number | string;
  surface_area?: number | string;
  living_area?: number | string;
  woonoppervlakte?: string;
  rooms?: number | string;
  bedrooms?: number | string;
  slaapkamers?: string;
  bathrooms?: number | string;
  property_type?: string;
  type?: string;
  category?: string;
  listing_type?: string;
  rent_buy?: string;
  soort_aanbod?: string;
  in_stock?: string;
  [key: string]: unknown;
}

function mapDaisyconToProperty(product: DaisyconProduct, sourceSite: string) {
  const price = parseFloat(String(product.price || "0")) || 0;
  const street = product.street || product.address || "";
  const houseNumber = product.house_number || product.housenumber || "";
  const city = product.city || "";
  const postalCode = product.zipcode || product.postal_code || product.postcode || "";
  const surface = parseInt(String(product.surface || product.surface_area || product.living_area || product.woonoppervlakte || "0")) || null;
  const bedrooms = parseInt(String(product.bedrooms || product.slaapkamers || product.rooms || "0")) || null;
  const bathrooms = parseInt(String(product.bathrooms || "0")) || null;

  // Determine listing type
  let listingType: "huur" | "koop" = "huur";
  const rentBuy = String(product.rent_buy || product.listing_type || product.soort_aanbod || product.category || "").toLowerCase();
  if (rentBuy.includes("koop") || rentBuy.includes("buy") || rentBuy.includes("sale")) {
    listingType = "koop";
  }

  // Determine property type
  let propertyType: "appartement" | "huis" | "studio" | "kamer" = "appartement";
  const pType = String(product.property_type || product.type || product.category || "").toLowerCase();
  if (pType.includes("huis") || pType.includes("house") || pType.includes("woning") || pType.includes("villa") || pType.includes("tussenwoning") || pType.includes("hoekwoning")) {
    propertyType = "huis";
  } else if (pType.includes("studio")) {
    propertyType = "studio";
  } else if (pType.includes("kamer") || pType.includes("room")) {
    propertyType = "kamer";
  }

  // Collect images
  const images: string[] = [];
  const mainImage = product.image_large || product.image_url_large || product.image_url;
  if (mainImage) images.push(mainImage);
  if (product.additional_image_urls) {
    images.push(...product.additional_image_urls.slice(0, 9));
  }
  // Also check extra_image_url fields
  for (let i = 1; i <= 3; i++) {
    const extraImg = product[`extra_image_url_${i}`];
    if (typeof extraImg === "string" && extraImg) images.push(extraImg);
  }

  // Affiliate link as source URL - this is the link that earns commission
  const sourceUrl = product.link || product.link_url || product.deeplink || null;

  const title = product.title || `${street} ${houseNumber}, ${city}`.trim();

  return {
    title,
    street: street || "Onbekend",
    house_number: houseNumber || "-",
    city: city || "Onbekend",
    postal_code: postalCode || "0000AA",
    price,
    listing_type: listingType,
    property_type: propertyType,
    surface_area: surface,
    bedrooms,
    bathrooms,
    description: product.description || null,
    images,
    source_url: sourceUrl,
    source_site: sourceSite,
    user_id: SYSTEM_USER_ID,
    status: "actief" as const,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const publisherId = Deno.env.get("DAISYCON_PUBLISHER_ID");

    if (!publisherId) {
      throw new Error("DAISYCON_PUBLISHER_ID not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const feedId = body.feed_id;

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase);

    // Get active feeds
    let feedQuery = supabase.from("daisycon_feeds").select("*").eq("is_active", true);
    if (feedId) {
      feedQuery = feedQuery.eq("id", feedId);
    }
    const { data: feeds, error: feedsErr } = await feedQuery;
    if (feedsErr) throw feedsErr;

    if (!feeds || feeds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active feeds to import", imported: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalImported = 0;
    let totalSkipped = 0;
    const results: { feed: string; imported: number; skipped: number; error?: string }[] = [];

    for (const feed of feeds) {
      try {
        // Build the datafeed URL - the Daisycon datafeed endpoint doesn't need Bearer auth
        // It uses program_id and media_id as authentication
        const feedUrl = feed.feed_url ||
          `https://daisycon.io/datafeed/?program_id=${feed.program_id}&media_id=${feed.media_id}&standard_id=1&language_code=nl&locale_id=1&type=json&rawdata=true`;

        console.log(`Importing feed: ${feed.name} (program: ${feed.program_id}, media: ${feed.media_id})`);
        console.log(`Feed URL: ${feedUrl}`);

        // Datafeed endpoint - no auth header needed, it authenticates via media_id
        const feedResponse = await fetch(feedUrl, {
          headers: { Accept: "application/json" },
        });

        if (!feedResponse.ok) {
          const errText = await feedResponse.text();
          console.error(`Feed fetch failed for ${feed.name}: ${feedResponse.status} - ${errText.substring(0, 500)}`);
          results.push({ feed: feed.name, imported: 0, skipped: 0, error: `HTTP ${feedResponse.status}: ${errText.substring(0, 100)}` });
          continue;
        }

        let feedData: any;
        const contentType = feedResponse.headers.get("content-type") || "";
        const responseText = await feedResponse.text();

        try {
          feedData = JSON.parse(responseText);
        } catch {
          console.error(`Feed ${feed.name}: Response is not valid JSON. First 500 chars: ${responseText.substring(0, 500)}`);
          results.push({ feed: feed.name, imported: 0, skipped: 0, error: "Response is not valid JSON" });
          continue;
        }

        // Handle different response formats from Daisycon datafeed
        let products: DaisyconProduct[] = [];
        if (Array.isArray(feedData)) {
          products = feedData;
        } else if (feedData.datafeed?.product_info) {
          // XML-style wrapped response
          const pi = feedData.datafeed.product_info;
          products = Array.isArray(pi) ? pi : [pi];
        } else if (feedData.product_info) {
          const pi = feedData.product_info;
          products = Array.isArray(pi) ? pi : [pi];
        } else if (feedData.products) {
          products = feedData.products;
        } else if (feedData.items) {
          products = feedData.items;
        } else if (feedData.datafeed) {
          const df = feedData.datafeed;
          products = Array.isArray(df) ? df : [df];
        }

        console.log(`Feed ${feed.name}: ${products.length} products found`);

        if (products.length === 0) {
          console.log(`Feed ${feed.name}: No products. Response keys: ${Object.keys(feedData).join(", ")}`);
          results.push({ feed: feed.name, imported: 0, skipped: 0, error: "No products in feed" });
          continue;
        }

        let imported = 0;
        let skipped = 0;

        for (const product of products) {
          // Use the affiliate link as unique identifier and source URL
          const sourceUrl = product.link || product.link_url || product.deeplink || "";
          
          if (!sourceUrl) {
            console.log(`Skipping product without link: ${product.title}`);
            skipped++;
            continue;
          }

          // Check if already exists by source_url
          const { data: existing } = await supabase
            .from("properties")
            .select("id")
            .eq("source_url", sourceUrl)
            .maybeSingle();

          if (existing) {
            skipped++;
            continue;
          }

          const propertyData = mapDaisyconToProperty(product, feed.name);

          const { error: insertErr } = await supabase
            .from("properties")
            .insert(propertyData);

          if (insertErr) {
            console.error(`Insert error for "${product.title}": ${insertErr.message}`);
            skipped++;
          } else {
            imported++;
          }
        }

        // Update feed stats
        await supabase
          .from("daisycon_feeds")
          .update({
            last_import_at: new Date().toISOString(),
            properties_imported: (feed.properties_imported || 0) + imported,
            updated_at: new Date().toISOString(),
          })
          .eq("id", feed.id);

        totalImported += imported;
        totalSkipped += skipped;
        results.push({ feed: feed.name, imported, skipped });

        console.log(`Feed ${feed.name}: ${imported} imported, ${skipped} skipped`);
      } catch (feedErr) {
        const msg = feedErr instanceof Error ? feedErr.message : "Unknown error";
        console.error(`Error processing feed ${feed.name}:`, msg);
        results.push({ feed: feed.name, imported: 0, skipped: 0, error: msg });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_imported: totalImported,
        total_skipped: totalSkipped,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daisycon import error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
