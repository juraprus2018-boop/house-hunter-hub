import { createClient } from "npm:@supabase/supabase-js@2.49.4";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const PAGE_ACCESS_TOKEN = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
  let PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");

  if (!PAGE_ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Facebook Page Access Token not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Auto-detect Page ID from token if not set or wrong
  if (!PAGE_ID) {
    try {
      const meRes = await fetch(`${GRAPH_API}/me?access_token=${PAGE_ACCESS_TOKEN}`);
      const meData = await meRes.json();
      if (meData.id) {
        PAGE_ID = meData.id;
        console.log("Auto-detected Page ID:", PAGE_ID);
      }
    } catch (e) {
      console.error("Failed to auto-detect Page ID:", e);
    }
  }

  if (!PAGE_ID) {
    return new Response(
      JSON.stringify({ error: "Could not determine Facebook Page ID" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const siteUrl = "https://woonpeek.nl";

  try {
    const body = await req.json();
    const { property_id, auto_post, count = 5, debug, blog_post, title, excerpt, slug }: PostRequest & { debug?: boolean; blog_post?: boolean; title?: string; excerpt?: string; slug?: string } = body;

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

    // Blog post to Facebook
    if (blog_post && title && slug) {
      const blogUrl = `${siteUrl}/blog/${slug}`;
      const hashtags = ["#woningmarkt", "#huren", "#Nederland", "#woonpeek", "#vastgoed", "#huurwoning", "#huurtips", "#wonen"];
      const selectedTags = hashtags.slice(0, 6);

      let fbMessage = `📝 Nieuw op het blog!\n\n`;
      fbMessage += `${title}\n\n`;
      if (excerpt) fbMessage += `${excerpt}\n\n`;
      fbMessage += `👉 Lees het volledige artikel: ${blogUrl}\n\n`;
      fbMessage += selectedTags.join(" ");

      // Try photo post with banner, fallback to link post
      const bannerUrl = `${siteUrl}/facebook-cover.png`;
      let result: { success: boolean; postId?: string; error?: string };
      
      const res = await fetch(`${GRAPH_API}/${PAGE_ID}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bannerUrl, message: fbMessage, access_token: PAGE_ACCESS_TOKEN }),
      });
      const fbData = await res.json();

      if (fbData.error) {
        const feedRes = await fetch(`${GRAPH_API}/${PAGE_ID}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: fbMessage, link: blogUrl, access_token: PAGE_ACCESS_TOKEN }),
        });
        const feedData = await feedRes.json();
        result = feedData.error ? { success: false, error: feedData.error.message } : { success: true, postId: feedData.id };
      } else {
        result = { success: true, postId: fbData.post_id || fbData.id };
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (auto_post) {
      // Auto-post: get random active properties that haven't been posted yet
      const { data: properties, error } = await supabase
        .from("properties")
        .select("id, title, price, listing_type, city, street, house_number, surface_area, bedrooms, images, slug, property_type")
        .eq("status", "actief")
        .is("facebook_posted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!properties || properties.length === 0) {
        return new Response(
          JSON.stringify({ message: "No new properties to post" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Shuffle and take `count`
      const shuffled = properties.sort(() => Math.random() - 0.5).slice(0, count);
      const results = [];

      for (const prop of shuffled) {
        const result = await postPropertyToFacebook(prop, PAGE_ID, PAGE_ACCESS_TOKEN, siteUrl);
        results.push({ property_id: prop.id, title: prop.title, ...result });
        if (result.success) {
          await supabase.from("properties").update({ facebook_posted_at: new Date().toISOString() }).eq("id", prop.id);
        }
        // Small delay between posts
        await new Promise((r) => setTimeout(r, 2000));
      }

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (property_id) {
      // Manual post: single property - check if already posted
      const { data: property, error } = await supabase
        .from("properties")
        .select("id, title, price, listing_type, city, street, house_number, surface_area, bedrooms, images, slug, property_type, facebook_posted_at")
        .eq("id", property_id)
        .single();

      if (error || !property) {
        return new Response(
          JSON.stringify({ error: "Property not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (property.facebook_posted_at) {
        return new Response(
          JSON.stringify({ error: "Deze woning is al op Facebook geplaatst", already_posted: true }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await postPropertyToFacebook(property, PAGE_ID, PAGE_ACCESS_TOKEN, siteUrl);

      if (result.success) {
        await supabase.from("properties").update({ facebook_posted_at: new Date().toISOString() }).eq("id", property_id);
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Provide property_id, auto_post=true, or blog_post=true" }),
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
