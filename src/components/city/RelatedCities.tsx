import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { cityPath } from "@/lib/cities";

interface RelatedCitiesProps {
  currentCity: string;
}

const useRelatedCities = (currentCity: string) =>
  useQuery({
    queryKey: ["related-cities", currentCity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("city")
        .eq("status", "actief");
      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((p) => {
        const c = p.city.trim();
        if (c.toLowerCase() !== currentCity.toLowerCase()) {
          counts[c] = (counts[c] || 0) + 1;
        }
      });

      return Object.entries(counts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },
  });

const RelatedCities = ({ currentCity }: RelatedCitiesProps) => {
  const { data: cities, isLoading } = useRelatedCities(currentCity);

  if (isLoading || !cities?.length) return null;

  return (
    <section className="border-t bg-card py-12">
      <div className="container">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Woningen in andere steden
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bekijk ook het woningaanbod in steden vergelijkbaar met {currentCity}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cities.map(({ city, count }) => (
            <Link
              key={city}
              to={cityPath(city)}
              className="group flex items-center gap-3 rounded-xl border bg-background p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="block truncate font-medium text-foreground group-hover:text-primary transition-colors">
                  {city}
                </span>
                <span className="text-xs text-muted-foreground">
                  {count} {count === 1 ? "woning" : "woningen"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedCities;
