import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";

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

    // Get properties created in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: newProperties, error } = await supabase
      .from("properties")
      .select("slug, city")
      .eq("status", "actief")
      .gte("created_at", oneDayAgo)
      .not("slug", "is", null)
      .limit(200);

    if (error) throw error;

    if (!newProperties || newProperties.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new properties to index", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate JWT for Google API
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = btoa(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/indexing",
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
    let submitted = 0;
    let errors = 0;
    const logEntries: Array<{url: string; url_type: string; status: string; response_status: number | null; response_body: string | null}> = [];

    // Submit property URLs
    for (const prop of newProperties) {
      const url = `https://www.woonpeek.nl/woning/${prop.slug}`;
      try {
        const res = await fetch(INDEXING_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ url, type: "URL_UPDATED" }),
        });

        const resBody = await res.text();
        logEntries.push({
          url,
          url_type: "property",
          status: res.ok ? "submitted" : "error",
          response_status: res.status,
          response_body: resBody.substring(0, 500),
        });

        if (res.ok) {
          submitted++;
        } else {
          console.error(`Failed to index ${url}: ${resBody}`);
          errors++;
        }
      } catch (e) {
        console.error(`Error indexing ${url}:`, e);
        logEntries.push({
          url,
          url_type: "property",
          status: "error",
          response_status: null,
          response_body: e.message?.substring(0, 500) || "Unknown error",
        });
        errors++;
      }

      if (submitted % 50 === 0 && submitted > 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Submit city pages
    const uniqueCities = [...new Set(newProperties.map((p) => p.city))];
    for (const city of uniqueCities.slice(0, 20)) {
      const citySlug = city.toLowerCase().replace(/\s+/g, "-");
      const url = `https://www.woonpeek.nl/woningen-${citySlug}`;
      try {
        const res = await fetch(INDEXING_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ url, type: "URL_UPDATED" }),
        });

        const resBody = await res.text();
        logEntries.push({
          url,
          url_type: "city",
          status: res.ok ? "submitted" : "error",
          response_status: res.status,
          response_body: resBody.substring(0, 500),
        });

        if (res.ok) submitted++;
      } catch (e) {
        console.error(`Error indexing city ${city}:`, e);
        logEntries.push({
          url,
          url_type: "city",
          status: "error",
          response_status: null,
          response_body: e.message?.substring(0, 500) || "Unknown error",
        });
      }
    }

    // Batch insert log entries
    if (logEntries.length > 0) {
      const { error: logError } = await supabase
        .from("google_indexing_log")
        .insert(logEntries);
      if (logError) {
        console.error("Failed to insert indexing log:", logError);
      }
    }

    console.log(`Google Indexing: ${submitted} submitted, ${errors} errors out of ${newProperties.length} properties + ${uniqueCities.length} cities`);

    return new Response(
      JSON.stringify({
        message: "Indexing complete",
        properties: newProperties.length,
        cities: uniqueCities.length,
        submitted,
        errors,
        logged: logEntries.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Google Indexing error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
