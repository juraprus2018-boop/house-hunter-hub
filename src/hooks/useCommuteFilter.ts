import { useEffect, useState } from "react";
import type { CommuteValue } from "@/components/search/CommuteFilter";

interface PropWithCoords {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
}

const OSRM_BASE = "https://router.project-osrm.org";

// Haversine in km — fast pre-filter to avoid sending unreachable destinations
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function useCommuteFilter<T extends PropWithCoords>(
  properties: T[],
  commute: CommuteValue | null,
) {
  const [allowedIds, setAllowedIds] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!commute) {
      setAllowedIds(null);
      return;
    }
    const withCoords = properties.filter(
      (p) => typeof p.latitude === "number" && typeof p.longitude === "number" && p.latitude !== 0,
    );
    if (withCoords.length === 0) {
      setAllowedIds(new Set());
      return;
    }

    // Pre-filter by max distance (avg speeds: car 60km/h, bike 18km/h)
    const maxKm =
      commute.mode === "driving"
        ? (commute.maxMinutes / 60) * 80
        : (commute.maxMinutes / 60) * 22;
    const candidates = withCoords.filter(
      (p) => haversineKm(commute.lat, commute.lng, p.latitude!, p.longitude!) <= maxKm,
    );
    if (candidates.length === 0) {
      setAllowedIds(new Set());
      return;
    }

    // OSRM Table API limit: keep batches reasonable (URL length)
    const BATCH = 80;
    const profile = commute.mode === "driving" ? "driving" : "cycling";
    const allowed = new Set<string>();
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        for (let i = 0; i < candidates.length; i += BATCH) {
          if (cancelled) return;
          const batch = candidates.slice(i, i + BATCH);
          // coords: source first, then destinations
          const coords = [
            `${commute.lng},${commute.lat}`,
            ...batch.map((p) => `${p.longitude},${p.latitude}`),
          ].join(";");
          const destIdx = batch.map((_, idx) => idx + 1).join(";");
          const url = `${OSRM_BASE}/table/v1/${profile}/${coords}?sources=0&destinations=${destIdx}&annotations=duration`;
          try {
            const resp = await fetch(url);
            if (!resp.ok) continue;
            const data = await resp.json();
            const durations: (number | null)[] = data?.durations?.[0] || [];
            durations.forEach((sec, idx) => {
              if (sec != null && sec / 60 <= commute.maxMinutes) {
                allowed.add(batch[idx].id);
              }
            });
          } catch {
            // skip batch on error
          }
        }
        if (!cancelled) setAllowedIds(allowed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [commute, properties]);

  const filtered = commute && allowedIds ? properties.filter((p) => allowedIds.has(p.id)) : properties;

  return { filtered, loading, active: !!commute, matchCount: allowedIds?.size ?? null };
}
