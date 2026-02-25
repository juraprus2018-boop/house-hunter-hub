import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH_API = "https://graph.facebook.com/v21.0";

interface PostRequest {
  property_id?: string;
  auto_post?: boolean;
  count?: number;
}

async function postPropertyToFacebook(
  property: {
    id: string;
    title: string;
    price: number;
    listing_type: string;
    city: string;
    street: string;
    house_number: string;
    surface_area: number | null;
    bedrooms: number | null;
    images: string[] | null;
    slug: string | null;
    property_type: string;
  },
  pageId: string,
  accessToken: string,
  siteUrl: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const priceFormatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(property.price);

  const priceLabel = property.listing_type === "huur" ? `${priceFormatted}/mnd` : priceFormatted;
  const propertyUrl = `${siteUrl}/woning/${property.slug || property.id}`;

  let message = `🏠 ${property.title}\n\n`;
  message += `📍 ${property.street} ${property.house_number}, ${property.city}\n`;
  message += `💰 ${priceLabel}\n`;
  if (property.surface_area) message += `📐 ${property.surface_area} m²\n`;
  if (property.bedrooms) message += `🛏️ ${property.bedrooms} slaapkamer${property.bedrooms > 1 ? "s" : ""}\n`;
  message += `🏘️ ${property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)} | Te ${property.listing_type}\n`;
  message += `\n🔗 Bekijk de woning: ${propertyUrl}`;

  const images = property.images?.filter(Boolean)?.slice(0, 5) || [];

  try {
    // First try a simple feed post with link to first image
    if (images.length > 0) {
      // Try single photo post first (most reliable)
      const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: images[0],
          message,
          access_token: accessToken,
        }),
      });
      const data = await res.json();
      console.log("Facebook photo response:", JSON.stringify(data));

      if (data.error) {
        console.error("Photo post failed, trying feed post:", data.error);
        // Fallback: post as link with image
        const feedRes = await fetch(`${GRAPH_API}/${pageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            link: images[0],
            access_token: accessToken,
          }),
        });
        const feedData = await feedRes.json();
        console.log("Facebook feed response:", JSON.stringify(feedData));

        if (feedData.error) {
          return { success: false, error: feedData.error.message };
        }
        return { success: true, postId: feedData.id };
      }

      return { success: true, postId: data.post_id || data.id };
    } else {
      return await postTextOnly(pageId, accessToken, message);
    }
  } catch (err) {
    console.error("Facebook API error:", err);
    return { success: false, error: String(err) };
  }
}

async function postTextOnly(
  pageId: string,
  accessToken: string,
  message: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: accessToken }),
  });
  const data = await res.json();

  if (data.error) {
    return { success: false, error: data.error.message };
  }
  return { success: true, postId: data.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const PAGE_ACCESS_TOKEN = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
  const PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");

  if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
    return new Response(
      JSON.stringify({ error: "Facebook credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const siteUrl = "https://id-preview--c307774c-a195-430c-b62f-8d15714b2034.lovable.app";

  try {
    const body = await req.json();
    const { property_id, auto_post, count = 5, debug }: PostRequest & { debug?: boolean } = body;

    // Debug mode: check token permissions
    if (debug) {
      const debugRes = await fetch(
        `${GRAPH_API}/debug_token?input_token=${PAGE_ACCESS_TOKEN}&access_token=${PAGE_ACCESS_TOKEN}`
      );
      const debugData = await debugRes.json();
      
      const meRes = await fetch(`${GRAPH_API}/me?access_token=${PAGE_ACCESS_TOKEN}`);
      const meData = await meRes.json();
      
      return new Response(JSON.stringify({ 
        token_info: debugData, 
        me: meData,
        page_id_configured: PAGE_ID 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (auto_post) {
      // Auto-post: get random active properties from the last 24h or most recent
      const { data: properties, error } = await supabase
        .from("properties")
        .select("id, title, price, listing_type, city, street, house_number, surface_area, bedrooms, images, slug, property_type")
        .eq("status", "actief")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!properties || properties.length === 0) {
        return new Response(
          JSON.stringify({ message: "No properties to post" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Shuffle and take `count`
      const shuffled = properties.sort(() => Math.random() - 0.5).slice(0, count);
      const results = [];

      for (const prop of shuffled) {
        const result = await postPropertyToFacebook(prop, PAGE_ID, PAGE_ACCESS_TOKEN, siteUrl);
        results.push({ property_id: prop.id, title: prop.title, ...result });
        // Small delay between posts
        await new Promise((r) => setTimeout(r, 2000));
      }

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (property_id) {
      // Manual post: single property
      const { data: property, error } = await supabase
        .from("properties")
        .select("id, title, price, listing_type, city, street, house_number, surface_area, bedrooms, images, slug, property_type")
        .eq("id", property_id)
        .single();

      if (error || !property) {
        return new Response(
          JSON.stringify({ error: "Property not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await postPropertyToFacebook(property, PAGE_ID, PAGE_ACCESS_TOKEN, siteUrl);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Provide property_id or auto_post=true" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
