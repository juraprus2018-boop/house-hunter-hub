import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://www.woonpeek.nl";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slugParam = url.searchParams.get("slug");

  if (!slugParam) {
    return new Response("Missing slug", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const slugOrId = decodeURIComponent(slugParam).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: property, error } = await supabase
    .from("properties")
    .select("title, images, city, street, house_number, price, listing_type, slug, id, surface_area, bedrooms")
    .eq(isUuid ? "id" : "slug", slugOrId)
    .maybeSingle();

  if (error) {
    return new Response("Failed to load property", {
      status: 500,
      headers: corsHeaders,
    });
  }

  if (!property) {
    return Response.redirect(`${SITE_URL}/woning/${encodeURIComponent(slugOrId)}`, 302);
  }

  const canonicalSlug = property.slug || property.id;
  const pageUrl = `${SITE_URL}/woning/${canonicalSlug}`;
  const ogImage = property.images?.find((img) => typeof img === "string" && img.trim() !== "") || `${SITE_URL}/facebook-cover.png`;

  const priceFormatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(property.price);
  const priceLabel = property.listing_type === "huur" ? `${priceFormatted} p/m` : priceFormatted;

  const title = `${property.title} - ${priceLabel} | WoonPeek`;
  const descParts = [`${property.street} ${property.house_number}, ${property.city}`];
  if (property.surface_area) descParts.push(`${property.surface_area} m²`);
  if (property.bedrooms) descParts.push(`${property.bedrooms} slaapkamer${property.bedrooms > 1 ? "s" : ""}`);
  descParts.push(`Bekijk op WoonPeek`);
  const description = descParts.join(" • ");

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="WoonPeek">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
</head>
<body>
  <p>Doorsturen naar <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
