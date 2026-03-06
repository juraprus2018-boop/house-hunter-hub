import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAISYCON_AUTH_URL = "https://login.daisycon.com/oauth/authorize";
const DAISYCON_TOKEN_URL = "https://login.daisycon.com/oauth/access-token";
const DAISYCON_CLI_REDIRECT = "https://login.daisycon.com/oauth/cli";

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("DAISYCON_CLIENT_ID");
    const clientSecret = Deno.env.get("DAISYCON_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Daisycon credentials not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { action, code, code_verifier } = await req.json();

    if (action === "init") {
      // Generate PKCE values and return auth URL
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const authUrl = `${DAISYCON_AUTH_URL}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(DAISYCON_CLI_REDIRECT)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;

      return new Response(
        JSON.stringify({ auth_url: authUrl, code_verifier: codeVerifier }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchange") {
      // Exchange authorization code for tokens
      if (!code || !code_verifier) {
        throw new Error("Missing code or code_verifier");
      }

      const tokenResponse = await fetch(DAISYCON_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: DAISYCON_CLI_REDIRECT,
          code_verifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Token exchange failed [${tokenResponse.status}]: ${errText}`);
      }

      const tokens = await tokenResponse.json();

      // Store tokens in database (delete old ones first)
      await supabase.from("daisycon_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const { error: insertError } = await supabase.from("daisycon_tokens").insert({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + 29 * 60 * 1000).toISOString(), // 29 min
      });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, message: "Daisycon connected successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refresh") {
      // Get current tokens
      const { data: tokenRow, error: fetchErr } = await supabase
        .from("daisycon_tokens")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchErr || !tokenRow) {
        throw new Error("No Daisycon tokens found. Please connect first.");
      }

      const tokenResponse = await fetch(DAISYCON_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: DAISYCON_CLI_REDIRECT,
          refresh_token: tokenRow.refresh_token,
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Token refresh failed [${tokenResponse.status}]: ${errText}`);
      }

      const newTokens = await tokenResponse.json();

      // Update tokens
      const { error: updateErr } = await supabase
        .from("daisycon_tokens")
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: new Date(Date.now() + 29 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", tokenRow.id);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({ success: true, access_token: newTokens.access_token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "status") {
      const { data: tokenRow } = await supabase
        .from("daisycon_tokens")
        .select("expires_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({
          connected: !!tokenRow,
          expires_at: tokenRow?.expires_at,
          last_refreshed: tokenRow?.updated_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("Daisycon auth error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
