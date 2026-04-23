/**
 * Image optimization helpers.
 * For Supabase-hosted images we use the built-in render/transform endpoint to
 * deliver correctly-sized WebP variants. For external (scraped) images we fall
 * back to weserv.nl, a free image proxy that resizes and converts to WebP.
 */

const SUPABASE_HOST = "uszlfqgxjvceugrpavde.supabase.co";

export interface ImgOpts {
  width: number;
  height?: number;
  quality?: number;
  /** Output format. 'auto' picks AVIF when supported by the proxy. Defaults to 'webp'. */
  format?: "webp" | "avif" | "auto";
}

/** Build an optimized URL (WebP, resized) for a property image. */
export const optimizeImage = (src: string | undefined | null, opts: ImgOpts): string => {
  if (!src) return "";
  const { width, height, quality = 70, format = "webp" } = opts;

  // Local bundled assets (Vite hashed paths) - return as-is
  if (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  try {
    const url = new URL(src);

    // Supabase storage: rewrite /object/public/ -> /render/image/public/
    if (url.hostname.endsWith(SUPABASE_HOST) && url.pathname.includes("/storage/v1/object/public/")) {
      const renderPath = url.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      const params = new URLSearchParams({
        width: String(width),
        quality: String(quality),
        resize: "cover",
        // Supabase render endpoint only supports origin/webp; keep webp for broad support
        format: format === "avif" ? "webp" : "webp",
      });
      if (height) params.set("height", String(height));
      return `${url.origin}${renderPath}?${params.toString()}`;
    }

    // External images: route through weserv.nl (free, no auth, returns WebP)
    const params = new URLSearchParams({
      url: src.replace(/^https?:\/\//, ""),
      w: String(width),
      q: String(quality),
      // weserv.nl no longer supports saving to AVIF (returns 400). Force WebP for
      // every external image; browsers that prefer AVIF still get a small, modern
      // WebP which is far better than the original JPG.
      output: "webp",
      fit: "cover",
    });
    if (height) params.set("h", String(height));
    return `https://images.weserv.nl/?${params.toString()}`;
  } catch {
    return src;
  }
};

/** Generate a srcset string for responsive images. */
export const buildSrcSet = (src: string | undefined | null, widths: number[], height?: number, quality = 70, format: ImgOpts["format"] = "webp"): string => {
  if (!src) return "";
  return widths
    .map((w) => {
      const h = height ? Math.round((height / widths[0]) * w) : undefined;
      return `${optimizeImage(src, { width: w, height: h, quality, format })} ${w}w`;
    })
    .join(", ");
};