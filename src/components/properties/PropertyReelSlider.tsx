import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Maximize2, X } from "lucide-react";
import { optimizeImage } from "@/lib/imageOptimization";
import { Button } from "@/components/ui/button";

export interface ReelProperty {
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
}

const fmtPrice = (p: number, t: string) => {
  const v = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(p);
  return t === "huur" ? `${v}/mnd` : v;
};

/**
 * TikTok/Reels-stijl verticale slider voor de detail pagina.
 * Pure presentation: swipe/scroll tussen foto's met overlay-info.
 */
const PropertyReelSlider = ({ property }: { property: ReelProperty }) => {
  const images = (property.images || []).slice(0, 8);
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync swipe scroll -> index
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(el.scrollTop / el.clientHeight);
        if (i !== index) setIndex(i);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [index]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ top: i * el.clientHeight, behavior: "smooth" });
  };

  if (!images.length) return null;

  const tag = property.listing_type === "huur" ? "TE HUUR" : "TE KOOP";
  const addr = [property.street, property.house_number].filter(Boolean).join(" ");

  const Reel = ({ inFullscreen = false }: { inFullscreen?: boolean }) => (
    <div
      className={
        inFullscreen
          ? "relative mx-auto h-full w-full max-w-[480px] overflow-hidden bg-black"
          : "relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-black shadow-2xl"
      }
    >
      <div
        ref={trackRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-full w-full snap-start snap-always">
            <img
              src={optimizeImage(src, { width: 720, height: 1280, quality: 75 })}
              alt={`Foto ${i + 1} van ${images.length}: ${property.property_type ?? "woning"} in ${property.city}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Top gradient + tag */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className="rounded-full bg-[#D4A574] px-3 py-1 text-[11px] font-bold tracking-wide text-[#1B4332]">
                {tag}
              </span>
              <span className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {i + 1}/{images.length}
              </span>
            </div>
            {!inFullscreen && (
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                aria-label="Volledig scherm"
                className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}

            {/* Bottom gradient + info */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pb-6 text-white">
              <div className="text-2xl font-extrabold leading-tight drop-shadow">
                {fmtPrice(property.price, property.listing_type)}
              </div>
              <div className="mt-1 text-sm font-semibold opacity-95">{property.city}</div>
              {addr && <div className="text-xs opacity-80">{addr}</div>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {property.surface_area && (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                    {property.surface_area} m²
                  </span>
                )}
                {property.bedrooms != null && (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                    {property.bedrooms} slpk
                  </span>
                )}
                {property.energy_label && (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                    Label {property.energy_label}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Side dots */}
      <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition ${
              i === index ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Up/Down buttons (desktop hint) */}
      <button
        type="button"
        onClick={() => goTo(Math.max(0, index - 1))}
        disabled={index === 0}
        aria-label="Vorige foto"
        className="absolute left-1/2 top-3 hidden -translate-x-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-30 lg:block"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goTo(Math.min(images.length - 1, index + 1))}
        disabled={index === images.length - 1}
        aria-label="Volgende foto"
        className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-30 lg:block"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-accent/10 p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Bekijk in reel-stijl</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Swipe of scroll verticaal door alle foto's, met prijs en kenmerken in beeld.
            </p>
          </div>
        </div>
        <Reel />
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setFullscreen(false)}
            aria-label="Sluit volledig scherm"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
          <Reel inFullscreen />
        </div>
      )}
    </>
  );
};

export default PropertyReelSlider;