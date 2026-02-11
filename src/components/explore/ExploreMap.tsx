import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface ExploreMapProps {
  properties: Property[];
  hoveredPropertyId?: string | null;
}

const formatPrice = (price: number, listingType: string) => {
  const formatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(price);
  return listingType === "huur" ? `${formatted}/mnd` : formatted;
};

const ExploreMap = ({ properties, hoveredPropertyId }: ExploreMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView([52.1326, 5.2913], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const withCoords = properties.filter((p) => p.latitude && p.longitude);

    for (const property of withCoords) {
      const marker = L.marker([Number(property.latitude), Number(property.longitude)])
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px">
            ${property.images?.[0] ? `<img src="${property.images[0]}" style="width:100%;height:80px;object-fit:cover;border-radius:4px;margin-bottom:8px" />` : ""}
            <strong>${property.title}</strong><br/>
            <span style="color:#666">${property.street || ""} ${property.house_number || ""}, ${property.city}</span><br/>
            <strong style="color:var(--primary)">${formatPrice(Number(property.price), property.listing_type)}</strong><br/>
            <a href="/woning/${property.id}" style="color:var(--primary)">Bekijken →</a>
          </div>
        `);
      markersRef.current.set(property.id, marker);
    }

    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(
        withCoords.map((p) => [Number(p.latitude), Number(p.longitude)] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [properties]);

  // Highlight hovered marker
  useEffect(() => {
    // No-op for now; could swap icons here
  }, [hoveredPropertyId]);

  return <div ref={containerRef} className="h-full w-full" style={{ zIndex: 0 }} />;
};

export default ExploreMap;
