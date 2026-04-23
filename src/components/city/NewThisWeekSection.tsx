import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/properties/PropertyCard";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface NewThisWeekSectionProps {
  /** Full list of city properties; the section filters down to the freshest week itself. */
  properties: Property[];
  /** City name shown in copy + ctas. */
  cityName: string;
  /** Slug used to build the "view all" link to /nieuw-aanbod/[city]. */
  citySlug: string;
  /** Hide the section completely if fewer than this many fresh listings (default 3). */
  minimum?: number;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Highlights properties added in the last 7 days at the top of a city page.
 *
 * Why a dedicated section?
 * - Encourages return visits ("there's always something new this week").
 * - Surfaces fresh demand-driving inventory above the deeper filter results.
 * - Keeps the SEO content (FAQ, neighborhoods) untouched: this is purely client-side slicing.
 */
const NewThisWeekSection = ({ properties, cityName, citySlug, minimum = 3 }: NewThisWeekSectionProps) => {
  const fresh = useMemo(() => {
    const cutoff = Date.now() - ONE_WEEK_MS;
    return properties
      .filter((p) => p.status === "actief" && new Date(p.created_at).getTime() >= cutoff)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [properties]);

  if (fresh.length < minimum) return null;

  return (
    <section
      className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 via-background to-background p-5 md:p-6"
      aria-label={`Nieuw aanbod deze week in ${cityName}`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            {fresh.length} {fresh.length === 1 ? "nieuwe woning" : "nieuwe woningen"} deze week
          </span>
          <h2 className="mt-2 font-display text-xl font-bold text-foreground md:text-2xl">
            Nieuw in {cityName}, sinds vorige week
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deze woningen zijn de afgelopen 7 dagen toegevoegd. Wees er snel bij voor een bezichtiging.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
          <Link to={`/nieuw-aanbod/${citySlug}`}>
            Alle nieuwe woningen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fresh.map((property, idx) => (
          <PropertyCard key={property.id} property={property} priority={idx === 0} />
        ))}
      </div>
    </section>
  );
};

export default NewThisWeekSection;
