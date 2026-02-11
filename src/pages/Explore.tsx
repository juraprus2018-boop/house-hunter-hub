import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProperties } from "@/hooks/useProperties";
import { Loader2, MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ExploreMap from "@/components/explore/ExploreMap";

type ListingType = "huur" | "koop";

const ExplorePage = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [listingType, setListingType] = useState<ListingType | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [priceActive, setPriceActive] = useState(false);

  const { data: allProperties, isLoading } = useProperties({
    city: selectedCity || undefined,
    listingType: listingType || undefined,
    maxPrice: priceActive ? maxPrice : undefined,
  });

  // Extract unique cities from properties for the sidebar
  const { data: unfilteredProperties } = useProperties();
  const cities = useMemo(() => {
    if (!unfilteredProperties) return [];
    const cityCount = new Map<string, number>();
    for (const p of unfilteredProperties) {
      const city = p.city;
      if (city) cityCount.set(city, (cityCount.get(city) || 0) + 1);
    }
    return Array.from(cityCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [unfilteredProperties]);

  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Sidebar */}
          <aside className="w-80 shrink-0 overflow-y-auto border-r bg-card">
            <div className="p-5">
              <h2 className="font-display text-lg font-bold">Verkennen</h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Laden..." : `${allProperties?.length || 0} woningen`}
              </p>
            </div>

            <Separator />

            {/* Huur / Koop toggle */}
            <div className="p-5">
              <Label className="mb-2 block text-sm font-medium">Aanbod</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={listingType === "huur" ? "default" : "outline"}
                  onClick={() => setListingType(listingType === "huur" ? null : "huur")}
                  className="flex-1"
                >
                  Te huur
                </Button>
                <Button
                  size="sm"
                  variant={listingType === "koop" ? "default" : "outline"}
                  onClick={() => setListingType(listingType === "koop" ? null : "koop")}
                  className="flex-1"
                >
                  Te koop
                </Button>
              </div>
            </div>

            <Separator />

            {/* Price filter */}
            <div className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm font-medium">Max. prijs</Label>
                <button
                  className={cn(
                    "text-xs underline-offset-2",
                    priceActive ? "text-primary underline" : "text-muted-foreground hover:underline"
                  )}
                  onClick={() => setPriceActive(!priceActive)}
                >
                  {priceActive ? "Actief" : "Inactief"}
                </button>
              </div>
              <p className="mb-3 text-sm font-semibold">
                {priceActive ? `€${maxPrice.toLocaleString("nl-NL")}` : "Geen limiet"}
              </p>
              <Slider
                value={[maxPrice]}
                onValueChange={([v]) => {
                  setMaxPrice(v);
                  if (!priceActive) setPriceActive(true);
                }}
                max={5000}
                min={200}
                step={50}
                disabled={!priceActive}
              />
            </div>

            <Separator />

            {/* City list */}
            <div className="p-5">
              <Label className="mb-3 block text-sm font-medium">Plaatsen</Label>
              {selectedCity && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-2 w-full justify-start text-primary"
                  onClick={() => setSelectedCity(null)}
                >
                  ← Alle plaatsen
                </Button>
              )}
              <div className="space-y-1">
                {cities.map(({ name, count }) => (
                  <button
                    key={name}
                    onClick={() => setSelectedCity(selectedCity === name ? null : name)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                      selectedCity === name
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Badge variant="secondary" className={cn("text-xs", selectedCity === name && "bg-primary-foreground/20 text-primary-foreground")}>
                        {count}
                      </Badge>
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    </span>
                  </button>
                ))}
                {cities.length === 0 && !isLoading && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Geen plaatsen beschikbaar
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Map + results area */}
          <div className="flex flex-1 flex-col">
            {/* Map */}
            <div className="relative h-1/2 min-h-[300px] border-b">
              {isLoading ? (
                <div className="flex h-full items-center justify-center bg-muted/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ExploreMap
                  properties={allProperties || []}
                  hoveredPropertyId={hoveredPropertyId}
                />
              )}
            </div>

            {/* Property cards grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : allProperties && allProperties.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {allProperties.map((property) => (
                    <div
                      key={property.id}
                      onMouseEnter={() => setHoveredPropertyId(property.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                    >
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-display text-lg font-semibold">Geen woningen gevonden</h3>
                  <p className="text-muted-foreground">Pas je filters aan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
