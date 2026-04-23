const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/i,
  /^fc/i,
  /^fd/i,
];

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=604800",
  "Vary": "Accept",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const requestUrl = new URL(req.url);
    const src = requestUrl.searchParams.get("src")?.trim();

    if (!src) {
      return json({ error: "Missing src parameter" }, 400);
    }

    const targetUrl = new URL(src);
    if (!/^https?:$/i.test(targetUrl.protocol)) {
      return json({ error: "Only http and https images are allowed" }, 400);
    }

    if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(targetUrl.hostname))) {
      return json({ error: "Host is not allowed" }, 400);
    }

    const upstream = await fetch(targetUrl.toString(), {
      redirect: "follow",
      headers: {
        "Accept": "image/avif,image/webp,image/*,*/*;q=0.8",
        "User-Agent": "WoonPeekImageProxy/1.0",
      },
    });

    if (!upstream.ok) {
      return json({ error: `Upstream image request failed with ${upstream.status}` }, 502);
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return json({ error: "Upstream response is not an image" }, 415);
    }

    const headers = new Headers({
      ...corsHeaders,
      ...CACHE_HEADERS,
      "Content-Type": contentType,
    });

    const contentLength = upstream.headers.get("content-length");
    const etag = upstream.headers.get("etag");
    const lastModified = upstream.headers.get("last-modified");

    if (contentLength) headers.set("Content-Length", contentLength);
    if (etag) headers.set("ETag", etag);
    if (lastModified) headers.set("Last-Modified", lastModified);

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected proxy error";
    return json({ error: message }, 500);
  }
});

function json(payload: Record<string, string>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}