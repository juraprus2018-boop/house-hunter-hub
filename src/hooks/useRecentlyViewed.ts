import { useEffect, useState, useCallback } from "react";

interface RecentProperty {
  id: string;
  slug: string | null;
  title: string;
  city: string;
  price: number;
  listing_type: string;
  property_type: string;
  image?: string;
  viewedAt: number;
}

const STORAGE_KEY = "woonpeek_recent_viewed";
const MAX_ITEMS = 12;

export const useRecentlyViewed = () => {
  const [items, setItems] = useState<RecentProperty[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  const addProperty = useCallback((property: Omit<RecentProperty, "viewedAt">) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== property.id);
      const updated = [{ ...property, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  return { recentlyViewed: items, addProperty };
};
