import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface CityNeighborhoodsProps {
  cityName: string;
  citySlug: string;
}

const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(n);

const CityNeighborhoods = ({ cityName, citySlug }: CityNeighborhoodsProps) => {
  const { data: neighborhoods, isLoading } = useQuery({
    queryKey: ["city-neighborhoods", cityName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("neighborhood, price, listing_type, surface_area")
        .eq("status", "actief")
        .ilike("city", `%${cityName}%`)
        .not("neighborhood", "is", null)
        .limit(5000);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const groups: Record<string, { prices: number[]; total: number; huur: number; koop: number }> = {};

      for (const row of data) {
        const nb = (row.neighborhood || "").trim();
        if (!nb || nb.length < 2) continue;
        if (!groups[nb]) groups[nb] = { prices: [], total: 0, huur: 0, koop: 0 };
        groups[nb].prices.push(row.price);
        groups[nb].total++;
        if (row.listing_type === "huur") groups[nb].huur++;
        else groups[nb].koop++;
      }

      return Object.entries(groups)
        .filter(([, g]) => g.total >= 2)
        .map(([name, g]) => ({
          name,
          total: g.total,
          huur: g.huur,
          koop: g.koop,
          avgPrice: Math.round(g.prices.reduce((s, v) => s + v, 0) / g.prices.length),
          minPrice: Math.min(...g.prices),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 12);
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="border-t py-12">
        <div className="container max-w-5xl">
          <Skeleton className="h-8 w-72 mb-6" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!neighborhoods || neighborhoods.length === 0) return null;

  // Find cheapest and most expensive neighborhoods
  const cheapest = [...neighborhoods].sort((a, b) => a.avgPrice - b.avgPrice)[0];
  const mostExpensive = [...neighborhoods].sort((a, b) => b.avgPrice - a.avgPrice)[0];

  return (
    <section className="border-t py-12">
      <div className="container">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Beste wijken in {cityName} om te huren
          </h2>
        </div>
        <p className="mb-6 text-base text-muted-foreground">
          Ontdek welke wijken in {cityName} het meeste aanbod hebben en waar de huurprijzen het laagst zijn.
          {cheapest && mostExpensive && cheapest.name !== mostExpensive.name && (
            <> De goedkoopste wijk is <strong>{cheapest.name}</strong> (gem. {formatEuro(cheapest.avgPrice)}), de duurste is <strong>{mostExpensive.name}</strong> (gem. {formatEuro(mostExpensive.avgPrice)}).</>
          )}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {neighborhoods.map((nb) => (
            <Link
              key={nb.name}
              to={`/wijk/${citySlug}/${nb.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`}
              className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">{nb.name}</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {nb.total} woning{nb.total !== 1 ? "en" : ""}
                </span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatEuro(nb.avgPrice)}
                <span className="text-xs font-normal text-muted-foreground ml-1">gem.</span>
              </div>
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                {nb.huur > 0 && <span>{nb.huur} huur</span>}
                {nb.koop > 0 && <span>{nb.koop} koop</span>}
                <span>Vanaf {formatEuro(nb.minPrice)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CityNeighborhoods;
