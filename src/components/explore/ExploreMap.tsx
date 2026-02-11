import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface ExploreMapProps {
  properties: Property[];
  hoveredPropertyId?: string | null;
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

const ExploreMap = ({ properties, hoveredPropertyId }: ExploreMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterGroupRef = useRef<any>(null);

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
          <a href="/woning/${property.id}" style="display:inline-block;padding:6px 12px;background:hsl(var(--primary));color:white;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">Bekijken →</a>
        </div>
      `, { maxWidth: 250, className: "custom-popup" });

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
      <div ref={containerRef} className="h-full w-full" style={{ zIndex: 0 }} />
    </>
  );
};

export default ExploreMap;
