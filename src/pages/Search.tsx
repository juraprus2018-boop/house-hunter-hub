import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useProperties } from "@/hooks/useProperties";
import { Search, SlidersHorizontal, X, Loader2, MapPin, List, Map } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  
  type PropertyType = "appartement" | "huis" | "studio" | "kamer";
  type ListingType = "huur" | "koop";

  const [filters, setFilters] = useState<{
    city: string;
    propertyType: PropertyType | "";
    listingType: ListingType | "";
    maxPrice: number | undefined;
    minBedrooms: number | undefined;
    minSurface: number | undefined;
  }>({
    city: searchParams.get("locatie") || "",
    propertyType: (searchParams.get("type") as PropertyType) || "",
    listingType: (searchParams.get("aanbod") as ListingType) || "",
    maxPrice: searchParams.get("maxPrijs") ? Number(searchParams.get("maxPrijs")) : undefined,
    minBedrooms: undefined,
    minSurface: undefined,
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const { data: properties, isLoading } = useProperties({
    city: filters.city || undefined,
    propertyType: filters.propertyType || undefined,
    listingType: filters.listingType || undefined,
    maxPrice: filters.maxPrice,
    minBedrooms: filters.minBedrooms,
    minSurface: filters.minSurface,
  });

  const applyFilters = () => {
    setFilters(tempFilters);
    
    const params = new URLSearchParams();
    if (tempFilters.city) params.set("locatie", tempFilters.city);
    if (tempFilters.propertyType) params.set("type", tempFilters.propertyType);
    if (tempFilters.listingType) params.set("aanbod", tempFilters.listingType);
    if (tempFilters.maxPrice) params.set("maxPrijs", String(tempFilters.maxPrice));
    setSearchParams(params);
  };

  const clearFilters = () => {
    const cleared: typeof filters = {
      city: "",
      propertyType: "",
      listingType: "",
      maxPrice: undefined,
      minBedrooms: undefined,
      minSurface: undefined,
    };
    setFilters(cleared);
    setTempFilters(cleared);
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = filters.city || filters.propertyType || filters.listingType || filters.maxPrice;

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Locatie</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Stad of postcode"
            value={tempFilters.city}
            onChange={(e) => setTempFilters({ ...tempFilters, city: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Type woning</Label>
        <Select
          value={tempFilters.propertyType}
          onValueChange={(value: PropertyType | "") => setTempFilters({ ...tempFilters, propertyType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Alle types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="appartement">Appartement</SelectItem>
            <SelectItem value="huis">Huis</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="kamer">Kamer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Aanbod</Label>
        <Select
          value={tempFilters.listingType}
          onValueChange={(value: ListingType | "") => setTempFilters({ ...tempFilters, listingType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Koop & Huur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="huur">Te huur</SelectItem>
            <SelectItem value="koop">Te koop</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Max. prijs: {tempFilters.maxPrice ? `€${tempFilters.maxPrice.toLocaleString("nl-NL")}` : "Geen limiet"}</Label>
        <Slider
          value={[tempFilters.maxPrice || 5000]}
          onValueChange={([value]) => setTempFilters({ ...tempFilters, maxPrice: value })}
          max={5000}
          min={200}
          step={50}
        />
      </div>

      <div className="space-y-2">
        <Label>Min. slaapkamers</Label>
        <Select
          value={tempFilters.minBedrooms?.toString() || ""}
          onValueChange={(value) => setTempFilters({ ...tempFilters, minBedrooms: value ? Number(value) : undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Geen minimum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1+</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={applyFilters} className="flex-1">
          Toepassen
        </Button>
        <Button variant="outline" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Search Header */}
        <div className="border-b bg-card">
          <div className="container py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  Woningen zoeken
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Laden..." : `${properties?.length || 0} resultaten gevonden`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filters
                      {hasActiveFilters && (
                        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          !
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Verfijn je zoekopdracht
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* View toggle */}
                <div className="flex rounded-lg border">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="rounded-l-none"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-6">
          <div className="flex gap-6">
            {/* Desktop filters sidebar */}
            <aside className="hidden w-72 shrink-0 md:block">
              <div className="sticky top-24 rounded-lg border bg-card p-6">
                <h2 className="mb-4 font-display text-lg font-semibold">Filters</h2>
                <FilterContent />
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : properties && properties.length > 0 ? (
                viewMode === "list" ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[500px] items-center justify-center rounded-lg border bg-muted/50">
                    <div className="text-center">
                      <Map className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Kaartweergave komt binnenkort
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-display text-lg font-semibold">
                    Geen woningen gevonden
                  </h3>
                  <p className="text-muted-foreground">
                    Pas je filters aan om meer resultaten te zien
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" className="mt-4" onClick={clearFilters}>
                      Filters wissen
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
