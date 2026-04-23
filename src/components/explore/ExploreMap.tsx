import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

export interface CommuteRouteInfo {
  address: string;
  lat: number;
  lng: number;
  mode: "driving" | "cycling";
}

interface ExploreMapProps {
  properties: Property[];
  hoveredPropertyId?: string | null;
  commute?: CommuteRouteInfo | null;
}

// Netherlands bounding box
const NL_BOUNDS = L.latLngBounds(
  L.latLng(50.75, 3.2),  // SW
  L.latLng(53.55, 7.22)  // NE
);

const formatPrice = (price: number, listingType: string) => {
  const formatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(price);
  return listingType === "huur" ? `${formatted}/mnd` : formatted;
};

const createCustomIcon = (isHovered = false) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: ${isHovered ? "36px" : "28px"};
      height: ${isHovered ? "36px" : "28px"};
      background: ${isHovered ? "hsl(var(--primary))" : "hsl(var(--primary))"};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3)${isHovered ? ", 0 0 0 4px hsl(var(--primary) / 0.3)" : ""};
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>`,
    iconSize: [isHovered ? 36 : 28, isHovered ? 36 : 28],
    iconAnchor: [isHovered ? 18 : 14, isHovered ? 18 : 14],
  });
};

const ExploreMap = ({ properties, hoveredPropertyId, commute }: ExploreMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterGroupRef = useRef<any>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const workMarkerRef = useRef<L.Marker | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ minutes: number; km: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [52.1326, 5.2913],
      zoom: 8,
      minZoom: 7,
      maxZoom: 18,
      maxBounds: NL_BOUNDS.pad(0.1),
      maxBoundsViscosity: 1.0,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Style zoom controls
    const zoomControl = containerRef.current.querySelector(".leaflet-control-zoom");
    if (zoomControl) {
      (zoomControl as HTMLElement).style.borderRadius = "12px";
      (zoomControl as HTMLElement).style.overflow = "hidden";
      (zoomControl as HTMLElement).style.border = "none";
      (zoomControl as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.15)";
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers with clustering
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    markersRef.current.clear();

    // Create cluster group with custom styling
    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      chunkInterval: 120,
      chunkDelay: 40,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = "small";
        let dims = 40;
        if (count >= 100) { size = "large"; dims = 56; }
        else if (count >= 10) { size = "medium"; dims = 48; }

        return L.divIcon({
          html: `<div style="
            width: ${dims}px;
            height: ${dims}px;
            background: hsl(var(--primary));
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(0,0,0,0.25), 0 0 0 4px hsl(var(--primary) / 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: ${size === "large" ? "16px" : size === "medium" ? "14px" : "13px"};
            font-family: system-ui, sans-serif;
          ">${count}</div>`,
          className: "custom-cluster-icon",
          iconSize: L.point(dims, dims),
        });
      },
    });

    const withCoords = properties.filter((p) => p.latitude && p.longitude);

    for (const property of withCoords) {
      const marker = L.marker(
        [Number(property.latitude), Number(property.longitude)],
        { icon: createCustomIcon(false) }
      ).bindPopup(`
        <div style="min-width:200px;font-family:system-ui,sans-serif">
          ${property.images?.[0] ? `<img src="${property.images[0]}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px" />` : ""}
          <div style="font-weight:600;font-size:14px;margin-bottom:4px">${property.title}</div>
          <div style="color:#666;font-size:12px;margin-bottom:6px">${property.street || ""} ${property.house_number || ""}, ${property.city}</div>
          <div style="font-weight:700;font-size:15px;color:hsl(var(--primary));margin-bottom:8px">${formatPrice(Number(property.price), property.listing_type)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <a href="/woning/${property.slug || property.id}" style="display:inline-block;padding:6px 12px;background:hsl(var(--primary));color:white;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">Bekijken →</a>
            ${commute ? `<button data-route-id="${property.id}" style="cursor:pointer;padding:6px 12px;background:white;color:hsl(var(--primary));border:1px solid hsl(var(--primary));border-radius:6px;font-size:12px;font-weight:600">Toon route</button>` : ""}
          </div>
        </div>
      `, { maxWidth: 250, className: "custom-popup" });

      marker.on("popupopen", (e) => {
        const el = (e as any).popup?.getElement?.() as HTMLElement | undefined;
        const btn = el?.querySelector(`button[data-route-id="${property.id}"]`) as HTMLButtonElement | null;
        if (btn) {
          btn.onclick = () => setSelectedId(property.id);
        }
      });

      markersRef.current.set(property.id, marker);
      clusterGroup.addLayer(marker);
    }

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Fit bounds to properties, but stay within Netherlands
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(
        withCoords.map((p) => [Number(p.latitude), Number(p.longitude)] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [properties]);

  // Highlight hovered marker
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(createCustomIcon(id === hoveredPropertyId));
      if (id === hoveredPropertyId) {
        marker.setZIndexOffset(1000);
      } else {
        marker.setZIndexOffset(0);
      }
    });
  }, [hoveredPropertyId]);

  // Clear selection when commute is removed
  useEffect(() => {
    if (!commute) setSelectedId(null);
  }, [commute]);

  // Draw route from work address to selected property
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Cleanup previous route + work marker
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (workMarkerRef.current) {
      map.removeLayer(workMarkerRef.current);
      workMarkerRef.current = null;
    }
    setRouteInfo(null);

    if (!commute || !selectedId) return;
    const property = properties.find((p) => p.id === selectedId);
    if (!property?.latitude || !property?.longitude) return;

    const profile = commute.mode === "driving" ? "driving" : "cycling";
    const url = `https://router.project-osrm.org/route/v1/${profile}/${commute.lng},${commute.lat};${property.longitude},${property.latitude}?overview=full&geometries=geojson`;

    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return;
        const data = await resp.json();
        const route = data?.routes?.[0];
        if (!route?.geometry || cancelled) return;

        const layer = L.geoJSON(route.geometry, {
          style: {
            color: "hsl(var(--primary))",
            weight: 5,
            opacity: 0.85,
            dashArray: commute.mode === "cycling" ? "8,6" : undefined,
          },
        }).addTo(map);
        routeLayerRef.current = layer;

        // Work address marker (briefcase pin)
        const workIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="
            width:32px;height:32px;
            background:hsl(var(--background));
            border:3px solid hsl(var(--primary));
            border-radius:50%;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            color:hsl(var(--primary));
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        workMarkerRef.current = L.marker([commute.lat, commute.lng], { icon: workIcon })
          .addTo(map)
          .bindPopup(`<div style="font-family:system-ui,sans-serif;font-size:12px"><strong>Werkadres</strong><br/>${commute.address}</div>`);

        const minutes = Math.round((route.duration || 0) / 60);
        const km = Math.round(((route.distance || 0) / 1000) * 10) / 10;
        setRouteInfo({ minutes, km });

        map.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 14 });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [commute, selectedId, properties]);

  return (
    <>
      <style>{`
        .custom-marker { background: none !important; border: none !important; }
        .custom-cluster-icon { background: none !important; border: none !important; }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          padding: 0 !important;
        }
        .custom-popup .leaflet-popup-content { margin: 12px !important; }
        .custom-popup .leaflet-popup-tip { box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; }
      `}</style>
      <div className="relative h-full w-full">
        <div ref={containerRef} className="h-full w-full" style={{ zIndex: 0 }} />
        {routeInfo && commute && (
          <div className="absolute left-3 top-3 z-[400] rounded-lg border bg-card/95 px-3 py-2 text-xs shadow-md backdrop-blur">
            <div className="font-semibold text-foreground">
              {routeInfo.minutes} min {commute.mode === "driving" ? "auto" : "fiets"} · {routeInfo.km} km
            </div>
            <div className="text-muted-foreground">naar {commute.address}</div>
          </div>
        )}
      </div>
    </>
  );
};

export default ExploreMap;
