import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import Header from "@/components/layout/Header";
import PropertyCard from "@/components/properties/PropertyCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties, useMapProperties, useCityList } from "@/hooks/useProperties";
import { Loader2, MapPin, ChevronRight, SlidersHorizontal, X, Navigation, Map as MapIcon, List } from "lucide-react";
import { cn } from "@/lib/utils";
const ExploreMap = lazy(() => import("@/components/explore/ExploreMap"));
import { useIsMobile } from "@/hooks/use-mobile";

type ListingType = "huur" | "koop";

const SOURCE_SITE_LABELS: Record<string, string> = {
  wooniezie: "Wooniezie",
  kamernet: "Kamernet",
  pararius: "Pararius",
  "huurwoningen.nl": "Huurwoningen.nl",
  directwonen: "DirectWonen",
  vesteda: "Vesteda",
};

const DISTANCE_OPTIONS = [5, 10, 15, 25, 50];
const LIST_PAGE_SIZE = 48;

// Haversine distance in km
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const ExplorePage = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [listingType, setListingType] = useState<ListingType | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const isMobile = useIsMobile();

  // Postcode + distance state
  const [postcode, setPostcode] = useState("");
  const [debouncedPostcode, setDebouncedPostcode] = useState("");
  const [distanceKm, setDistanceKm] = useState(10);
  const [postcodeCoords, setPostcodeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce postcode input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedPostcode(postcode.trim());
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [postcode]);

  // Geocode postcode via Nominatim
  useEffect(() => {
    if (!debouncedPostcode || debouncedPostcode.length < 4) {
      setPostcodeCoords(null);
      return;
    }
    let cancelled = false;
    setGeocoding(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(debouncedPostcode)}&country=Netherlands&format=json&limit=1`,
      { headers: { "Accept-Language": "nl" } }
    )
      .then((r) => r.json())
      .then((results) => {
        if (cancelled) return;
        if (results?.[0]) {
          setPostcodeCoords({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
          // Clear city filter when using postcode
          setSelectedCity(null);
        } else {
          setPostcodeCoords(null);
        }
      })
      .catch(() => {
        if (!cancelled) setPostcodeCoords(null);
      })
      .finally(() => {
        if (!cancelled) setGeocoding(false);
      });
    return () => { cancelled = true; };
  }, [debouncedPostcode]);

  // Use paginated query for the list (fast initial load)
  const { data: listData, isLoading } = useProperties({
    listingType: listingType || undefined,
    sourceSite: selectedSource || undefined,
    city: selectedCity || undefined,
    pageSize: 50,
  });

  // Separate lightweight query for map markers (only when map visible)
  const showMap = !isMobile || mobileView === "map";
  const { data: mapData, isLoading: isMapLoading } = useMapProperties({
    listingType: listingType || undefined,
    sourceSite: selectedSource || undefined,
    city: selectedCity || undefined,
  }, showMap);

  const allProperties = listData?.properties || [];
  const totalCount = listData?.totalCount || 0;

  // Properties are already filtered server-side by city/listing/source
  // Only apply postcode distance filter client-side
  const filteredProperties = useMemo(() => {
    if (!postcodeCoords) return allProperties;
    return allProperties.filter((p) => {
      if (!p.latitude || !p.longitude) return false;
      return haversineKm(postcodeCoords.lat, postcodeCoords.lng, Number(p.latitude), Number(p.longitude)) <= distanceKm;
    });
  }, [allProperties, postcodeCoords, distanceKm]);

  // Map properties from the lightweight query
  const filteredMapProperties = useMemo(() => {
    const props = (mapData || []) as any[];
    if (!postcodeCoords) return props;
    return props.filter((p: any) => {
      if (!p.latitude || !p.longitude) return false;
      return haversineKm(postcodeCoords.lat, postcodeCoords.lng, Number(p.latitude), Number(p.longitude)) <= distanceKm;
    });
  }, [mapData, postcodeCoords, distanceKm]);

  // City list from a separate lightweight query
  const { data: cityListData } = useProperties({ pageSize: 1, disablePagination: false });
  const cities = useMemo(() => {
    // We'll use the facets approach instead - for now show empty until loaded
    return [] as { name: string; count: number }[];
  }, []);

  const activeSources = useMemo(() => {
    return Object.entries(SOURCE_SITE_LABELS).map(([value, label]) => ({ value, label, count: 0 }));
  }, []);

  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);

  const totalListPages = Math.max(1, Math.ceil(filteredProperties.length / LIST_PAGE_SIZE));
  const paginatedProperties = useMemo(() => {
    const from = (listPage - 1) * LIST_PAGE_SIZE;
    return filteredProperties.slice(from, from + LIST_PAGE_SIZE);
  }, [filteredProperties, listPage]);

  useEffect(() => {
    setListPage(1);
  }, [selectedCity, listingType, selectedSource, debouncedPostcode, distanceKm]);

  useEffect(() => {
    if (listPage > totalListPages) setListPage(totalListPages);
  }, [listPage, totalListPages]);

  const clearPostcode = useCallback(() => {
    setPostcode("");
    setDebouncedPostcode("");
    setPostcodeCoords(null);
  }, []);

  const sidebarContent = (
    <>
      <div className="p-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Verkennen</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Laden..." : `${filteredProperties.length} woningen`}
          </p>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Separator />

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

      {/* Postcode + distance filter */}
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Postcode</Label>
          <div className="relative">
            <Navigation className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="bijv. 1012AB"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="pl-10 pr-8"
            />
            {postcode && (
              <button
                onClick={clearPostcode}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {geocoding && <p className="text-xs text-muted-foreground">Zoeken...</p>}
          {debouncedPostcode && !geocoding && !postcodeCoords && debouncedPostcode.length >= 4 && (
            <p className="text-xs text-destructive">Postcode niet gevonden</p>
          )}
          {postcodeCoords && (
            <p className="text-xs text-primary">✓ Postcode gevonden</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Afstand: {postcodeCoords ? `${distanceKm} km` : "Vul postcode in"}
          </Label>
          <Slider
            value={[distanceKm]}
            onValueChange={([v]) => setDistanceKm(v)}
            max={50}
            min={1}
            step={1}
            disabled={!postcodeCoords}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {DISTANCE_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => postcodeCoords && setDistanceKm(d)}
                className={cn(
                  "rounded px-1.5 py-0.5 transition-colors",
                  postcodeCoords ? "hover:bg-muted cursor-pointer" : "opacity-50 cursor-not-allowed",
                  distanceKm === d && postcodeCoords && "bg-primary/10 text-primary font-medium"
                )}
              >
                {d}km
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

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
              onClick={() => {
                setSelectedCity(selectedCity === name ? null : name);
                if (name) clearPostcode(); // Clear postcode when selecting city
                if (isMobile) setSidebarOpen(false);
              }}
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

      {activeSources.length > 0 && (
        <>
          <Separator />
          <div className="p-5">
            <Label className="mb-2 block text-sm font-medium">Bron</Label>
            <Select
              value={selectedSource || "all"}
              onValueChange={(v) => setSelectedSource(v === "all" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle bronnen" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Alle bronnen</SelectItem>
                {activeSources.map(({ value, label, count }) => (
                  <SelectItem key={value} value={value}>
                    {label} ({count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </>
  );
  const renderPropertyList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (filteredProperties.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="font-display text-lg font-semibold">Geen woningen gevonden</h3>
          <p className="text-muted-foreground">Pas je filters aan</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {((listPage - 1) * LIST_PAGE_SIZE) + 1}–{Math.min(listPage * LIST_PAGE_SIZE, filteredProperties.length)} van {filteredProperties.length}
          </span>
          <span>Pagina {listPage} / {totalListPages}</span>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedProperties.map((property) => (
            <div
              key={property.id}
              onMouseEnter={() => setHoveredPropertyId(property.id)}
              onMouseLeave={() => setHoveredPropertyId(null)}
            >
              <PropertyCard property={property} />
            </div>
          ))}
        </div>

        {totalListPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={listPage <= 1}
              onClick={() => setListPage((p) => p - 1)}
            >
              Vorige
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={listPage >= totalListPages}
              onClick={() => setListPage((p) => p + 1)}
            >
              Volgende
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
          {/* Mobile top bar */}
          {isMobile && (
            <div className="flex items-center justify-between border-b bg-card px-3 py-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="gap-1.5 h-8 px-2.5"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                </Button>
                <span className="text-xs text-muted-foreground">
                  {isLoading ? "Laden..." : `${filteredProperties.length} woningen`}
                </span>
              </div>
              {/* Mobile view toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={mobileView === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMobileView("list")}
                  className="rounded-none h-8 px-3 gap-1.5"
                >
                  <List className="h-3.5 w-3.5" />
                  Lijst
                </Button>
                <Button
                  variant={mobileView === "map" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMobileView("map")}
                  className="rounded-none h-8 px-3 gap-1.5"
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  Kaart
                </Button>
              </div>
            </div>
          )}

          {/* Mobile sidebar overlay */}
          {isMobile && sidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
              <aside className="relative z-10 w-80 max-w-[85vw] overflow-y-auto bg-card shadow-xl">
                {sidebarContent}
              </aside>
            </div>
          )}

          {/* Desktop sidebar */}
          {!isMobile && (
            <aside className="w-80 shrink-0 overflow-y-auto border-r bg-card">
              {sidebarContent}
            </aside>
          )}

          {/* Content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Desktop: split map + list */}
            {!isMobile && (
              <>
                <div className="relative h-1/2 min-h-[300px] border-b">
                  {isLoading ? (
                    <div className="flex h-full items-center justify-center bg-muted/50">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ExploreMap
                      properties={filteredMapProperties}
                      hoveredPropertyId={hoveredPropertyId}
                    />
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {renderPropertyList()}
                </div>
              </>
            )}

            {/* Mobile: tab-based full-screen view */}
            {isMobile && mobileView === "map" && (
              <div className="flex-1 relative">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center bg-muted/50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ExploreMap
                    properties={filteredMapProperties}
                    hoveredPropertyId={hoveredPropertyId}
                  />
                )}
              </div>
            )}
            {isMobile && mobileView === "list" && (
              <div className="flex-1 overflow-y-auto p-3">
                {renderPropertyList()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
