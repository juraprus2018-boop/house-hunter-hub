import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Home, Maximize, Bed, MapPin, ArrowRight, TrendingUp, Euro } from "lucide-react";
import { cityPath } from "@/lib/cities";

const POPULAR_CITIES = [
  "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven",
  "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
  "Arnhem", "Haarlem", "Leiden", "Maastricht", "Delft",
];

const useBudgetData = (listingType: "huur" | "koop") => {
  return useQuery({
    queryKey: ["budget-tool-data", listingType],
    queryFn: async () => {
      // Fetch aggregated data per city
      const { data, error } = await supabase
        .from("properties")
        .select("city, price, surface_area, bedrooms")
        .eq("status", "actief")
        .eq("listing_type", listingType);

      if (error) throw error;

      // Group by city
      const cityMap: Record<string, { prices: number[]; surfaces: number[]; bedrooms: number[]; count: number }> = {};
      for (const p of data || []) {
        const city = p.city;
        if (!cityMap[city]) cityMap[city] = { prices: [], surfaces: [], bedrooms: [], count: 0 };
        cityMap[city].prices.push(Number(p.price));
        if (p.surface_area) cityMap[city].surfaces.push(p.surface_area);
        if (p.bedrooms) cityMap[city].bedrooms.push(p.bedrooms);
        cityMap[city].count++;
      }

      return cityMap;
    },
    staleTime: 5 * 60 * 1000,
  });
};

const BudgetTool = () => {
  const [budget, setBudget] = useState(1250);
  const [listingType, setListingType] = useState<"huur" | "koop">("huur");
  const { data: cityData, isLoading } = useBudgetData(listingType);

  const isHuur = listingType === "huur";
  const minBudget = isHuur ? 400 : 100000;
  const maxBudget = isHuur ? 3000 : 750000;
  const step = isHuur ? 50 : 25000;

  // Reset budget when switching type
  const handleTypeChange = (val: string) => {
    setListingType(val as "huur" | "koop");
    setBudget(val === "huur" ? 1250 : 300000);
  };

  const cityResults = useMemo(() => {
    if (!cityData) return [];

    return POPULAR_CITIES.map((city) => {
      const data = cityData[city];
      if (!data || data.count < 3) return null;

      const affordable = data.prices.filter((p) => p <= budget);
      if (affordable.length === 0) return null;

      // Find surfaces and bedrooms of affordable properties
      const affordableIndices = data.prices
        .map((p, i) => (p <= budget ? i : -1))
        .filter((i) => i >= 0);

      const affordableSurfaces = affordableIndices
        .map((i) => data.surfaces[i])
        .filter(Boolean);
      const affordableBedrooms = affordableIndices
        .map((i) => data.bedrooms[i])
        .filter(Boolean);

      const avgPrice = affordable.reduce((a, b) => a + b, 0) / affordable.length;
      const avgSurface = affordableSurfaces.length
        ? Math.round(affordableSurfaces.reduce((a, b) => a + b, 0) / affordableSurfaces.length)
        : null;
      const avgBedrooms = affordableBedrooms.length
        ? (affordableBedrooms.reduce((a, b) => a + b, 0) / affordableBedrooms.length).toFixed(1)
        : null;
      const percentage = Math.round((affordable.length / data.count) * 100);

      return {
        city,
        count: affordable.length,
        total: data.count,
        percentage,
        avgPrice: Math.round(avgPrice),
        avgSurface,
        avgBedrooms,
      };
    })
      .filter(Boolean)
      .sort((a, b) => b!.percentage - a!.percentage) as NonNullable<ReturnType<typeof Array.prototype.map>[number]>[];
  }, [cityData, budget]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={`Wat kun je ${isHuur ? "huren" : "kopen"} voor ${formatPrice(budget)}${isHuur ? "/mnd" : ""}? | WoonPeek`}
        description={`Ontdek wat je kunt ${isHuur ? "huren" : "kopen"} met een budget van ${formatPrice(budget)}${isHuur ? " per maand" : ""}. Vergelijk steden op gemiddeld oppervlak, kamers en beschikbaarheid.`}
        canonical="https://www.woonpeek.nl/budget-tool"
      />
      <Header />

      <main className="flex-1">
        <div className="container py-8 lg:py-12">
          <Breadcrumbs items={[
            { label: "Home", href: "/" },
            { label: "Budget Tool" },
          ]} />

          <div className="mt-6 mb-10 max-w-2xl">
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Wat kun je <span className="text-primary">{isHuur ? "huren" : "kopen"}</span> voor{" "}
              <span className="text-primary">{formatPrice(budget)}{isHuur ? "/mnd" : ""}</span>?
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              Vergelijk steden en ontdek waar je het meeste waarde krijgt voor je budget.
            </p>
          </div>

          {/* Controls */}
          <div className="mb-10 rounded-2xl border bg-card p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-10">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Budget</label>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(budget)}{isHuur ? "/mnd" : ""}
                  </span>
                </div>
                <Slider
                  value={[budget]}
                  onValueChange={(val) => setBudget(val[0])}
                  min={minBudget}
                  max={maxBudget}
                  step={step}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(minBudget)}</span>
                  <span>{formatPrice(maxBudget)}</span>
                </div>
              </div>
              <div className="w-full md:w-48">
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Type</label>
                <Select value={listingType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="huur">Huurwoningen</SelectItem>
                    <SelectItem value="koop">Koopwoningen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border bg-card p-6">
                  <div className="h-5 w-32 rounded bg-muted mb-4" />
                  <div className="h-4 w-full rounded bg-muted mb-2" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : cityResults.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cityResults.map((result) => (
                <Card key={result.city} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="font-display text-lg font-bold">{result.city}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {result.percentage}% beschikbaar
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center rounded-lg bg-muted/50 p-2.5">
                        <Euro className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                        <p className="text-sm font-bold">{formatPrice(result.avgPrice)}</p>
                        <p className="text-[10px] text-muted-foreground">gem. prijs</p>
                      </div>
                      {result.avgSurface && (
                        <div className="text-center rounded-lg bg-muted/50 p-2.5">
                          <Maximize className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                          <p className="text-sm font-bold">{result.avgSurface} m²</p>
                          <p className="text-[10px] text-muted-foreground">gem. opp.</p>
                        </div>
                      )}
                      {result.avgBedrooms && (
                        <div className="text-center rounded-lg bg-muted/50 p-2.5">
                          <Bed className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                          <p className="text-sm font-bold">{result.avgBedrooms}</p>
                          <p className="text-[10px] text-muted-foreground">gem. kamers</p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-4">
                      {result.count} van {result.total} woningen binnen budget
                    </p>

                    <Button asChild variant="outline" size="sm" className="w-full gap-1">
                      <Link to={`/zoeken?locatie=${encodeURIComponent(result.city)}&aanbod=${listingType}&max_prijs=${budget}`}>
                        Bekijk woningen <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-12 text-center">
              <Home className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Geen resultaten</h3>
              <p className="text-muted-foreground text-sm">
                Probeer een hoger budget of wissel tussen huur en koop.
              </p>
            </div>
          )}

          {/* SEO Content */}
          <div className="mt-16 mx-auto max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
            <h2 className="font-display text-xl font-bold text-foreground">
              Hoeveel woning krijg je voor je budget?
            </h2>
            <p>
              De woningmarkt in Nederland verschilt enorm per stad. In Amsterdam betaal je al snel €1.500
              per maand voor een klein appartement, terwijl je in steden als Groningen of Tilburg voor
              hetzelfde bedrag een ruime woning kunt huren. Met deze tool vergelijk je direct wat je
              kunt verwachten per stad.
            </p>
            <p>
              WoonPeek verzamelt dagelijks het nieuwste woningaanbod uit heel Nederland. De getoonde
              cijfers zijn gebaseerd op het actuele aanbod en worden dagelijks bijgewerkt. Stel een{" "}
              <Link to="/dagelijkse-alert" className="text-primary hover:underline">dagelijkse alert</Link>{" "}
              in om direct een melding te ontvangen wanneer er een woning binnen je budget beschikbaar komt.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BudgetTool;
