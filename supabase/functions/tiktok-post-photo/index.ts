/**
 * Plaatst een foto-carrousel (max 35 foto's) naar TikTok als draft (MEDIA_UPLOAD).
 * In Sandbox-mode komt deze in de Inbox/Drafts, gebruiker tikt zelf op "Post".
 * Body: { property_id?: string }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCaption, getValidTikTokToken } from "../_shared/tiktok.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PropertyRow {
  id: string;
  city: string;
  price: number;
  listing_type: string;
  property_type: string | null;
  surface_area: number | null;
  bedrooms: number | null;
  street: string | null;
  house_number: string | null;
  images: string[] | null;
  slug: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let propertyId: string | null = null;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      propertyId = body?.property_id ?? null;
    } catch {
      // ignore
    }
  }

  try {
    // Pick property
    let prop: PropertyRow | null = null;
    if (propertyId) {
      const { data } = await sb.from("properties").select("*").eq("id", propertyId).maybeSingle();
      prop = data as PropertyRow | null;
    } else {
      const { data: posted } = await sb.from("tiktok_posts").select("property_id");
      const excluded = (posted ?? []).map((r: { property_id: string }) => r.property_id);
      let q = sb
        .from("properties")
        .select("*")
        .eq("status", "actief")
        .order("created_at", { ascending: false })
        .limit(30);
      if (excluded.length) q = q.not("id", "in", `(${excluded.join(",")})`);
      const { data } = await q;
      prop = ((data as PropertyRow[] | null) ?? []).find((p) => (p.images?.length ?? 0) >= 2) ?? null;
    }

    if (!prop) throw new Error("No suitable property to post");
    const photos = (prop.images ?? []).slice(0, 35); // TikTok max 35
    if (photos.length < 2) throw new Error(`Property ${prop.id} has fewer than 2 images`);

    // Get TikTok token
    const token = await getValidTikTokToken(supabaseUrl, serviceKey);

    const caption = buildCaption({
      city: prop.city,
      price: Number(prop.price),
      listing_type: prop.listing_type,
      surface_area: prop.surface_area,
      bedrooms: prop.bedrooms,
      property_type: prop.property_type,
    });

    const title =
      prop.listing_type === "huur"
        ? `Te huur in ${prop.city}`
        : `Te koop in ${prop.city}`;

    // TikTok Photo Post via content/init met MEDIA_UPLOAD (= draft/inbox)
    // Compatibel met sandbox-scopes (video.upload).
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title,
          description: caption,
          disable_comment: false,
          privacy_level: "SELF_ONLY", // verplicht in Sandbox / unaudited apps
          auto_add_music: true,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: photos,
        },
        post_mode: "MEDIA_UPLOAD",
        media_type: "PHOTO",
      }),
    });
    const initJson = await initRes.json();
    if (!initRes.ok || initJson?.error?.code !== "ok") {
      throw new Error(`TikTok photo init failed: ${JSON.stringify(initJson)}`);
    }

    const publishId: string = initJson.data?.publish_id ?? "unknown";

    await sb.from("tiktok_posts").insert({
      property_id: prop.id,
      caption,
      publish_id: publishId,
      status: "uploaded_to_inbox",
      notes: `photo carousel (${photos.length} foto's)`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        property_id: prop.id,
        publish_id: publishId,
        photo_count: photos.length,
        message:
          "Foto-carrousel naar TikTok inbox gestuurd. Open de TikTok-app en tik op 'Post' om te publiceren.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[tiktok-post-photo]", msg);
    if (propertyId) {
      await sb.from("tiktok_posts").insert({
        property_id: propertyId,
        status: "failed",
        error_message: msg,
        notes: "photo carousel",
      });
    }
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});