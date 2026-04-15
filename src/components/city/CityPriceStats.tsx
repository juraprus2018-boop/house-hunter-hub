import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

interface CityPriceStatsProps {
  cityName: string;
}

const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(n);

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  huis: "Huis",
  studio: "Studio",
  kamer: "Kamer",
};

const CityPriceStats = ({ cityName }: CityPriceStatsProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["city-price-stats", cityName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("property_type, listing_type, price")
        .eq("status", "actief")
        .ilike("city", `%${cityName}%`)
        .limit(5000);

      if (error) throw error;

      const groups: Record<string, { prices: number[]; count: number }> = {};

      for (const row of data || []) {
        const key = `${row.listing_type}-${row.property_type}`;
        if (!groups[key]) groups[key] = { prices: [], count: 0 };
        groups[key].prices.push(row.price);
        groups[key].count++;
      }

      const result: Array<{
        listingType: string;
        propertyType: string;
        avgPrice: number;
        minPrice: number;
        maxPrice: number;
        count: number;
      }> = [];

      for (const [key, group] of Object.entries(groups)) {
        if (group.count < 2) continue;
        const [listingType, propertyType] = key.split("-");
        const sorted = group.prices.sort((a, b) => a - b);
        const avg = Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length);
        result.push({
          listingType,
          propertyType,
          avgPrice: avg,
          minPrice: sorted[0],
          maxPrice: sorted[sorted.length - 1],
          count: group.count,
        });
      }

      return result.sort((a, b) => b.count - a.count);
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="border-t py-12">
        <div className="container max-w-4xl">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!stats || stats.length === 0) return null;

  return (
    <section className="border-t py-12">
      <div className="container">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Gemiddelde prijzen in {cityName}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={`${stat.listingType}-${stat.propertyType}`} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {TYPE_LABELS[stat.propertyType] || stat.propertyType}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {stat.listingType === "huur" ? "Huur" : "Koop"}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">{formatEuro(stat.avgPrice)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatEuro(stat.minPrice)} – {formatEuro(stat.maxPrice)} · {stat.count} woningen
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-base text-muted-foreground">
          Prijzen zijn gebaseerd op het huidige actieve aanbod in {cityName} en worden dagelijks bijgewerkt.
        </p>
      </div>
    </section>
  );
};

export default CityPriceStats;
