import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteProperties, useFilterFacets, useMapProperties } from "@/hooks/useProperties";
import { Search, SlidersHorizontal, List, Map as MapIcon, Loader2, Share2, Check } from "lucide-react";
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
import IncomeBanner from "@/components/search/IncomeBanner";
import CommuteFilter, { type CommuteValue } from "@/components/search/CommuteFilter";
import { useCommuteFilter } from "@/hooks/useCommuteFilter";
import AdSlot from "@/components/ads/AdSlot";
import { toast } from "@/hooks/use-toast";

const EMPTY_FILTERS: SearchFilterValues = {
  city: "",
  propertyType: "",
  listingType: "",
  maxPrice: undefined,
  minBedrooms: undefined,
  minSurface: undefined,
  includeInactive: false,
  grossIncome: undefined,
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [shareCopied, setShareCopied] = useState(false);
  const [commute, setCommute] = useState<CommuteValue | null>(null);
  const pageSize = 12;

  const [filters, setFilters] = useState<SearchFilterValues>({
    ...EMPTY_FILTERS,
    city: searchParams.get("locatie") || "",
    propertyType: (searchParams.get("type") as SearchFilterValues["propertyType"]) || "",
    listingType: (searchParams.get("aanbod") as SearchFilterValues["listingType"]) || "",
    maxPrice: searchParams.get("max_prijs") ? Number(searchParams.get("max_prijs")) : searchParams.get("maxPrijs") ? Number(searchParams.get("maxPrijs")) : undefined,
    minBedrooms: searchParams.get("min_kamers") ? Number(searchParams.get("min_kamers")) : undefined,
    grossIncome: searchParams.get("inkomen") ? Number(searchParams.get("inkomen")) : undefined,
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
    if (filters.maxPrice) params.set("max_prijs", String(filters.maxPrice));
    if (filters.minBedrooms) params.set("min_kamers", String(filters.minBedrooms));
    if (filters.grossIncome) params.set("inkomen", String(filters.grossIncome));
    setSearchParams(params, { replace: true });
  }, [debouncedCity, filters.propertyType, filters.listingType, filters.maxPrice, filters.minBedrooms, filters.grossIncome, setSearchParams]);

  // Log search queries for analytics
  const lastLoggedRef = useRef("");
  useEffect(() => {
    const hasFilters = debouncedCity || filters.propertyType || filters.listingType || filters.maxPrice || filters.minBedrooms;
    if (!hasFilters) return;
    const key = `${debouncedCity}|${filters.listingType}|${filters.propertyType}|${filters.maxPrice}|${filters.minBedrooms}`;
    if (key === lastLoggedRef.current) return;
    lastLoggedRef.current = key;
    const timeout = setTimeout(() => {
      import("@/integrations/supabase/client").then(({ supabase }) => {
        supabase.rpc("log_search_query", {
          _query: debouncedCity || null,
          _city: debouncedCity || null,
          _listing_type: filters.listingType || null,
          _property_type: filters.propertyType || null,
          _max_price: filters.maxPrice || null,
          _min_bedrooms: filters.minBedrooms || null,
        }).then(() => {});
      });
    }, 2000);
    return () => clearTimeout(timeout);
  }, [debouncedCity, filters.propertyType, filters.listingType, filters.maxPrice, filters.minBedrooms]);

  // Effective max price: combine user max with income-based cap (huur only)
  const incomeMaxRent = filters.grossIncome ? Math.floor(filters.grossIncome / 3) : undefined;
  const applyIncomeCap = incomeMaxRent && filters.listingType !== "koop";
  const effectiveMaxPrice = applyIncomeCap
    ? Math.min(filters.maxPrice ?? Infinity, incomeMaxRent)
    : filters.maxPrice;

  const { data: facets } = useFilterFacets({
    city: debouncedCity || undefined,
    propertyType: filters.propertyType || undefined,
    listingType: filters.listingType || undefined,
    maxPrice: effectiveMaxPrice,
    minBedrooms: filters.minBedrooms,
    includeInactive: filters.includeInactive,
  });

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteProperties({
    city: debouncedCity || undefined,
    propertyType: filters.propertyType || undefined,
    listingType: applyIncomeCap && !filters.listingType ? "huur" : (filters.listingType || undefined),
    maxPrice: effectiveMaxPrice,
    minBedrooms: filters.minBedrooms,
    minSurface: filters.minSurface,
    includeInactive: filters.includeInactive,
    pageSize,
  });
  const properties = data?.pages.flatMap(p => p.properties) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: "400px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Separate query for map view: all properties with coordinates
  const { data: mapProperties, isLoading: isMapLoading } = useMapProperties({
    city: debouncedCity || undefined,
    propertyType: filters.propertyType || undefined,
    listingType: applyIncomeCap && !filters.listingType ? "huur" : (filters.listingType || undefined),
    maxPrice: effectiveMaxPrice,
    minBedrooms: filters.minBedrooms,
    minSurface: filters.minSurface,
  }, viewMode === "map" || !!commute);

  // Apply commute filter to the appropriate dataset
  const commuteSourceList = commute ? (mapProperties || []) : properties;
  const { filtered: commuteFiltered, loading: commuteLoading, active: commuteActive, matchCount } = useCommuteFilter(
    commuteSourceList as any,
    commute,
  );
  const visibleListProperties = commuteActive ? commuteFiltered : properties;
  const visibleMapProperties = commuteActive ? commuteFiltered : (mapProperties || []);

  const handleFilterChange = useCallback((newFilters: SearchFilterValues) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setDebouncedCity("");
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
    return `https://www.woonpeek.nl/zoeken${qs ? `?${qs}` : ""}`;
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
                      <SearchFilters filters={filters} onChange={handleFilterChange} onClear={clearFilters} facets={facets} />
                      <div className="mt-6">
                        <CommuteFilter value={commute} onChange={setCommute} />
                      </div>
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
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Share search */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = window.location.href;
                    const title = `Woningen zoeken${debouncedCity ? ` in ${debouncedCity}` : ""}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({ title, text: "Bekijk deze zoekopdracht op WoonPeek", url });
                        return;
                      } catch {
                        // user cancelled - fall through to clipboard
                      }
                    }
                    try {
                      await navigator.clipboard.writeText(url);
                      setShareCopied(true);
                      toast({ title: "Link gekopieerd", description: "Deel hem met wie je wilt." });
                      setTimeout(() => setShareCopied(false), 2500);
                    } catch {
                      toast({ title: "Kopiëren mislukt", variant: "destructive" });
                    }
                  }}
                >
                  {shareCopied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                  {shareCopied ? "Gekopieerd" : "Delen"}
                </Button>
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
                <SearchFilters filters={filters} onChange={handleFilterChange} onClear={clearFilters} facets={facets} />
                <div className="mt-6">
                  <CommuteFilter value={commute} onChange={setCommute} />
                </div>
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
              <AdSlot slotKey="search_page" />
              <IncomeBanner
                grossIncome={filters.grossIncome}
                listingType={filters.listingType}
                onClear={() => setFilters({ ...filters, grossIncome: undefined })}
              />
              {commuteActive && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                  <div>
                    {commuteLoading ? (
                      <span className="text-muted-foreground">Reistijden berekenen…</span>
                    ) : (
                      <>
                        <strong>{matchCount ?? 0}</strong> woningen binnen{" "}
                        <strong>{commute!.maxMinutes} min</strong> {commute!.mode === "driving" ? "auto" : "fiets"} van{" "}
                        <strong>{commute!.address}</strong>
                      </>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setCommute(null)}>
                    Wis
                  </Button>
                </div>
              )}
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
              ) : visibleListProperties && visibleListProperties.length > 0 ? (
              viewMode === "list" ? (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {visibleListProperties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          userIncome={filters.grossIncome}
                        />
                      ))}
                    </div>
                    {/* Infinite scroll trigger */}
                    <div ref={loadMoreRef} className="flex justify-center py-8">
                      {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                      {!hasNextPage && !commuteActive && properties.length > 12 && (
                        <p className="text-sm text-muted-foreground">Alle {totalCount} woningen geladen</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-[500px] rounded-lg border overflow-hidden">
                    {isMapLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ExploreMap properties={visibleMapProperties as any} />
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {visibleMapProperties.length} woningen met locatie op de kaart
                    </p>
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

              {/* Pagination removed - using infinite scroll */}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
