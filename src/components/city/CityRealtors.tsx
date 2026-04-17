import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Star, Phone, Globe, MapPin } from "lucide-react";
import { useState } from "react";

interface CityRealtorsProps {
  cityName: string;
}

interface Realtor {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  photo_url: string | null;
}

const INITIAL_VISIBLE = 6;

const CityRealtors = ({ cityName }: CityRealtorsProps) => {
  const [showAll, setShowAll] = useState(false);

  // Check if section is enabled in site_settings
  const { data: enabled, isLoading: settingLoading } = useQuery({
    queryKey: ["site-setting", "city_realtors_enabled"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("site_settings")
        .select("value")
        .eq("key", "city_realtors_enabled")
        .maybeSingle();
      // Default true if not set
      if (!data) return true;
      return data.value === true || data.value === "true";
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: realtors, isLoading } = useQuery({
    queryKey: ["city-realtors", cityName],
    queryFn: async () => {
      const { data: cached } = await supabase
        .from("city_realtors")
        .select("*")
        .ilike("city", `%${cityName}%`)
        .order("rating", { ascending: false })
        .limit(20);

      if (cached && cached.length > 0) {
        return cached as Realtor[];
      }

      const { data, error } = await supabase.functions.invoke("fetch-realtors", {
        body: { city: cityName },
      });

      if (error) {
        console.error("Error fetching realtors:", error);
        return [];
      }

      return (data?.realtors || []) as Realtor[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: enabled !== false,
  });

  if (settingLoading) return null;
  if (enabled === false) return null;

  if (isLoading) {
    return (
      <section className="border-t py-12">
        <div className="px-4 md:px-8">
          <Skeleton className="h-8 w-72 mb-6" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!realtors || realtors.length === 0) return null;

  const visibleRealtors = showAll ? realtors : realtors.slice(0, INITIAL_VISIBLE);

  return (
    <section className="border-t py-12">
      <div className="px-4 md:px-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Makelaars in {cityName}
          </h2>
        </div>
        <p className="mb-8 text-base text-muted-foreground max-w-3xl">
          Bekijk lokale makelaars in {cityName} voor persoonlijk advies bij het huren of kopen van een woning.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleRealtors.map((realtor) => (
            <article
              key={realtor.id}
              className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
            >
              {/* Photo */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {realtor.photo_url ? (
                  <img
                    src={realtor.photo_url}
                    alt={`Foto van ${realtor.name}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-foreground line-clamp-1">{realtor.name}</h3>

                {realtor.rating && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm font-medium text-foreground">{realtor.rating}</span>
                    {realtor.reviews_count && realtor.reviews_count > 0 && (
                      <span className="text-xs text-muted-foreground">({realtor.reviews_count} reviews)</span>
                    )}
                  </div>
                )}

                {realtor.address && (
                  <div className="mt-2.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{realtor.address}</span>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {realtor.phone && (
                    <a
                      href={`tel:${realtor.phone}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
                    >
                      <Phone className="h-3 w-3" />
                      Bellen
                    </a>
                  )}
                  {realtor.website && (
                    <a
                      href={realtor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {realtors.length > INITIAL_VISIBLE && !showAll && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-primary bg-background px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Toon alle {realtors.length} makelaars
            </button>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Makelaarsinformatie is afkomstig van Google Maps en wordt periodiek bijgewerkt.
        </p>
      </div>
    </section>
  );
};

export default CityRealtors;
