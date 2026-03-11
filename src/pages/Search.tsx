import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperties, useFilterFacets } from "@/hooks/useProperties";
import { Search, SlidersHorizontal, List, Map } from "lucide-react";
import ExploreMap from "@/components/explore/ExploreMap";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import SearchFilters, { type SearchFilterValues } from "@/components/search/SearchFilters";

const EMPTY_FILTERS: SearchFilterValues = {
  city: "",
  propertyType: "",
  listingType: "",
  maxPrice: undefined,
  minBedrooms: undefined,
  minSurface: undefined,
  includeInactive: false,
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [filters, setFilters] = useState<SearchFilterValues>({
    ...EMPTY_FILTERS,
    city: searchParams.get("locatie") || "",
    propertyType: (searchParams.get("type") as SearchFilterValues["propertyType"]) || "",
    listingType: (searchParams.get("aanbod") as SearchFilterValues["listingType"]) || "",
    maxPrice: searchParams.get("maxPrijs") ? Number(searchParams.get("maxPrijs")) : undefined,
  });

  // Debounced city value for the actual query
  const [debouncedCity, setDebouncedCity] = useState(filters.city);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedCity(filters.city);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [filters.city]);

  // Sync URL params when filters change (use debounced city)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedCity) params.set("locatie", debouncedCity);
    if (filters.propertyType) params.set("type", filters.propertyType);
    if (filters.listingType) params.set("aanbod", filters.listingType);
    if (filters.maxPrice) params.set("maxPrijs", String(filters.maxPrice));
    setSearchParams(params, { replace: true });
  }, [debouncedCity, filters.propertyType, filters.listingType, filters.maxPrice, setSearchParams]);

  const { data: facets } = useFilterFacets({
    city: debouncedCity || undefined,
    propertyType: filters.propertyType || undefined,
    listingType: filters.listingType || undefined,
    includeInactive: filters.includeInactive,
  });

  const { data, isLoading } = useProperties({
    city: debouncedCity || undefined,
    propertyType: filters.propertyType || undefined,
    listingType: filters.listingType || undefined,
    maxPrice: filters.maxPrice,
    minBedrooms: filters.minBedrooms,
    minSurface: filters.minSurface,
    includeInactive: filters.includeInactive,
    page: currentPage,
    pageSize,
  });
  const properties = data?.properties;
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleFilterChange = useCallback((newFilters: SearchFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setDebouncedCity("");
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const hasActiveFilters = filters.city || filters.propertyType || filters.listingType || filters.maxPrice;

  const seoTitle = useMemo(() => {
    const parts: string[] = [];
    if (filters.listingType === "huur") parts.push("Huurwoningen");
    else if (filters.listingType === "koop") parts.push("Koophuizen");
    else parts.push("Woningen");
    if (debouncedCity) parts.push(`in ${debouncedCity}`);
    return `${parts.join(" ")} | WoonPeek`;
  }, [debouncedCity, filters.listingType]);

  const seoDescription = useMemo(() => {
    const type = filters.listingType === "huur" ? "huurwoningen" : filters.listingType === "koop" ? "koophuizen" : "woningen";
    const location = debouncedCity ? ` in ${debouncedCity}` : "";
    return `Bekijk ${totalCount} ${type}${location} op WoonPeek. Filter op prijs, type en meer.`;
  }, [debouncedCity, filters.listingType, totalCount]);

  const canonicalUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedCity) params.set("locatie", debouncedCity);
    if (filters.listingType) params.set("aanbod", filters.listingType);
    const qs = params.toString();
    return `https://woonpeek.nl/zoeken${qs ? `?${qs}` : ""}`;
  }, [debouncedCity, filters.listingType]);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={seoTitle} description={seoDescription} canonical={canonicalUrl} />
      <Header />
      <main className="flex-1">
        {/* Search Header */}
        <div className="border-b bg-card">
          <div className="container py-4">
            <div className="mb-3">
              <Breadcrumbs items={[
                { label: "Home", href: "/" },
                { label: "Zoeken" },
                ...(debouncedCity ? [{ label: debouncedCity }] : []),
              ]} />
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  Woningen zoeken
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Laden..." : `${totalCount} resultaten gevonden`}
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
                      <SheetDescription>Verfijn je zoekopdracht</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <SearchFilters filters={filters} onChange={handleFilterChange} onClear={clearFilters} />
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
                <SearchFilters filters={filters} onChange={handleFilterChange} onClear={clearFilters} />
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card overflow-hidden">
                      <Skeleton className="aspect-[4/3] w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-6 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : properties && properties.length > 0 ? (
              viewMode === "list" ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="h-[500px] rounded-lg border overflow-hidden">
                    <ExploreMap properties={properties} />
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-display text-lg font-semibold">Geen woningen gevonden</h3>
                  <p className="text-muted-foreground">Pas je filters aan om meer resultaten te zien</p>
                  {hasActiveFilters && (
                    <Button variant="outline" className="mt-4" onClick={clearFilters}>
                      Filters wissen
                    </Button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                    Vorige
                  </Button>
                  <span className="px-4 text-sm text-muted-foreground">
                    Pagina {currentPage} van {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    Volgende
                  </Button>
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
