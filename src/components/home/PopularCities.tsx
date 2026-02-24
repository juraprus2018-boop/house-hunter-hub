import { useQuery } from "@tanstack/react-query";
import propertyPlaceholder from "@/assets/property-placeholder.jpg";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Bed, Square, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CityProperties {
  city: string;
  count: number;
  properties: Array<{
    id: string;
    title: string;
    slug: string | null;
    price: number;
    listing_type: string;
    property_type: string;
    city: string;
    bedrooms: number | null;
    surface_area: number | null;
    images: string[] | null;
  }>;
}

const useTopCities = () => {
  return useQuery({
    queryKey: ["top-cities"],
    queryFn: async () => {
      // Get top 5 cities by property count
      const { data: cityData, error: cityError } = await supabase
        .from("properties")
        .select("city")
        .eq("status", "actief");

      if (cityError) throw cityError;

      // Count per city
      const cityCounts: Record<string, number> = {};
      cityData.forEach((p) => {
        const c = p.city.trim();
        cityCounts[c] = (cityCounts[c] || 0) + 1;
      });

      const top5 = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city, count }));

      // Get 3 properties per city
      const results: CityProperties[] = [];
      for (const { city, count } of top5) {
        const { data: props } = await supabase
          .from("properties")
          .select("id, title, slug, price, listing_type, property_type, city, bedrooms, surface_area, images")
          .eq("status", "actief")
          .eq("city", city)
          .order("views_count", { ascending: false })
          .limit(3);

        results.push({ city, count, properties: props || [] });
      }

      return results;
    },
  });
};

const formatPrice = (price: number, listingType: string) => {
  const formatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return listingType === "huur" ? `${formatted}/mnd` : formatted;
};

const PopularCities = () => {
  const { data: cities, isLoading } = useTopCities();

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (!cities || cities.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">
            Populaire steden
          </h2>
          <p className="mt-2 text-muted-foreground">
            Ontdek woningen in de meest populaire steden op ons platform
          </p>
        </div>

        <div className="space-y-12">
          {cities.map(({ city, count, properties }) => (
            <div key={city}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {city}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {count} {count === 1 ? "woning" : "woningen"} beschikbaar
                    </p>
                  </div>
                </div>
                <Link to={`/${city.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Bekijk alle
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    to={`/woning/${property.slug || property.id}`}
                  >
                    <Card className="group overflow-hidden border-0 shadow-md transition-shadow hover:shadow-xl">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                           src={property.images?.[0] || propertyPlaceholder}
                           alt={property.title}
                           className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                           onError={(e) => { e.currentTarget.src = propertyPlaceholder; }}
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <Badge
                            variant="secondary"
                            className="bg-white/90 capitalize text-foreground text-xs"
                          >
                            {property.property_type}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <h4 className="font-display text-sm font-semibold text-foreground line-clamp-1">
                            {property.title}
                          </h4>
                          <span className="font-display text-sm font-bold text-primary whitespace-nowrap">
                            {formatPrice(Number(property.price), property.listing_type)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          {property.bedrooms && (
                            <div className="flex items-center gap-1">
                              <Bed className="h-3.5 w-3.5" />
                              <span>{property.bedrooms}</span>
                            </div>
                          )}
                          {property.surface_area && (
                            <div className="flex items-center gap-1">
                              <Square className="h-3.5 w-3.5" />
                              <span>{property.surface_area} m²</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCities;
