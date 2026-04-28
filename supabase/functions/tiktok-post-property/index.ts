/**
 * Genereert een MP4 slideshow met Shotstack en uploadt naar TikTok inbox als draft.
 * Body: { property_id?: string }  (optioneel, anders kiest hij automatisch nieuwste niet-geposte)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCaption, getValidTikTokToken } from "../_shared/tiktok.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHOTSTACK_BASE = "https://api.shotstack.io/edit/stage"; // 'stage' = sandbox/free; 'v1' = paid prod

interface PropertyRow {
  id: string;
  city: string;
  price: number;
  listing_type: string;
  property_type: string | null;
  surface_area: number | null;
  bedrooms: number | null;
  energy_label: string | null;
  street: string | null;
  house_number: string | null;
  images: string[] | null;
  slug: string | null;
}

function fmtPrice(p: number, t: string) {
  const v = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(p);
  return t === "huur" ? `${v} /mnd` : v;
}

function buildShotstackTimeline(p: PropertyRow) {
  const photos = (p.images ?? []).slice(0, 5);
  const SLIDE_LEN = 3; // seconden per foto
  const FADE = 0.5;
  const tracks: any[] = [];

  // Track 1: foto's met Ken Burns
  const photoClips = photos.map((src, i) => ({
    asset: { type: "image", src },
    start: i * SLIDE_LEN,
    length: SLIDE_LEN,
    fit: "cover",
    effect: i % 2 === 0 ? "zoomIn" : "zoomOut",
    transition: { in: "fade", out: "fade" },
  }));
  tracks.push({ clips: photoClips });

  const totalLength = photos.length * SLIDE_LEN;

  // Track 2: top-banner met "TE HUUR/KOOP"
  tracks.push({
    clips: [
      {
        asset: {
          type: "html",
          html: `<div class="tag">${p.listing_type === "huur" ? "TE HUUR" : "TE KOOP"}</div>`,
          css: ".tag { font-family: 'Open Sans'; font-weight: 700; font-size: 36px; color: #1B4332; background: #D4A574; padding: 14px 30px; border-radius: 999px; display: inline-block; }",
          width: 320,
          height: 90,
          background: "transparent",
        },
        start: 0,
        length: totalLength,
        position: "topLeft",
        offset: { x: 0.05, y: -0.05 },
      },
    ],
  });

  // Track 3: bottom info card (prijs + stad)
  const addr = [p.street, p.house_number].filter(Boolean).join(" ");
  const subline = [
    p.surface_area ? `${p.surface_area} m²` : null,
    p.bedrooms != null ? `${p.bedrooms} slpk` : null,
    p.energy_label ? `Label ${p.energy_label}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  tracks.push({
    clips: [
      {
        asset: {
          type: "html",
          html: `<div class="card"><div class="price">${fmtPrice(p.price, p.listing_type)}</div><div class="city">${p.city}</div>${addr ? `<div class="addr">${addr}</div>` : ""}${subline ? `<div class="sub">${subline}</div>` : ""}</div>`,
          css: `
            .card { font-family: 'Open Sans'; color: #FAF7F2; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 60%); padding: 40px 40px 60px; width: 100%; box-sizing: border-box; }
            .price { font-size: 84px; font-weight: 800; line-height: 1; }
            .city { font-size: 48px; font-weight: 700; margin-top: 8px; }
            .addr { font-size: 28px; opacity: 0.85; margin-top: 4px; }
            .sub { font-size: 28px; opacity: 0.9; margin-top: 12px; }
          `,
          width: 1080,
          height: 600,
          background: "transparent",
        },
        start: 0,
        length: totalLength,
        position: "bottom",
      },
    ],
  });

  // Track 4: watermark
  tracks.push({
    clips: [
      {
        asset: {
          type: "html",
          html: `<div class="wm">WoonPeek.nl</div>`,
          css: ".wm { font-family: 'Open Sans'; font-weight: 600; font-size: 30px; color: rgba(255,255,255,0.85); text-shadow: 0 2px 6px rgba(0,0,0,0.5); }",
          width: 280,
          height: 50,
          background: "transparent",
        },
        start: 0,
        length: totalLength,
        position: "bottomRight",
        offset: { x: -0.04, y: 0.04 },
      },
    ],
  });

  return {
    timeline: { background: "#000000", tracks },
    output: { format: "mp4", resolution: "1080", aspectRatio: "9:16", fps: 30 },
  };
}

async function renderShotstack(payload: unknown, apiKey: string): Promise<string> {
  // 1. queue render
  const submitRes = await fetch(`${SHOTSTACK_BASE}/render`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const submit = await submitRes.json();
  if (!submitRes.ok || !submit?.success) {
    throw new Error(`Shotstack submit failed: ${JSON.stringify(submit)}`);
  }
  const renderId = submit.response.id;

  // 2. poll (max 90s)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const stRes = await fetch(`${SHOTSTACK_BASE}/render/${renderId}`, {
      headers: { "x-api-key": apiKey },
    });
    const st = await stRes.json();
    const status = st?.response?.status;
    if (status === "done") return st.response.url as string;
    if (status === "failed") throw new Error(`Shotstack render failed: ${st?.response?.error ?? "unknown"}`);
  }
  throw new Error("Shotstack render timeout (>90s)");
}

/**
 * Download Shotstack video en upload naar tiktok-media bucket.
 * TikTok eist URL ownership op het bron-domein.
 */
async function rehostVideo(
  sb: ReturnType<typeof createClient>,
  propertyId: string,
  videoUrl: string,
): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Failed to download Shotstack video: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const path = `${propertyId}/${Date.now()}.mp4`;
  const { error } = await sb.storage
    .from("tiktok-media")
    .upload(path, buf, { contentType: "video/mp4", upsert: true });
  if (error) throw new Error(`Video rehost failed: ${error.message}`);
  return `${supabaseUrl}/storage/v1/object/public/tiktok-media/${path}`;
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
      // pick newest active property with >=2 images, not yet posted
      const { data: posted } = await sb.from("tiktok_posts").select("property_id");
      const excluded = (posted ?? []).map((r: { property_id: string }) => r.property_id);
      let q = sb
        .from("properties")
        .select("*")
        .eq("status", "actief")
        .order("created_at", { ascending: false })
        .limit(20);
      if (excluded.length) q = q.not("id", "in", `(${excluded.join(",")})`);
      const { data } = await q;
      prop = ((data as PropertyRow[] | null) ?? []).find((p) => (p.images?.length ?? 0) >= 2) ?? null;
    }

    if (!prop) throw new Error("No suitable property to post");
    if (!prop.images || prop.images.length < 2) {
      throw new Error(`Property ${prop.id} has fewer than 2 images`);
    }

    const shotstackKey = Deno.env.get("SHOTSTACK_API_KEY");
    if (!shotstackKey) throw new Error("SHOTSTACK_API_KEY not configured");

    // 1) Render video
    const payload = buildShotstackTimeline(prop);
    const shotstackUrl = await renderShotstack(payload, shotstackKey);

    // 1b) Rehost naar onze bucket (TikTok URL ownership)
    const videoUrl = await rehostVideo(sb, prop.id, shotstackUrl);

    // 2) Get TikTok token (auto refresh)
    const token = await getValidTikTokToken(supabaseUrl, serviceKey);

    // 3) Init TikTok upload via PULL_FROM_URL
    const caption = buildCaption({
      city: prop.city,
      price: Number(prop.price),
      listing_type: prop.listing_type,
      surface_area: prop.surface_area,
      bedrooms: prop.bedrooms,
      property_type: prop.property_type,
    });

    // DIRECT_POST: publiceert direct op het profiel zonder draft.
    // Vereist Direct Post toggle aan in TikTok Developer Portal.
    // Niet-audited apps: privacy_level MOET SELF_ONLY zijn (alleen jij ziet 'm).
    // Na app audit: zet PRIVACY_LEVEL hieronder op "PUBLIC_TO_EVERYONE".
    const PRIVACY_LEVEL = Deno.env.get("TIKTOK_PRIVACY_LEVEL") || "SELF_ONLY";
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: caption.slice(0, 2200),
          privacy_level: PRIVACY_LEVEL,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: videoUrl,
        },
        post_mode: "DIRECT_POST",
        media_type: "VIDEO",
      }),
    });
    const initJson = await initRes.json();
    if (!initRes.ok || initJson?.error?.code !== "ok") {
      throw new Error(`TikTok init failed: ${JSON.stringify(initJson)}`);
    }

    const publishId: string = initJson.data?.publish_id ?? "unknown";

    // 4) Log
    await sb.from("tiktok_posts").insert({
      property_id: prop.id,
      caption,
      publish_id: publishId,
      video_url: videoUrl,
      status: "uploaded_to_inbox",
    });

    return new Response(
      JSON.stringify({
        success: true,
        property_id: prop.id,
        publish_id: publishId,
        video_url: videoUrl,
        message:
          PRIVACY_LEVEL === "PUBLIC_TO_EVERYONE"
            ? "Video direct gepubliceerd op TikTok."
            : "Video direct geplaatst (privé / SELF_ONLY zichtbaar tot app audit).",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[tiktok-post-property]", msg);
    if (propertyId) {
      await sb.from("tiktok_posts").insert({
        property_id: propertyId,
        status: "failed",
        error_message: msg,
      });
    }
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});