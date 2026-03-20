import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, GraduationCap, Bus, TrainFront, Loader2 } from "lucide-react";

interface AmenityCategory {
  key: string;
  label: string;
  icon: typeof ShoppingCart;
  query: string;
}

interface AmenityResult {
  name: string;
  distance: number; // meters
}

const CATEGORIES: AmenityCategory[] = [
  {
    key: "supermarket",
    label: "Supermarkten",
    icon: ShoppingCart,
    query: `node["shop"="supermarket"]`,
  },
  {
    key: "school",
    label: "Scholen",
    icon: GraduationCap,
    query: `node["amenity"~"school|university|college"]`,
  },
  {
    key: "bus",
    label: "Bushaltes",
    icon: Bus,
    query: `node["highway"="bus_stop"]`,
  },
  {
    key: "train",
    label: "Treinstations",
    icon: TrainFront,
    query: `node["railway"="station"]["station"!="subway"]`,
  },
];

/** Haversine distance in meters */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

interface Props {
  latitude: number;
  longitude: number;
  city: string;
}

const RADIUS = 2000; // 2km search radius

const NearbyAmenities = ({ latitude, longitude, city }: Props) => {
  const [results, setResults] = useState<Record<string, AmenityResult[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchAmenities = async () => {
      setLoading(true);
      setError(false);

      // Build a combined Overpass query for all categories at once
      const unionParts = CATEGORIES.map(
        (c) => `${c.query}(around:${RADIUS},${latitude},${longitude});`
      ).join("\n");

      const query = `
        [out:json][timeout:10];
        (
          ${unionParts}
        );
        out body;
      `;

      try {
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: `data=${encodeURIComponent(query)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        if (!res.ok) throw new Error("Overpass API error");
        const data = await res.json();
        if (cancelled) return;

        const grouped: Record<string, AmenityResult[]> = {};

        for (const cat of CATEGORIES) {
          grouped[cat.key] = [];
        }

        for (const el of data.elements || []) {
          const tags = el.tags || {};
          const name = tags.name || "";
          const dist = haversine(latitude, longitude, el.lat, el.lon);

          if (tags.shop === "supermarket") {
            grouped.supermarket.push({ name: name || "Supermarkt", distance: dist });
          } else if (
            tags.amenity === "school" ||
            tags.amenity === "university" ||
            tags.amenity === "college"
          ) {
            grouped.school.push({ name: name || "School", distance: dist });
          } else if (tags.highway === "bus_stop") {
            grouped.bus.push({ name: name || "Bushalte", distance: dist });
          } else if (tags.railway === "station") {
            grouped.train.push({ name: name || "Station", distance: dist });
          }
        }

        // Sort by distance and take top 3 per category
        for (const key of Object.keys(grouped)) {
          grouped[key] = grouped[key]
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
        }

        setResults(grouped);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAmenities();
    return () => { cancelled = true; };
  }, [latitude, longitude]);

  if (error) return null;

  return (
    <section className="mt-8">
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
        In de buurt van deze woning in {city}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Voorzieningen binnen {RADIUS / 1000} km
      </p>

      {loading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Voorzieningen laden…</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((cat) => {
            const items = results[cat.key] || [];
            const Icon = cat.icon;

            return (
              <Card key={cat.key} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="text-sm font-semibold">{cat.label}</h4>
                  </div>
                  {items.length > 0 ? (
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground truncate mr-2">
                            {item.name}
                          </span>
                          <span className="shrink-0 font-medium text-foreground">
                            {formatDistance(item.distance)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Geen gevonden binnen {RADIUS / 1000} km
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default NearbyAmenities;
