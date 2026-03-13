import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};

const SITE_URL = "https://www.woonpeek.nl";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: property } = await supabase
    .from("properties")
    .select("title, description, images, city, street, house_number, price, listing_type, slug, property_type, surface_area, bedrooms")
    .eq("slug", slug)
    .single();

  if (!property) {
    return Response.redirect(`${SITE_URL}/woning/${slug}`, 302);
  }

  const pageUrl = `${SITE_URL}/woning/${property.slug}`;
  const ogImage = property.images?.length ? property.images[0] : `${SITE_URL}/favicon.png`;
  
  const priceFormatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(property.price);
  const priceLabel = property.listing_type === "huur" ? `${priceFormatted} p/m` : priceFormatted;

  const title = `${property.title} - ${priceLabel}`;
  const descParts = [`${property.street} ${property.house_number}, ${property.city}`];
  if (property.surface_area) descParts.push(`${property.surface_area} m²`);
  if (property.bedrooms) descParts.push(`${property.bedrooms} slaapkamer${property.bedrooms > 1 ? "s" : ""}`);
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
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="WoonPeek">
  <meta name="twitter:card" content="summary_large_image">
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
