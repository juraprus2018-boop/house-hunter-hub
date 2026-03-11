import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH_API = "https://graph.facebook.com/v21.0";
const SITE_URL = "https://www.woonpeek.nl";

interface Property {
  id: string;
  title: string;
  price: number;
  listing_type: string;
  city: string;
  street: string;
  house_number: string;
  surface_area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[] | null;
  slug: string | null;
  property_type: string;
  description: string | null;
  energy_label: string | null;
  build_year: number | null;
}

// ─── Caption Builder ────────────────────────────────────────────────

function buildCaption(property: Property): string {
  const typeLabel = capitalize(property.property_type);
  const priceFormatted = formatPrice(property.price, property.listing_type);
  const propertyUrl = `${SITE_URL}/woning/${property.slug || property.id}`;

  const lines: string[] = [];

  // Headline
  const listingLabel = property.listing_type === "huur" ? "te huur" : "te koop";
  lines.push(`🏠 ${typeLabel} ${listingLabel} in ${property.city} – ${priceFormatted}`);
  lines.push("");

  // Key specs
  const specs: string[] = [];
  specs.push(`📍 ${property.street} ${property.house_number}, ${property.city}`);
  specs.push(`💰 ${priceFormatted}`);
  if (property.surface_area) specs.push(`📐 ${property.surface_area} m²`);
  if (property.bedrooms) specs.push(`🛏️ ${property.bedrooms} slaapkamer${property.bedrooms > 1 ? "s" : ""}`);
  if (property.bathrooms) specs.push(`🛁 ${property.bathrooms} badkamer${property.bathrooms > 1 ? "s" : ""}`);
  if (property.energy_label) specs.push(`⚡ Energielabel ${property.energy_label}`);
  if (property.build_year) specs.push(`🏗️ Bouwjaar ${property.build_year}`);
  lines.push(specs.join("\n"));
  lines.push("");

  // Description
  const desc = buildDescription(property);
  if (desc) {
    lines.push(desc);
    lines.push("");
  }

  // CTA
  lines.push(`👉 Bekijk deze woning op WoonPeek:`);
  lines.push(propertyUrl);
  lines.push("");

  // Hashtags
  const hashtags = buildHashtags(property);
  lines.push(hashtags);

  return lines.join("\n");
}

function buildDescription(property: Property): string {
  // Use existing description if available (truncated for Facebook)
  if (property.description) {
    const clean = property.description
      .replace(/<[^>]*>/g, "") // strip HTML
      .replace(/\s+/g, " ")
      .trim();
    if (clean.length > 10) {
      // Truncate to ~200 chars at word boundary
      if (clean.length > 200) {
        const truncated = clean.substring(0, 200).replace(/\s\S*$/, "");
        return `${truncated}...`;
      }
      return clean;
    }
  }

  // Generate fallback description from available data
  const typeLabel = capitalize(property.property_type);
  const listingLabel = property.listing_type === "huur" ? "te huur" : "te koop";
  const parts: string[] = [`${typeLabel} ${listingLabel} in ${property.city}.`];

  if (property.surface_area) {
    parts.push(`Deze woning heeft een oppervlakte van ${property.surface_area} m².`);
  }
  if (property.bedrooms && property.bedrooms > 0) {
    parts.push(`Beschikt over ${property.bedrooms} slaapkamer${property.bedrooms > 1 ? "s" : ""}.`);
  }

  return parts.join(" ");
}

function buildHashtags(property: Property): string {
  const tags = new Set<string>();

  // Type-based
  if (property.listing_type === "huur") {
    tags.add("#huurwoning");
    tags.add("#tehuur");
  } else {
    tags.add("#koopwoning");
    tags.add("#tekoop");
  }

  // Property type
  const typeTag = `#${property.property_type.toLowerCase()}`;
  tags.add(typeTag);

  // City
  const cityTag = `#${property.city.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  tags.add(cityTag);

  // General
  tags.add("#woning");
  tags.add("#woonpeek");
  tags.add("#woningmarkt");
  tags.add("#nederland");

  return Array.from(tags).slice(0, 8).join(" ");
}

function formatPrice(price: number, listingType: string): string {
  const formatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(price);
  return listingType === "huur" ? `${formatted} p/m` : formatted;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Image Helpers ──────────────────────────────────────────────────

function getUniqueImages(images: string[] | null, max: number = 10): string[] {
  if (!images || images.length === 0) return [];
  // Filter empty, deduplicate, limit
  const seen = new Set<string>();
  const result: string[] = [];
  for (const img of images) {
    if (!img || img.trim() === "") continue;
    const normalized = img.trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= max) break;
  }
  return result;
}

// ─── Facebook Multi-Photo Post (Carousel) ───────────────────────────

async function uploadUnpublishedPhoto(
  pageId: string,
  accessToken: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        published: false,
        access_token: accessToken,
      }),
    });
    const data = await res.json();
    if (data.error) {
      console.error(`Failed to upload photo ${imageUrl}:`, data.error.message);
      return null;
    }
    return data.id;
  } catch (err) {
    console.error(`Error uploading photo ${imageUrl}:`, err);
    return null;
  }
}

async function postMultiPhoto(
  pageId: string,
  accessToken: string,
  message: string,
  imageUrls: string[]
): Promise<{ success: boolean; postId?: string; error?: string }> {
  // Upload all photos as unpublished
  console.log(`Uploading ${imageUrls.length} photos as unpublished...`);
  const photoIds: string[] = [];

  for (const url of imageUrls) {
    const photoId = await uploadUnpublishedPhoto(pageId, accessToken, url);
    if (photoId) photoIds.push(photoId);
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  if (photoIds.length === 0) {
    console.error("No photos uploaded successfully");
    return { success: false, error: "No photos could be uploaded" };
  }

  console.log(`Successfully uploaded ${photoIds.length} photos, creating multi-photo post...`);

  // Create feed post with attached photos
  const attachedMedia = photoIds.map((id) => ({ media_fbid: id }));
  const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      attached_media: attachedMedia,
      access_token: accessToken,
    }),
  });
  const data = await res.json();
  console.log("Multi-photo post response:", JSON.stringify(data));

  if (data.error) {
    return { success: false, error: data.error.message };
  }
  return { success: true, postId: data.id };
}

// ─── Post Property (with fallback chain) ────────────────────────────

async function postPropertyToFacebook(
  property: Property,
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const message = buildCaption(property);
  const images = getUniqueImages(property.images, 10);

  try {
    // Strategy 1: Multi-photo post (3+ images)
    if (images.length >= 3) {
      console.log(`Posting ${property.title} with ${images.length} photos (multi-photo)`);
      const result = await postMultiPhoto(pageId, accessToken, message, images);
      if (result.success) return result;
      console.warn("Multi-photo failed, falling back to single photo");
    }

    // Strategy 2: Single photo post (1-2 images, or multi-photo fallback)
    if (images.length >= 1) {
      console.log(`Posting ${property.title} with single photo`);
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
      if (!data.error) {
        return { success: true, postId: data.post_id || data.id };
      }
      console.warn("Single photo failed, falling back to text-only:", data.error.message);
    }

    // Strategy 3: Text-only post
    console.log(`Posting ${property.title} as text-only`);
    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        link: `${SITE_URL}/woning/${property.slug || property.id}`,
        access_token: accessToken,
      }),
    });
    const data = await res.json();
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    return { success: true, postId: data.id };
  } catch (err) {
    console.error("Facebook API error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Main Handler ───────────────────────────────────────────────────

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

  // Auto-detect Page ID if not set
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

  try {
    const body = await req.json();
    const {
      property_id,
      auto_post,
      count = 5,
      debug,
      blog_post,
      title,
      excerpt,
      slug,
    } = body;

    // ─── Debug Mode ─────────────────────────────────────────
    if (debug) {
      const debugRes = await fetch(
        `${GRAPH_API}/debug_token?input_token=${PAGE_ACCESS_TOKEN}&access_token=${PAGE_ACCESS_TOKEN}`
      );
      const debugData = await debugRes.json();
      const meRes = await fetch(`${GRAPH_API}/me?access_token=${PAGE_ACCESS_TOKEN}`);
      const meData = await meRes.json();

      return new Response(
        JSON.stringify({ token_info: debugData, me: meData, page_id_configured: PAGE_ID }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Blog Post ──────────────────────────────────────────
    if (blog_post && title && slug) {
      const blogUrl = `${SITE_URL}/blog/${slug}`;
      const hashtags = ["#woningmarkt", "#huren", "#Nederland", "#woonpeek", "#vastgoed", "#huurwoning"];

      let fbMessage = `📝 Nieuw op het blog!\n\n`;
      fbMessage += `${title}\n\n`;
      if (excerpt) fbMessage += `${excerpt}\n\n`;
      fbMessage += `👉 Lees het volledige artikel: ${blogUrl}\n\n`;
      fbMessage += hashtags.join(" ");

      const bannerUrl = `${SITE_URL}/facebook-cover.png`;
      const res = await fetch(`${GRAPH_API}/${PAGE_ID}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bannerUrl, message: fbMessage, access_token: PAGE_ACCESS_TOKEN }),
      });
      const fbData = await res.json();

      let result: { success: boolean; postId?: string; error?: string };
      if (fbData.error) {
        const feedRes = await fetch(`${GRAPH_API}/${PAGE_ID}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: fbMessage, link: blogUrl, access_token: PAGE_ACCESS_TOKEN }),
        });
        const feedData = await feedRes.json();
        result = feedData.error
          ? { success: false, error: feedData.error.message }
          : { success: true, postId: feedData.id };
      } else {
        result = { success: true, postId: fbData.post_id || fbData.id };
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Auto Post (daily batch) ────────────────────────────
    if (auto_post) {
      // Prioritize newest unposted properties
      const { data: properties, error } = await supabase
        .from("properties")
        .select("id, title, price, listing_type, city, street, house_number, surface_area, bedrooms, bathrooms, images, slug, property_type, description, energy_label, build_year")
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

      // Prioritize properties with more images (better posts), then newest
      const sorted = properties
        .map((p) => ({
          ...p,
          imageCount: getUniqueImages(p.images).length,
        }))
        .sort((a, b) => {
          // First by image count (more images = better post), then by date
          if (b.imageCount !== a.imageCount) return b.imageCount - a.imageCount;
          return 0; // already sorted by created_at desc
        })
        .slice(0, count);

      const results = [];

      for (const prop of sorted) {
        const result = await postPropertyToFacebook(prop as Property, PAGE_ID, PAGE_ACCESS_TOKEN);
        results.push({
          property_id: prop.id,
          title: prop.title,
          images_used: getUniqueImages(prop.images).length,
          ...result,
        });
        if (result.success) {
          await supabase
            .from("properties")
            .update({ facebook_posted_at: new Date().toISOString() })
            .eq("id", prop.id);
        }
        // Delay between posts to avoid rate limiting
        await new Promise((r) => setTimeout(r, 3000));
      }

      const successCount = results.filter((r) => r.success).length;
      return new Response(
        JSON.stringify({
          summary: `${successCount}/${results.length} woningen succesvol gepost`,
          results,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Manual Single Post ─────────────────────────────────
    if (property_id) {
      const { data: property, error } = await supabase
        .from("properties")
        .select("id, title, price, listing_type, city, street, house_number, surface_area, bedrooms, bathrooms, images, slug, property_type, description, energy_label, build_year, facebook_posted_at")
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

      const result = await postPropertyToFacebook(property as Property, PAGE_ID, PAGE_ACCESS_TOKEN);
      if (result.success) {
        await supabase
          .from("properties")
          .update({ facebook_posted_at: new Date().toISOString() })
          .eq("id", property_id);
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
