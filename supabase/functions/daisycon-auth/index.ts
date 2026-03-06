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
    const body = await req.json();
    const { action, code, code_verifier } = body;

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

    if (action === "programs") {
      // Get valid access token
      const { data: tokenRow, error: fetchErr } = await supabase
        .from("daisycon_tokens")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchErr || !tokenRow) {
        throw new Error("Niet verbonden met Daisycon. Verbind eerst je account.");
      }

      let accessToken = tokenRow.access_token;

      // Check if token expired, refresh if needed
      const expiresAt = new Date(tokenRow.expires_at).getTime();
      if (Date.now() >= expiresAt - 2 * 60 * 1000) {
        const refreshRes = await fetch(DAISYCON_TOKEN_URL, {
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
        if (!refreshRes.ok) {
          throw new Error("Token refresh failed");
        }
        const newTokens = await refreshRes.json();
        accessToken = newTokens.access_token;
        await supabase.from("daisycon_tokens").update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: new Date(Date.now() + 29 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", tokenRow.id);
      }

      const publisherId = Deno.env.get("DAISYCON_PUBLISHER_ID");
      if (!publisherId) throw new Error("DAISYCON_PUBLISHER_ID not configured");

      // Fetch subscriptions (programs the publisher is subscribed to)
      const subsRes = await fetch(
        `https://services.daisycon.com/publishers/${publisherId}/subscriptions?page=1&per_page=100`,
        { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
      );

      if (!subsRes.ok) {
        const errText = await subsRes.text();
        console.error("Subscriptions fetch failed:", subsRes.status, errText);
        throw new Error(`Kon programma's niet ophalen [${subsRes.status}]`);
      }

      const subscriptions = await subsRes.json();

      // Collect all unique program IDs and fetch names
      const allProgramIds = new Set<number>();
      for (const sub of subscriptions) {
        const ids = sub.program_ids || (sub.program_id ? [sub.program_id] : []);
        for (const id of ids) allProgramIds.add(id);
      }

      const programNames: Record<number, string> = {};
      await Promise.all([...allProgramIds].map(async (pid) => {
        try {
          const res = await fetch(
            `https://services.daisycon.com/publishers/${publisherId}/programs/${pid}`,
            { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
          );
          if (res.ok) {
            const data = await res.json();
            programNames[pid] = data.name || `Program ${pid}`;
          } else {
            await res.text();
            programNames[pid] = `Program ${pid}`;
          }
        } catch {
          programNames[pid] = `Program ${pid}`;
        }
      }));

      // Check which programs have product feeds available
      const feedAvailability: Record<number, boolean> = {};
      await Promise.all([...allProgramIds].map(async (pid) => {
        try {
          const feedCheckUrl = `https://daisycon.io/datafeed/?program_id=${pid}&media_id=${subscriptions[0]?.media_id || ''}&standard_id=1&language_code=nl&locale_id=1&type=json&per_page=1`;
          const res = await fetch(feedCheckUrl);
          feedAvailability[pid] = res.status === 200 && (await res.text()).length > 10;
        } catch {
          feedAvailability[pid] = false;
        }
      }));

      // Fetch media list
      const mediaRes = await fetch(
        `https://services.daisycon.com/publishers/${publisherId}/media?page=1&per_page=100`,
        { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
      );

      let mediaList: any[] = [];
      if (mediaRes.ok) {
        mediaList = await mediaRes.json();
      }

      return new Response(
        JSON.stringify({ subscriptions, media: mediaList, program_names: programNames, feed_availability: feedAvailability }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "test_feed") {
      const pid = body.program_id;
      const mid = body.media_id;
      
      // Get access token
      const { data: tokenRow } = await supabase
        .from("daisycon_tokens")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (!tokenRow) throw new Error("Not connected");
      
      const publisherId = Deno.env.get("DAISYCON_PUBLISHER_ID");
      
      // Try the REST API productfeeds endpoint
      const apiUrl = `https://services.daisycon.com/publishers/${publisherId}/programs/${pid}/media/${mid}/productfeeds?page=1&per_page=5`;
      console.log("Testing API URL:", apiUrl);
      
      const apiRes = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${tokenRow.access_token}`, Accept: "application/json" },
      });
      const apiText = await apiRes.text();
      console.log("API response:", apiRes.status, apiText.substring(0, 1000));
      
      // Also try the datafeed URL with different standard_ids
      const results: any = { api_response: { status: apiRes.status, body: apiText.substring(0, 2000) }, feed_tests: [] };
      
      for (const stdId of [1, 2, 3, 4, 5]) {
        const feedUrl = `https://daisycon.io/datafeed/?program_id=${pid}&media_id=${mid}&standard_id=${stdId}&language_code=nl&locale_id=1&type=json&per_page=2`;
        const res = await fetch(feedUrl);
        const text = await res.text();
        results.feed_tests.push({ standard_id: stdId, status: res.status, length: text.length, preview: text.substring(0, 500) });
      }
      
      return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
