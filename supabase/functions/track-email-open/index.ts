import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const TRANSPARENT_PIXEL = Uint8Array.from(atob(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
), c => c.charCodeAt(0));

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const trackingId = url.searchParams.get("t");

  if (trackingId) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      );
      await supabase
        .from("admin_sent_emails")
        .update({ opened_at: new Date().toISOString() })
        .eq("tracking_id", trackingId)
        .is("opened_at", null);
    } catch (e) {
      console.error("Track open error:", e);
    }
  }

  return new Response(TRANSPARENT_PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
});
