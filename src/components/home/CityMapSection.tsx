import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MapPin, BellRing, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const citySlug = (city: string) =>
  city
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

type CityPoint = {
  city: string;
  count: number;
  lat: number;
  lng: number;
};

const NL_BOUNDS = L.latLngBounds(L.latLng(50.75, 3.2), L.latLng(53.55, 7.22));

const fetchCityPoints = async (): Promise<CityPoint[]> => {
  // Aggregate per city using lat/lng of properties.
  // Fetch in batches to bypass the 1000-row limit.
  const pageSize = 1000;
  let from = 0;
  const rows: { city: string; latitude: number | null; longitude: number | null }[] = [];
  // hard cap to avoid unbounded loops
  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("properties")
      .select("city, latitude, longitude")
      .eq("status", "actief")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as any));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const map = new Map<string, { lat: number; lng: number; count: number; latSum: number; lngSum: number }>();
  for (const r of rows) {
    if (!r.city || r.latitude == null || r.longitude == null) continue;
    const key = r.city.trim();
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.latSum += Number(r.latitude);
      existing.lngSum += Number(r.longitude);
      existing.lat = existing.latSum / existing.count;
      existing.lng = existing.lngSum / existing.count;
    } else {
      map.set(key, {
        lat: Number(r.latitude),
        lng: Number(r.longitude),
        latSum: Number(r.latitude),
        lngSum: Number(r.longitude),
        count: 1,
      });
    }
  }

  return Array.from(map.entries())
    .map(([city, v]) => ({ city, count: v.count, lat: v.lat, lng: v.lng }))
    .sort((a, b) => b.count - a.count);
};

const buildIcon = (count: number) => {
  const size = count >= 100 ? 52 : count >= 25 ? 46 : count >= 5 ? 40 : 34;
  return L.divIcon({
    className: "woonpeek-city-marker",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:hsl(var(--primary));color:hsl(var(--primary-foreground));
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:${size >= 46 ? 14 : 12}px;
      border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25);
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const triggerAlertPrefill = (city: string) => {
  // Notify the alert section to prefill the city
  window.dispatchEvent(new CustomEvent("woonpeek:prefill-alert", { detail: { city } }));
  const el = document.getElementById("daily-alert");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const CityMapSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);
  const [selected, setSelected] = useState<CityPoint | null>(null);

  const { data: points = [], isLoading } = useQuery({
    queryKey: ["city-map-points"],
    queryFn: fetchCityPoints,
    staleTime: 1000 * 60 * 30,
  });

  const totalCities = points.length;
  const totalListings = useMemo(() => points.reduce((s, p) => s + p.count, 0), [points]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [52.2, 5.3],
      zoom: 7,
      minZoom: 6,
      maxZoom: 16,
      maxBounds: NL_BOUNDS.pad(0.2),
      maxBoundsViscosity: 0.9,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", () => setSelected(null));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !points.length) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }
    const cluster = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
    });

    points.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: buildIcon(p.count) });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        setSelected(p);
      });
      cluster.addLayer(marker);
    });

    cluster.addTo(map);
    clusterRef.current = cluster;
  }, [points]);

  return (
    <section className="border-t bg-secondary/30 py-16 md:py-24">
      <div className="container">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Verken het aanbod op de kaart
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Klik op een plaats om direct woningen te bekijken of een alert in te
            stellen voor die gemeente of kern.
          </p>
          {!isLoading && totalListings > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {totalListings.toLocaleString("nl-NL")} actieve woningen in {totalCities} plaatsen
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="relative overflow-hidden rounded-2xl border bg-background shadow-sm">
            <div
              ref={containerRef}
              className="h-[460px] w-full md:h-[560px]"
              aria-label="Kaart met woningaanbod per plaats"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <p className="text-sm text-muted-foreground">Kaart laden…</p>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border bg-background p-6 shadow-sm">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {selected.city}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selected.count} actieve {selected.count === 1 ? "woning" : "woningen"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button asChild className="w-full">
                    <Link to={`/${citySlug(selected.city)}`}>
                      Bekijk woningen in {selected.city}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => triggerAlertPrefill(selected.city)}
                  >
                    <BellRing className="mr-2 h-4 w-4" />
                    Alert instellen voor {selected.city}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <div className="mx-auto inline-flex rounded-full bg-primary/10 p-3 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Selecteer een plaats
                </h3>
                <p className="text-sm text-muted-foreground">
                  Klik op een marker op de kaart om het aanbod en de alert-opties
                  voor die gemeente of kern te zien.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default CityMapSection;