import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-tt-signature, x-tt-timestamp",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/**
 * TikTok Webhook receiver.
 *
 * TikTok stuurt hier events naartoe zoals:
 *  - video.publish.complete       → video staat live
 *  - video.publish.failed         → publish ging fout
 *  - video.upload.failed          → upload ging fout
 *  - authorization.removed        → user heeft je app ontkoppeld
 *
 * TikTok kan ook een GET sturen met ?challenge=xxx om de URL te verifiëren.
 * We echoën die challenge dan terug.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── URL verificatie (TikTok stuurt soms GET ?challenge=) ──
  if (req.method === "GET") {
    const url = new URL(req.url);
    const challenge = url.searchParams.get("challenge");
    if (challenge) {
      return new Response(challenge, {
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
        status: 200,
      });
    }
    return new Response("tiktok-webhook ok", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      status: 200,
    });
  }

  try {
    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    console.log("[tiktok-webhook] received:", JSON.stringify(payload));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const event = payload?.event ?? payload?.type ?? "unknown";
    const publishId =
      payload?.content?.publish_id ??
      payload?.publish_id ??
      payload?.data?.publish_id ??
      null;
    const status =
      payload?.content?.status ??
      payload?.status ??
      null;

    // Update tiktok_posts als we de publish_id kennen
    if (publishId) {
      const newStatus =
        event.includes("failed") || status === "FAILED"
          ? "failed"
          : event.includes("complete") || status === "PUBLISHED"
            ? "published"
            : status?.toLowerCase() ?? "updated";

      const { error } = await supabase
        .from("tiktok_posts")
        .update({
          status: newStatus,
          notes: `webhook event: ${event}`,
        })
        .eq("publish_id", publishId);

      if (error) console.error("[tiktok-webhook] update error:", error);
    }

    // authorization.removed → token wegmieteren
    if (event === "authorization.removed" || event === "user.authorization.revoke") {
      const openId = payload?.content?.open_id ?? payload?.open_id;
      if (openId) {
        await supabase.from("tiktok_oauth_tokens").delete().eq("open_id", openId);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("[tiktok-webhook] error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // 200 terug zodat TikTok niet eindeloos retried
    });
  }
});