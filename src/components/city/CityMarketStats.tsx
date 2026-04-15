import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, BarChart3, Euro, Ruler } from "lucide-react";

interface CityMarketStatsProps {
  cityName: string;
}

const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(n);

const BUDGET_SEGMENTS = [800, 1200, 1500, 2000];

export const useCityMarketData = (cityName: string) => {
  return useQuery({
    queryKey: ["city-market-data", cityName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("property_type, listing_type, price, surface_area, bedrooms")
        .eq("status", "actief")
        .ilike("city", `%${cityName}%`)
        .limit(5000);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const huurProps = data.filter((r) => r.listing_type === "huur");
      const koopProps = data.filter((r) => r.listing_type === "koop");

      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
      const median = (arr: number[]) => {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
      };

      const huurPrices = huurProps.map((r) => r.price);
      const koopPrices = koopProps.map((r) => r.price);

      // Price per m²
      const huurWithSurface = huurProps.filter((r) => r.surface_area && r.surface_area > 0);
      const koopWithSurface = koopProps.filter((r) => r.surface_area && r.surface_area > 0);
      const huurPricePerM2 = avg(huurWithSurface.map((r) => r.price / r.surface_area!));
      const koopPricePerM2 = avg(koopWithSurface.map((r) => r.price / r.surface_area!));

      // Budget segments (huur only)
      const budgetSegments = BUDGET_SEGMENTS.map((max) => ({
        max,
        count: huurProps.filter((r) => r.price <= max).length,
      }));

      // Per property type stats
      const typeStats = ["appartement", "huis", "studio", "kamer"]
        .map((type) => {
          const typeHuur = huurProps.filter((r) => r.property_type === type);
          if (typeHuur.length < 1) return null;
          return {
            type,
            count: typeHuur.length,
            avgPrice: avg(typeHuur.map((r) => r.price)),
            medianPrice: median(typeHuur.map((r) => r.price)),
          };
        })
        .filter(Boolean) as Array<{ type: string; count: number; avgPrice: number; medianPrice: number }>;

      return {
        totalHuur: huurProps.length,
        totalKoop: koopProps.length,
        avgHuur: avg(huurPrices),
        medianHuur: median(huurPrices),
        avgKoop: avg(koopPrices),
        huurPricePerM2,
        koopPricePerM2,
        budgetSegments,
        typeStats,
        // For deal label calculation
        avgPriceByType: Object.fromEntries(
          ["appartement", "huis", "studio", "kamer"].map((type) => {
            const prices = huurProps.filter((r) => r.property_type === type).map((r) => r.price);
            return [type, avg(prices)];
          })
        ),
      };
    },
    staleTime: 60 * 1000,
  });
};

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  huis: "Huis",
  studio: "Studio",
  kamer: "Kamer",
};

const CityMarketStats = ({ cityName }: CityMarketStatsProps) => {
  const { data: stats, isLoading } = useCityMarketData(cityName);

  if (isLoading) {
    return (
      <section className="border-t py-12">
        <div className="container max-w-5xl">
          <Skeleton className="h-8 w-72 mb-6" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stats) return null;

  return (
    <section className="border-t py-12">
      <div className="container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Huurmarkt {cityName}: cijfers en statistieken
          </h2>
        </div>
        <p className="mb-6 text-base text-muted-foreground">
          Op basis van {stats.totalHuur + stats.totalKoop} actieve woningen in {cityName}. Dagelijks bijgewerkt.
        </p>

        {/* Key metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.totalHuur > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gem. huurprijs</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{formatEuro(stats.avgHuur)}</div>
              <div className="text-xs text-muted-foreground mt-1">Mediaan: {formatEuro(stats.medianHuur)} p/m</div>
            </div>
          )}
          {stats.huurPricePerM2 > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Huurprijs per m²</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{formatEuro(stats.huurPricePerM2)}</div>
              <div className="text-xs text-muted-foreground mt-1">per m² per maand</div>
            </div>
          )}
          {stats.totalKoop > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gem. koopprijs</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{formatEuro(stats.avgKoop)}</div>
              <div className="text-xs text-muted-foreground mt-1">{stats.totalKoop} koopwoningen</div>
            </div>
          )}
          {stats.koopPricePerM2 > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Koopprijs per m²</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{formatEuro(stats.koopPricePerM2)}</div>
              <div className="text-xs text-muted-foreground mt-1">per m²</div>
            </div>
          )}
        </div>

        {/* Budget segments */}
        {stats.budgetSegments.some((s) => s.count > 0) && (
          <div className="mb-8">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Wat kun je huren in {cityName} voor jouw budget?
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.budgetSegments.map((seg) => (
                <div key={seg.max} className="rounded-xl border bg-card p-4 text-center">
                  <div className="text-lg font-bold text-foreground">Tot {formatEuro(seg.max)}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {seg.count > 0 ? (
                      <span className="text-primary font-semibold">{seg.count} woning{seg.count !== 1 ? "en" : ""}</span>
                    ) : (
                      <span>Geen aanbod</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per type stats */}
        {stats.typeStats.length > 0 && (
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Huurprijzen per woningtype in {cityName}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.typeStats.map((ts) => (
                <div key={ts.type} className="rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{TYPE_LABELS[ts.type] || ts.type}</span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {ts.count} beschikbaar
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold text-foreground">{formatEuro(ts.avgPrice)}</span>
                    <span className="text-xs text-muted-foreground">gemiddeld p/m</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Mediaan: {formatEuro(ts.medianPrice)} per maand
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          Alle prijzen zijn gebaseerd op het huidige actieve aanbod in {cityName} en worden dagelijks bijgewerkt. Prijzen per m² zijn berekend op basis van woningen met bekende oppervlakte.
        </p>
      </div>
    </section>
  );
};

export default CityMarketStats;
