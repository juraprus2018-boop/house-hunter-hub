import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://woonpeek.nl";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Get all active properties
    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("slug, id, city, updated_at, listing_type")
      .eq("status", "actief")
      .order("updated_at", { ascending: false });

    if (propError) throw propError;

    // 2. Get unique cities for city pages
    const cityMap = new Map<string, { count: number; lastMod: string }>();
    for (const p of properties || []) {
      const citySlug = p.city.toLowerCase().replace(/\s+/g, "-");
      const existing = cityMap.get(citySlug);
      if (!existing || p.updated_at > existing.lastMod) {
        cityMap.set(citySlug, {
          count: (existing?.count || 0) + 1,
          lastMod: p.updated_at,
        });
      } else {
        existing.count++;
      }
    }

    // 3. Build sitemap XML
    const now = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/zoeken</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/verkennen</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // City pages
    for (const [citySlug, info] of cityMap) {
      const lastMod = info.lastMod.split("T")[0];
      xml += `  <url>
    <loc>${SITE_URL}/${citySlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Property pages
    for (const p of properties || []) {
      const slug = p.slug || p.id;
      const lastMod = p.updated_at.split("T")[0];
      xml += `  <url>
    <loc>${SITE_URL}/woning/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    // 4. Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload("sitemap.xml", new TextEncoder().encode(xml), {
        contentType: "application/xml",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const sitemapUrl = `${supabaseUrl}/storage/v1/object/public/property-images/sitemap.xml`;

    return new Response(
      JSON.stringify({
        success: true,
        properties_count: properties?.length || 0,
        cities_count: cityMap.size,
        sitemap_url: sitemapUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
