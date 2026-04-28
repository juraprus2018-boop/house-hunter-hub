/**
 * Ontvangt redirect van TikTok met ?code=...&state=..., wisselt code in voor tokens
 * en slaat deze op in tiktok_oauth_tokens.
 * Sluit af met een redirect terug naar /admin/tiktok?connected=1.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const APP_URL = "https://www.woonpeek.nl";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(`${APP_URL}/admin/tiktok?error=${encodeURIComponent(error)}`, 302);
  }
  if (!code) {
    return Response.redirect(`${APP_URL}/admin/tiktok?error=missing_code`, 302);
  }

  try {
    const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
    const clientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!clientKey || !clientSecret) throw new Error("TIKTOK_CLIENT_KEY/SECRET missing");

    const redirectUri = `${supabaseUrl}/functions/v1/tiktok-oauth-callback`;

    // Exchange code -> tokens
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || tokenJson.error) {
      throw new Error(`TikTok token exchange failed: ${JSON.stringify(tokenJson)}`);
    }

    const accessToken: string = tokenJson.access_token;
    const refreshToken: string = tokenJson.refresh_token;
    const expiresIn: number = tokenJson.expires_in;
    const refreshExpiresIn: number = tokenJson.refresh_expires_in;
    const openId: string = tokenJson.open_id;
    const scope: string = tokenJson.scope;

    // Fetch user info
    const infoRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const infoJson = await infoRes.json();
    const user = infoJson?.data?.user ?? {};

    const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const row = {
      open_id: openId,
      display_name: user.display_name ?? null,
      avatar_url: user.avatar_url ?? null,
      access_token: accessToken,
      refresh_token: refreshToken,
      scope,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      refresh_expires_at: refreshExpiresIn
        ? new Date(Date.now() + refreshExpiresIn * 1000).toISOString()
        : null,
    };

    const { error: upErr } = await sb
      .from("tiktok_oauth_tokens")
      .upsert(row, { onConflict: "open_id" });

    if (upErr) throw new Error(`DB upsert failed: ${upErr.message}`);

    return Response.redirect(`${APP_URL}/admin/tiktok?connected=1`, 302);
  } catch (e) {
    console.error("[tiktok-oauth-callback]", e);
    const msg = e instanceof Error ? e.message : "unknown";
    return Response.redirect(`${APP_URL}/admin/tiktok?error=${encodeURIComponent(msg)}`, 302);
  }
});