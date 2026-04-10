import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Star, Phone, Globe, MapPin } from "lucide-react";

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

const CityRealtors = ({ cityName }: CityRealtorsProps) => {
  const { data: realtors, isLoading } = useQuery({
    queryKey: ["city-realtors", cityName],
    queryFn: async () => {
      // First check DB cache
      const { data: cached } = await supabase
        .from("city_realtors")
        .select("*")
        .ilike("city", `%${cityName}%`)
        .order("rating", { ascending: false })
        .limit(10);

      if (cached && cached.length > 0) {
        return cached as Realtor[];
      }

      // If not cached, call edge function to fetch from Google
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
  });

  if (isLoading) {
    return (
      <section className="border-t py-12">
        <div className="container max-w-5xl">
          <Skeleton className="h-8 w-72 mb-6" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!realtors || realtors.length === 0) return null;

  return (
    <section className="border-t py-12">
      <div className="container max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Makelaars in {cityName}
          </h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Bekijk lokale makelaars in {cityName} voor persoonlijk advies bij het huren of kopen van een woning.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {realtors.map((realtor) => (
            <div key={realtor.id} className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
              <h3 className="font-semibold text-foreground line-clamp-1">{realtor.name}</h3>
              
              {realtor.rating && (
                <div className="mt-1 flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="text-sm font-medium text-foreground">{realtor.rating}</span>
                  {realtor.reviews_count && realtor.reviews_count > 0 && (
                    <span className="text-xs text-muted-foreground">({realtor.reviews_count} reviews)</span>
                  )}
                </div>
              )}

              {realtor.address && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{realtor.address}</span>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {realtor.phone && (
                  <a
                    href={`tel:${realtor.phone}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
                    onClick={(e) => e.stopPropagation()}
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
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Makelaarsinformatie is afkomstig van Google Maps en wordt periodiek bijgewerkt.
        </p>
      </div>
    </section>
  );
};

export default CityRealtors;
