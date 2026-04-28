import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { optimizeImage } from "@/lib/imageOptimization";

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
 * Horizontale full-width foto-slider als extra galerij op de detail pagina.
 */
const PropertyReelSlider = ({ property }: { property: ReelProperty }) => {
  const images = property.images || [];
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / el.clientWidth);
        if (i !== index) setIndex(i);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [index]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (!images.length) return null;

  const tag = property.listing_type === "huur" ? "TE HUUR" : "TE KOOP";

  return (
    <div className="relative w-full">
      <div
        ref={trackRef}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative aspect-[16/9] w-full shrink-0 snap-start snap-always bg-muted sm:aspect-[21/9]"
            style={{ minWidth: "100%" }}
          >
            <img
              src={optimizeImage(src, { width: 1600, height: 900, quality: 78 })}
              alt={`Foto ${i + 1} van ${images.length}: ${property.property_type ?? "woning"} in ${property.city}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="rounded-full bg-[#D4A574] px-3 py-1 text-[11px] font-bold tracking-wide text-[#1B4332]">
                {tag}
              </span>
              <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {i + 1}/{images.length}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 text-white">
              <div className="text-xl font-extrabold drop-shadow sm:text-2xl">
                {fmtPrice(property.price, property.listing_type)}
              </div>
              <div className="text-sm font-medium opacity-90">{property.city}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(Math.max(0, index - 1))}
        disabled={index === 0}
        aria-label="Vorige foto"
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition hover:bg-black/75 disabled:opacity-30 sm:block"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(Math.min(images.length - 1, index + 1))}
        disabled={index === images.length - 1}
        aria-label="Volgende foto"
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition hover:bg-black/75 disabled:opacity-30 sm:block"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PropertyReelSlider;