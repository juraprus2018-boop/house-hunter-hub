import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://woonpeek.nl";

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
  return `<?xml version="1.0" encoding="UTF-8"?>
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
    <loc>${SITE_URL}/steden</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/verkennen</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/nieuw-aanbod</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/huurwoningen</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/koopwoningen</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/woning-plaatsen</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/dagelijkse-alert</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/veelgestelde-vragen</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
}

function buildCitiesSitemap(
  properties: Array<{ city: string; updated_at: string; listing_type: string }>,
): string {
  const cityMap = new Map<string, string>();
  for (const p of properties) {
    const citySlug = p.city.trim().toLowerCase().replace(/\s+/g, "-");
    const existing = cityMap.get(citySlug);
    if (!existing || p.updated_at > existing) {
      cityMap.set(citySlug, p.updated_at);
    }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (const [citySlug, lastMod] of cityMap) {
    // City landing page
    xml += `  <url>
    <loc>${SITE_URL}/woningen-${citySlug}</loc>
    <lastmod>${lastMod.split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
    // Huurwoningen per city
    xml += `  <url>
    <loc>${SITE_URL}/huurwoningen/${citySlug}</loc>
    <lastmod>${lastMod.split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
    // Koopwoningen per city
    xml += `  <url>
    <loc>${SITE_URL}/koopwoningen/${citySlug}</loc>
    <lastmod>${lastMod.split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
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
      const { data: properties, error } = await supabase
        .from("properties")
        .select("slug, id, city, updated_at, listing_type")
        .eq("status", "actief")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      if (type === "steden") {
        return new Response(buildCitiesSitemap(properties || []), {
          headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      }

      return new Response(buildPropertiesSitemap(properties || []), {
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
