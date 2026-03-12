import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://www.woonpeek.nl";

function buildSitemapIndex(lastmod: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-steden.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-woningen.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-blog.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function buildPagesSitemap(now: string): string {
  const staticPages = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/zoeken", changefreq: "daily", priority: "0.9" },
    { loc: "/steden", changefreq: "daily", priority: "0.8" },
    { loc: "/verkennen", changefreq: "daily", priority: "0.7" },
    { loc: "/nieuw-aanbod", changefreq: "daily", priority: "0.8" },
    { loc: "/huurwoningen", changefreq: "daily", priority: "0.8" },
    { loc: "/koopwoningen", changefreq: "daily", priority: "0.8" },
    { loc: "/appartementen", changefreq: "daily", priority: "0.7" },
    { loc: "/huizen", changefreq: "daily", priority: "0.7" },
    { loc: "/studios", changefreq: "daily", priority: "0.7" },
    { loc: "/kamers", changefreq: "daily", priority: "0.7" },
    { loc: "/woning-plaatsen", changefreq: "weekly", priority: "0.7" },
    { loc: "/blog", changefreq: "daily", priority: "0.8" },
    { loc: "/dagelijkse-alert", changefreq: "monthly", priority: "0.6" },
    { loc: "/veelgestelde-vragen", changefreq: "monthly", priority: "0.5" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}

function buildCitiesSitemap(
  properties: Array<{ city: string; updated_at: string; listing_type: string; property_type: string }>,
): string {
  const cityMap = new Map<string, string>();
  for (const p of properties) {
    const citySlug = p.city.trim().toLowerCase().replace(/\s+/g, "-");
    const existing = cityMap.get(citySlug);
    if (!existing || p.updated_at > existing) {
      cityMap.set(citySlug, p.updated_at);
    }
  }

  const propertyTypeSlugs = [
    { slug: "appartementen", type: "appartement" },
    { slug: "huizen", type: "huis" },
    { slug: "studios", type: "studio" },
    { slug: "kamers", type: "kamer" },
  ];

  // Track which property types exist per city
  const cityTypeSet = new Set<string>();
  for (const p of properties) {
    const citySlug = p.city.trim().toLowerCase().replace(/\s+/g, "-");
    cityTypeSet.add(`${citySlug}:${p.property_type}`);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (const [citySlug, lastMod] of cityMap) {
    const date = lastMod.split("T")[0];
    // City landing page
    xml += `  <url>
    <loc>${SITE_URL}/woningen-${citySlug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
    // Huurwoningen per city
    xml += `  <url>
    <loc>${SITE_URL}/huurwoningen/${citySlug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
    // Koopwoningen per city
    xml += `  <url>
    <loc>${SITE_URL}/koopwoningen/${citySlug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
    // Property type per city (only if that type exists in the city)
    for (const pt of propertyTypeSlugs) {
      if (cityTypeSet.has(`${citySlug}:${pt.type}`)) {
        xml += `  <url>
    <loc>${SITE_URL}/${pt.slug}/${citySlug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }
    // Price-filtered pages per city
    for (const price of [750, 1000, 1250, 1500, 2000]) {
      xml += `  <url>
    <loc>${SITE_URL}/woningen/${citySlug}/onder-${price}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
`;
    }
    // Bedroom-filtered pages per city
    for (const beds of [1, 2, 3, 4]) {
      xml += `  <url>
    <loc>${SITE_URL}/woningen/${citySlug}/${beds}-kamers</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>
`;
    }
  }
  xml += `</urlset>`;
  return xml;
}

function buildPropertiesSitemap(
  properties: Array<{ slug: string | null; id: string; updated_at: string }>,
): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (const p of properties) {
    xml += `  <url>
    <loc>${SITE_URL}/woning/${p.slug || p.id}</loc>
    <lastmod>${p.updated_at.split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}

function buildBlogSitemap(
  blogPosts: Array<{ slug: string; updated_at: string }>,
): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (const b of blogPosts) {
    xml += `  <url>
    <loc>${SITE_URL}/blog/${b.slug}</loc>
    <lastmod>${b.updated_at.split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";

  try {
    const now = new Date().toISOString().split("T")[0];

    // For index, just return the sitemap index
    if (type === "index") {
      return new Response(buildSitemapIndex(now), {
        headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }

    if (type === "pages") {
      return new Response(buildPagesSitemap(now), {
        headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }

    // Fetch data for cities/properties
    if (type === "steden" || type === "woningen") {
      const pageSize = 1000;
      let from = 0;
      const allProperties: Array<{ slug: string | null; id: string; city: string; updated_at: string; listing_type: string; property_type: string }> = [];
      while (true) {
        const { data, error } = await supabase
          .from("properties")
          .select("slug, id, city, updated_at, listing_type, property_type")
          .eq("status", "actief")
          .order("updated_at", { ascending: false })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allProperties.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      const properties = allProperties;

      if (type === "steden") {
        return new Response(buildCitiesSitemap(properties), {
          headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      }

      return new Response(buildPropertiesSitemap(properties), {
        headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }

    if (type === "blog") {
      const { data: blogPosts, error } = await supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;

      return new Response(buildBlogSitemap(blogPosts || []), {
        headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }

    return new Response(buildSitemapIndex(now), {
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
