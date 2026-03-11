import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, TrendingUp, Minus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceAnalysisProps {
  price: number;
  surfaceArea: number | null;
  city: string;
  listingType: string;
  propertyType: string;
}

const useCityPriceStats = (city: string, listingType: string, propertyType: string) => {
  return useQuery({
    queryKey: ["city-price-stats", city, listingType, propertyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("price, surface_area")
        .eq("status", "actief")
        .ilike("city", city)
        .eq("listing_type", listingType as any)
        .eq("property_type", propertyType as any)
        .not("surface_area", "is", null)
        .gt("surface_area", 0)
        .gt("price", 0);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const pricesPerM2 = data
        .filter((p) => p.surface_area && p.surface_area > 0)
        .map((p) => Number(p.price) / p.surface_area!);

      if (pricesPerM2.length < 3) return null;

      const avgPricePerM2 = pricesPerM2.reduce((a, b) => a + b, 0) / pricesPerM2.length;
      const avgPrice = data.reduce((a, b) => a + Number(b.price), 0) / data.length;

      return {
        avgPricePerM2: Math.round(avgPricePerM2),
        avgPrice: Math.round(avgPrice),
        totalListings: data.length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const PriceAnalysis = ({ price, surfaceArea, city, listingType, propertyType }: PriceAnalysisProps) => {
  const { data: stats } = useCityPriceStats(city, listingType, propertyType);

  if (!surfaceArea || surfaceArea <= 0 || !stats) return null;

  const pricePerM2 = Math.round(price / surfaceArea);
  const diffPercent = Math.round(((pricePerM2 - stats.avgPricePerM2) / stats.avgPricePerM2) * 100);
  const isBelow = diffPercent < -2;
  const isAbove = diffPercent > 2;
  const isAverage = !isBelow && !isAbove;

  const DiffIcon = isBelow ? TrendingDown : isAbove ? TrendingUp : Minus;
  const diffLabel = isBelow
    ? `${Math.abs(diffPercent)}% onder gemiddelde`
    : isAbove
      ? `${Math.abs(diffPercent)}% boven gemiddelde`
      : "Rond het gemiddelde";
  const diffColor = isBelow
    ? "text-emerald-600 dark:text-emerald-400"
    : isAbove
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  const isHuur = listingType === "huur";
  const priceLabel = isHuur ? "/mnd" : "";

  return (
    <section>
      <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" /> Prijsanalyse
      </h2>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Top: price per m2 highlight */}
        <div className="border-b bg-muted/30 p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prijs per m²</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {formatCurrency(pricePerM2)}
                <span className="text-base font-normal text-muted-foreground">/m²{priceLabel && ` ${priceLabel}`}</span>
              </p>
            </div>
            <div className={cn("flex items-center gap-1.5 text-sm font-medium", diffColor)}>
              <DiffIcon className="h-4 w-4" />
              {diffLabel}
            </div>
          </div>
        </div>

        {/* Comparison bars */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Deze woning</span>
              <span className="font-medium">{formatCurrency(pricePerM2)}/m²</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min((pricePerM2 / Math.max(pricePerM2, stats.avgPricePerM2)) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Gemiddeld in {city}</span>
              <span className="font-medium">{formatCurrency(stats.avgPricePerM2)}/m²</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-muted-foreground/30 transition-all duration-500"
                style={{ width: `${Math.min((stats.avgPricePerM2 / Math.max(pricePerM2, stats.avgPricePerM2)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-2 rounded-lg border border-dashed p-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Gem. woningprijs</p>
                <p className="text-sm font-semibold">{formatCurrency(stats.avgPrice)}{priceLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Woningen vergeleken</p>
                <p className="text-sm font-semibold">{stats.totalListings}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Gebaseerd op {stats.totalListings} actieve {isHuur ? "huur" : "koop"}woningen van hetzelfde type in {city}.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PriceAnalysis;
