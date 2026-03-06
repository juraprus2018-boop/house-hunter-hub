import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAISYCON_API_BASE = "https://services.daisycon.com";
const DAISYCON_TOKEN_URL = "https://login.daisycon.com/oauth/access-token";
const DAISYCON_CLI_REDIRECT = "https://login.daisycon.com/oauth/cli";
const SYSTEM_USER_ID = "0d02a609-fde3-435a-9154-078fdce7ed34";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 60);
}

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

  // Check if token is still valid (with 2 min buffer)
  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() < expiresAt - 2 * 60 * 1000) {
    return tokenRow.access_token;
  }

  // Refresh the token
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
  title?: string;
  description?: string;
  price?: number | string;
  price_old?: number | string;
  link?: string;
  image_url?: string;
  image_large?: string;
  additional_image_urls?: string[];
  city?: string;
  address?: string;
  street?: string;
  house_number?: string;
  zipcode?: string;
  postal_code?: string;
  surface?: number | string;
  surface_area?: number | string;
  rooms?: number | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  property_type?: string;
  type?: string;
  category?: string;
  listing_type?: string;
  rent_buy?: string;
  [key: string]: unknown;
}

function mapDaisyconToProperty(product: DaisyconProduct, sourceSite: string) {
  const price = parseFloat(String(product.price || "0")) || 0;
  const street = product.street || product.address || "";
  const houseNumber = product.house_number || "";
  const city = product.city || "";
  const postalCode = product.zipcode || product.postal_code || "";
  const surface = parseInt(String(product.surface || product.surface_area || "0")) || null;
  const bedrooms = parseInt(String(product.bedrooms || product.rooms || "0")) || null;
  const bathrooms = parseInt(String(product.bathrooms || "0")) || null;

  // Determine listing type
  let listingType: "huur" | "koop" = "huur";
  const rentBuy = String(product.rent_buy || product.listing_type || product.category || "").toLowerCase();
  if (rentBuy.includes("koop") || rentBuy.includes("buy") || rentBuy.includes("sale")) {
    listingType = "koop";
  }

  // Determine property type
  let propertyType: "appartement" | "huis" | "studio" | "kamer" = "appartement";
  const pType = String(product.property_type || product.type || product.category || "").toLowerCase();
  if (pType.includes("huis") || pType.includes("house") || pType.includes("woning")) {
    propertyType = "huis";
  } else if (pType.includes("studio")) {
    propertyType = "studio";
  } else if (pType.includes("kamer") || pType.includes("room")) {
    propertyType = "kamer";
  }

  // Collect images
  const images: string[] = [];
  if (product.image_large) images.push(product.image_large);
  else if (product.image_url) images.push(product.image_url);
  if (product.additional_image_urls) {
    images.push(...product.additional_image_urls.slice(0, 9));
  }

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
    source_url: product.link || null,
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
    const feedId = body.feed_id; // Optional: import specific feed only

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(supabase);

    // Get active feeds to import
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
        // Build feed URL
        const feedUrl = feed.feed_url || 
          `https://daisycon.io/datafeed/?program_id=${feed.program_id}&media_id=${feed.media_id}&type=json`;

        console.log(`Importing feed: ${feed.name} from ${feedUrl}`);

        const feedResponse = await fetch(feedUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });

        if (!feedResponse.ok) {
          const errText = await feedResponse.text();
          console.error(`Feed fetch failed for ${feed.name}: ${feedResponse.status} - ${errText}`);
          results.push({ feed: feed.name, imported: 0, skipped: 0, error: `HTTP ${feedResponse.status}` });
          continue;
        }

        const feedData = await feedResponse.json();
        
        // Handle both array and wrapped responses
        const products: DaisyconProduct[] = Array.isArray(feedData) 
          ? feedData 
          : feedData.products || feedData.items || feedData.datafeed || [];

        console.log(`Feed ${feed.name}: ${products.length} products found`);

        let imported = 0;
        let skipped = 0;

        for (const product of products) {
          const sourceUrl = product.link || `daisycon-${feed.program_id}-${JSON.stringify(product).substring(0, 20)}`;
          
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

          const propertyData = mapDaisyconToProperty(product, feed.name.toLowerCase());
          
          const { error: insertErr } = await supabase
            .from("properties")
            .insert(propertyData);

          if (insertErr) {
            console.error(`Insert error for ${product.title}: ${insertErr.message}`);
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
