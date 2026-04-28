import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bed, Maximize, ExternalLink, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackDaisyconClick } from "@/hooks/usePageTracking";

interface PropertyStickyBarProps {
  propertyId: string;
  title: string;
  city: string;
  price: number;
  listingType: string;
  bedrooms?: number | null;
  surfaceArea?: number | null;
  sourceUrl?: string | null;
  sourceSite?: string | null;
  /** Element to observe; bar appears once it scrolls out of view */
  triggerRef: React.RefObject<HTMLElement>;
  /** Fallback contact handler when no external/affiliate URL is available */
  onContact?: () => void;
}

const PropertyStickyBar = ({
  propertyId,
  title,
  city,
  price,
  listingType,
  bedrooms,
  surfaceArea,
  sourceUrl,
  sourceSite,
  triggerRef,
  onContact,
}: PropertyStickyBarProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = triggerRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [triggerRef]);

  const formattedPrice = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  const handleReact = () => {
    if (sourceUrl) {
      trackDaisyconClick(propertyId, sourceUrl, sourceSite || null);
      window.open(sourceUrl, "_blank", "noopener,noreferrer");
    } else if (onContact) {
      onContact();
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-16 z-40 border-b border-border bg-background/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/85 transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}
      aria-hidden={!visible}
    >
      <div className="container flex items-center justify-between gap-3 py-2.5 sm:py-3">
        {/* Info: price + features */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-display text-base font-bold text-foreground sm:text-lg">
              {formattedPrice}
              {listingType === "huur" && (
                <span className="text-xs font-medium text-muted-foreground sm:text-sm"> /mnd</span>
              )}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
            <span className="truncate font-medium text-foreground/80">{city}</span>
            {bedroomsLabel(bedrooms) && (
              <span className="hidden items-center gap-1 sm:flex">
                <Bed className="h-3.5 w-3.5" />
                {bedrooms}
              </span>
            )}
            {surfaceArea ? (
              <span className="hidden items-center gap-1 sm:flex">
                <Maximize className="h-3.5 w-3.5" />
                {surfaceArea} m²
              </span>
            ) : null}
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleReact}
          size="sm"
          className="flex-shrink-0 gap-1.5 whitespace-nowrap"
        >
          {sourceUrl ? (
            <>
              <ExternalLink className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Reageer</span>
              <span className="xs:hidden sm:hidden">Reageer</span>
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Reageer
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const bedroomsLabel = (b?: number | null) => (b && b > 0 ? `${b}` : null);

export default PropertyStickyBar;