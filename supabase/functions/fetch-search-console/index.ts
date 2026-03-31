import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEARCH_CONSOLE_API = "https://www.googleapis.com/webmasters/v3/sites";
const SITE_URL = "https://www.woonpeek.nl/";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleServiceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

    if (!googleServiceAccountJson) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_JSON secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(googleServiceAccountJson);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate JWT for Google Search Console API
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = btoa(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }));

    const pemContent = serviceAccount.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "");

    const binaryKey = Uint8Array.from(atob(pemContent), (c: string) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureInput = new TextEncoder().encode(`${header}.${claim}`);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const jwt = `${header}.${claim}.${encodedSignature}`;

    // Exchange JWT for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch Search Console data for yesterday (data is usually 2-3 days delayed)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 2); // 3 days window to catch delayed data

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // Query Search Console for page+query data
    const searchRes = await fetch(
      `${SEARCH_CONSOLE_API}/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ["page", "query", "date"],
          rowLimit: 5000,
          dataState: "all",
        }),
      }
    );

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      throw new Error(`Search Console API error [${searchRes.status}]: ${errBody}`);
    }

    const searchData = await searchRes.json();
    const rows = searchData.rows || [];

    console.log(`Fetched ${rows.length} rows from Search Console`);

    // Filter for relevant landing pages (city pages, listing type pages)
    const relevantPatterns = [
      /woonpeek\.nl\/woningen-/,
      /woonpeek\.nl\/huurwoningen\//,
      /woonpeek\.nl\/koopwoningen\//,
      /woonpeek\.nl\/appartementen\//,
      /woonpeek\.nl\/kamers\//,
      /woonpeek\.nl\/studios\//,
      /woonpeek\.nl\/woning\//,
      /woonpeek\.nl\/blog\//,
      /woonpeek\.nl\/?$/,
    ];

    const trackingEntries: Array<{
      tracked_url: string;
      keyword: string;
      position: number;
      clicks: number;
      impressions: number;
      ctr: number;
      tracked_date: string;
    }> = [];

    for (const row of rows) {
      const page = row.keys[0];
      const query = row.keys[1];
      const date = row.keys[2];

      // Only track relevant pages
      const isRelevant = relevantPatterns.some((p) => p.test(page));
      if (!isRelevant) continue;

      // Only track housing-related queries
      const housingKeywords = [
        "huurwoning", "huurwoningen", "koopwoning", "koopwoningen",
        "appartement", "appartementen", "kamer", "kamers", "studio",
        "woning", "woningen", "huis", "huizen", "huren", "kopen",
        "te huur", "te koop", "woonpeek",
      ];
      const queryLower = query.toLowerCase();
      const isHousingQuery = housingKeywords.some((k) => queryLower.includes(k));
      if (!isHousingQuery) continue;

      trackingEntries.push({
        tracked_url: page,
        keyword: query,
        position: Math.round(row.position * 10) / 10,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: Math.round((row.ctr || 0) * 10000) / 100, // percentage
        tracked_date: date,
      });
    }

    console.log(`Filtered to ${trackingEntries.length} relevant tracking entries`);

    // Upsert in batches
    let inserted = 0;
    const batchSize = 100;
    for (let i = 0; i < trackingEntries.length; i += batchSize) {
      const batch = trackingEntries.slice(i, i + batchSize);
      const { error: upsertError } = await supabase
        .from("google_rank_tracking")
        .upsert(batch, { onConflict: "tracked_url,keyword,tracked_date" });

      if (upsertError) {
        console.error(`Upsert batch error:`, upsertError);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Search Console data fetched",
        totalRows: rows.length,
        trackedEntries: trackingEntries.length,
        inserted,
        dateRange: {
          start: formatDate(startDate),
          end: formatDate(endDate),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Search Console fetch error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
