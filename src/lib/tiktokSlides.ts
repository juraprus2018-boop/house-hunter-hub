import JSZip from "jszip";

export interface SlideProperty {
  id: string;
  title: string;
  city: string;
  price: number;
  listing_type: string;
  property_type?: string | null;
  surface_area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  energy_label?: string | null;
  street?: string | null;
  house_number?: string | null;
  images: string[];
  slug?: string | null;
}

const W = 1080;
const H = 1920; // 9:16

const FOREST = "#1B4332";
const CREAM = "#FAF7F2";
const ACCENT = "#D4A574";

function fmtPrice(p: number, listingType: string) {
  const v = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(p);
  return listingType === "huur" ? `${v} /mnd` : v;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Kon afbeelding niet laden: ${src}`));
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ratio = Math.max(w / img.width, h / img.height);
  const dw = img.width * ratio;
  const dh = img.height * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy;
}

function drawWatermark(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 32px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("WoonPeek.nl", W - 60, H - 60);
  ctx.textAlign = "left";
}

function drawGradientOverlay(ctx: CanvasRenderingContext2D, fromTop = false) {
  const grad = fromTop
    ? ctx.createLinearGradient(0, 0, 0, H * 0.6)
    : ctx.createLinearGradient(0, H * 0.4, 0, H);
  if (fromTop) {
    grad.addColorStop(0, "rgba(0,0,0,0.65)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
  } else {
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.85)");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function newCanvas() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return c;
}

// SLIDE 1 — Hero met grote prijs
async function slideHero(p: SlideProperty): Promise<Blob> {
  const c = newCanvas();
  const ctx = c.getContext("2d")!;

  if (p.images?.[0]) {
    try {
      const img = await loadImage(p.images[0]);
      drawCover(ctx, img, 0, 0, W, H);
    } catch {
      ctx.fillStyle = FOREST;
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = FOREST;
    ctx.fillRect(0, 0, W, H);
  }

  drawGradientOverlay(ctx, false);

  // Top badge
  ctx.fillStyle = ACCENT;
  ctx.fillRect(60, 60, 280, 70);
  ctx.fillStyle = FOREST;
  ctx.font = "700 32px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(p.listing_type === "huur" ? "TE HUUR" : "TE KOOP", 200, 95);

  // Bottom block
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = CREAM;
  ctx.font = "800 110px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(fmtPrice(p.price, p.listing_type), 60, H - 280);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "600 56px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(p.city, 60, H - 200);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "500 36px 'Plus Jakarta Sans', system-ui, sans-serif";
  const addr = [p.street, p.house_number].filter(Boolean).join(" ");
  if (addr) ctx.fillText(addr, 60, H - 145);

  drawWatermark(ctx);

  return await new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.92));
}

// SLIDE 2-4 — Foto met klein info-balkje
async function slidePhoto(p: SlideProperty, imgUrl: string, caption: string): Promise<Blob> {
  const c = newCanvas();
  const ctx = c.getContext("2d")!;

  try {
    const img = await loadImage(imgUrl);
    drawCover(ctx, img, 0, 0, W, H);
  } catch {
    ctx.fillStyle = FOREST;
    ctx.fillRect(0, 0, W, H);
  }

  // Bottom caption pill
  const padX = 50;
  const pillH = 130;
  ctx.fillStyle = "rgba(27, 67, 50, 0.92)";
  ctx.fillRect(0, H - pillH - 100, W, pillH);

  ctx.fillStyle = CREAM;
  ctx.font = "700 48px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(caption, padX, H - 100 - pillH / 2);

  drawWatermark(ctx);
  ctx.textBaseline = "alphabetic";

  return await new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.92));
}

// SLIDE 5 — Stats / outro
async function slideStats(p: SlideProperty): Promise<Blob> {
  const c = newCanvas();
  const ctx = c.getContext("2d")!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, FOREST);
  grad.addColorStop(1, "#0F2E22");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = CREAM;
  ctx.font = "800 72px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = "left";
  wrapText(ctx, "Kenmerken", 70, 220, W - 140, 86);

  // Stats list
  const stats: { label: string; value: string }[] = [];
  if (p.property_type) stats.push({ label: "Type", value: p.property_type });
  if (p.surface_area) stats.push({ label: "Oppervlakte", value: `${p.surface_area} m²` });
  if (p.bedrooms != null) stats.push({ label: "Slaapkamers", value: String(p.bedrooms) });
  if (p.bathrooms != null) stats.push({ label: "Badkamers", value: String(p.bathrooms) });
  if (p.energy_label) stats.push({ label: "Energielabel", value: p.energy_label });
  stats.push({ label: "Prijs", value: fmtPrice(p.price, p.listing_type) });

  let y = 380;
  stats.forEach((s, i) => {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(60, y, W - 120, 110);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 32px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(s.label.toUpperCase(), 90, y + 45);

    ctx.fillStyle = CREAM;
    ctx.font = "700 44px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(s.value, W - 90, y + 70);
    ctx.textAlign = "left";

    y += 130;
  });

  // CTA
  ctx.fillStyle = ACCENT;
  ctx.fillRect(60, H - 280, W - 120, 160);

  ctx.fillStyle = FOREST;
  ctx.font = "800 56px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Bekijk op WoonPeek.nl", W / 2, H - 195);

  ctx.font = "500 32px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("Link in bio", W / 2, H - 150);

  drawWatermark(ctx);

  return await new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.92));
}

export async function generateSlides(p: SlideProperty): Promise<Blob[]> {
  const slides: Blob[] = [];
  slides.push(await slideHero(p));

  const photos = (p.images || []).slice(1, 4);
  const captions = [
    `${p.surface_area ? `${p.surface_area} m²` : "Ruim"} · ${p.bedrooms != null ? `${p.bedrooms} slpk` : "comfort"}`,
    `${p.city}${p.energy_label ? ` · Label ${p.energy_label}` : ""}`,
    "Snel reageren? Link in bio",
  ];
  for (let i = 0; i < photos.length; i++) {
    slides.push(await slidePhoto(p, photos[i], captions[i] ?? ""));
  }
  // Pad with stats slide and ensure 5 slides
  slides.push(await slideStats(p));
  return slides;
}

export async function downloadSlidesZip(p: SlideProperty): Promise<void> {
  const slides = await generateSlides(p);
  const zip = new JSZip();
  slides.forEach((blob, i) => {
    zip.file(`slide-${String(i + 1).padStart(2, "0")}.jpg`, blob);
  });
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `woonpeek-tiktok-${p.slug || p.id}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildTikTokCaption(p: SlideProperty): string {
  const price = fmtPrice(p.price, p.listing_type);
  const type = p.listing_type === "huur" ? "Te huur" : "Te koop";
  const lines = [
    `🏡 ${type} in ${p.city}`,
    `💰 ${price}${p.surface_area ? ` · ${p.surface_area} m²` : ""}${p.bedrooms != null ? ` · ${p.bedrooms} slpk` : ""}`,
    "",
    "👉 Volledige info & reageren via WoonPeek.nl (link in bio)",
    "",
    buildHashtags(p),
  ];
  return lines.join("\n");
}

export function buildHashtags(p: SlideProperty): string {
  const citySlug = p.city.toLowerCase().replace(/[^a-z0-9]/g, "");
  const tags = [
    "#woonpeek",
    "#woningnederland",
    p.listing_type === "huur" ? "#huurwoning" : "#koopwoning",
    p.listing_type === "huur" ? "#tehuur" : "#tekoop",
    `#${citySlug}`,
    `#wonenin${citySlug}`,
    "#nieuweaanbod",
    "#nederland",
    "#huurmarkt",
    "#vastgoed",
    "#dreamhome",
    "#fyp",
  ];
  return tags.join(" ");
}