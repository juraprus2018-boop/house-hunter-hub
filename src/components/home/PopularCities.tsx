import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cityPath } from "@/lib/cities";

const useTopCities = () => {
  return useQuery({
    queryKey: ["top-cities-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_city_counts");
      if (error) throw error;
      return (data ?? [])
        .slice(0, 12)
        .map((row: { city: string; count: number }) => ({
          city: row.city,
          count: Number(row.count),
        }));
    },
    staleTime: 5 * 60 * 1000,
  });
};

const PopularCities = () => {
  const { data: cities, isLoading } = useTopCities();

  if (isLoading) {
    return (
      <section className="py-16 md:py-20">
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
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Populaire steden
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Ontdek het woningaanbod in de populairste steden van Nederland
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {cities.map(({ city, count }) => (
            <Link
              key={city}
              to={cityPath(city)}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110 group-hover:bg-primary/15">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {city}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {count} {count === 1 ? "woning" : "woningen"}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/steden">
            <Button variant="outline" className="gap-2">
              Bekijk alle steden
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/huurwoningen">
            <Button variant="outline" className="gap-2">
              Huurwoningen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/appartementen">
            <Button variant="outline" className="gap-2">
              Appartementen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/kamers">
            <Button variant="outline" className="gap-2">
              Kamers
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularCities;
