import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://www.woonpeek.nl";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const citySlug = url.searchParams.get("city");

  if (!citySlug) {
    return new Response("Missing city", { status: 400, headers: corsHeaders });
  }

  const cityName = decodeURIComponent(citySlug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get counts and multiple sample images for a better OG image
  const [huurResult, koopResult, imageResult] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "actief")
      .ilike("city", `%${cityName}%`)
      .eq("listing_type", "huur"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "actief")
      .ilike("city", `%${cityName}%`)
      .eq("listing_type", "koop"),
    supabase
      .from("properties")
      .select("images, price, listing_type, property_type")
      .eq("status", "actief")
      .ilike("city", `%${cityName}%`)
      .not("images", "is", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const huurCount = huurResult.count || 0;
  const koopCount = koopResult.count || 0;
  const totalCount = huurCount + koopCount;
  
  // Pick best OG image from available properties
  const allImages = (imageResult.data || [])
    .flatMap((p: any) => p.images || [])
    .filter((img: string) => img?.trim() && !img.includes("placeholder"));
  const ogImage = allImages[0] || `${SITE_URL}/facebook-cover.png`;

  // Build price context for richer description
  const priceContext = huurCount > 0 && koopCount > 0
    ? `${huurCount} huurwoningen en ${koopCount} koopwoningen`
    : huurCount > 0
    ? `${huurCount} huurwoningen`
    : `${koopCount} koopwoningen`;

  const now = new Date();
  const monthYear = now.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

  const pageUrl = `${SITE_URL}/woningen-${citySlug}`;
  const title = `Woningen ${cityName} (${totalCount}) | ${monthYear} | WoonPeek`;
  const description = `${priceContext} in ${cityName}. ✓ Dagelijks bijgewerkt ✓ Gratis alerts ✓ Appartementen, huizen en studio's. Bekijk het aanbod op WoonPeek.`;

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
  <meta property="og:type" content="website">
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
