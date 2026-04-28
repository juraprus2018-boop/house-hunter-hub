/**
 * Genereert de TikTok OAuth-URL waar admin naartoe wordt gestuurd.
 * Returns: { url }
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
  if (!clientKey) {
    return new Response(JSON.stringify({ error: "TIKTOK_CLIENT_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const redirectUri = `${supabaseUrl}/functions/v1/tiktok-oauth-callback`;
  const state = crypto.randomUUID();

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", clientKey);
  url.searchParams.set("scope", "user.info.basic,video.upload");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return new Response(JSON.stringify({ url: url.toString(), state, redirect_uri: redirectUri }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});