import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Database } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";

type Property = Database["public"]["Tables"]["properties"]["Row"];

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const highlightedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ExploreMapProps {
  properties: Property[];
  hoveredPropertyId?: string | null;
}

function FitBounds({ properties }: { properties: Property[] }) {
  const map = useMap();
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const withCoords = properties.filter((p) => p.latitude && p.longitude);
    if (withCoords.length > 0 && withCoords.length !== prevLengthRef.current) {
      const bounds = L.latLngBounds(
        withCoords.map((p) => [Number(p.latitude), Number(p.longitude)] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [40, 40] });
      prevLengthRef.current = withCoords.length;
    }
  }, [properties, map]);

  return null;
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
  const propertiesWithCoords = properties.filter((p) => p.latitude && p.longitude);

  return (
    <MapContainer
      center={[52.1326, 5.2913]}
      zoom={7}
      className="h-full w-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds properties={propertiesWithCoords} />
      {propertiesWithCoords.map((property) => (
        <Marker
          key={property.id}
          position={[Number(property.latitude), Number(property.longitude)]}
          icon={hoveredPropertyId === property.id ? highlightedIcon : defaultIcon}
        >
          <Popup>
            <div className="min-w-[200px]">
              {property.images?.[0] && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="mb-2 h-24 w-full rounded object-cover"
                />
              )}
              <Link
                to={`/woning/${property.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {property.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {property.street} {property.house_number}, {property.city}
              </p>
              <p className="mt-1 font-bold text-primary">
                {formatPrice(Number(property.price), property.listing_type)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ExploreMap;
