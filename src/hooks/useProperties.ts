import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];
type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

interface PropertyFilters {
  city?: string;
  propertyType?: PropertyType;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  minBedrooms?: number;
  sourceSite?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
  disablePagination?: boolean;
}

const DEFAULT_BATCH_SIZE = 1000;

const applyPropertyFilters = <T,>(query: T, filters?: PropertyFilters) => {
  let q: any = query;

  if (!filters?.includeInactive) {
    q = q.eq("status", "actief");
  } else {
    q = q.in("status", ["actief", "inactief", "verhuurd", "verkocht"]);
  }

  if (filters?.city) {
    const cityValue = filters.city.trim();
    const isPostalCode = /^\d/.test(cityValue);
    if (isPostalCode) {
      q = q.ilike("postal_code", `%${cityValue}%`);
    } else {
      q = q.ilike("city", `%${cityValue}%`);
    }
  }

  if (filters?.propertyType) q = q.eq("property_type", filters.propertyType);
  if (filters?.listingType) q = q.eq("listing_type", filters.listingType);
  if (filters?.minPrice) q = q.gte("price", filters.minPrice);
  if (filters?.maxPrice) q = q.lte("price", filters.maxPrice);
  if (filters?.minSurface) q = q.gte("surface_area", filters.minSurface);
  if (filters?.minBedrooms) q = q.gte("bedrooms", filters.minBedrooms);
  if (filters?.sourceSite) q = q.eq("source_site", filters.sourceSite);

  return q as T;
};

export const useProperties = (filters?: PropertyFilters) => {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: async () => {
      // Paginated mode (default)
      if (!filters?.disablePagination) {
        const page = filters?.page || 1;
        const pageSize = filters?.pageSize || 12;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from("properties")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);

        query = applyPropertyFilters(query, filters);

        const { data, error, count } = await query;
        if (error) throw error;

        return { properties: (data as Property[]) || [], totalCount: count || 0 };
      }

      // Full mode (all rows) - fetch in batches to avoid 1000-row API limit
      const { count, error: countError } = await applyPropertyFilters(
        supabase.from("properties").select("id", { count: "exact", head: true }),
        filters
      );
      if (countError) throw countError;

      const allProperties: Property[] = [];
      let from = 0;

      while (true) {
        let batchQuery = supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + DEFAULT_BATCH_SIZE - 1);

        batchQuery = applyPropertyFilters(batchQuery, filters);

        const { data, error } = await batchQuery;
        if (error) throw error;
        if (!data || data.length === 0) break;

        allProperties.push(...(data as Property[]));

        if (data.length < DEFAULT_BATCH_SIZE) break;
        from += DEFAULT_BATCH_SIZE;
      }

      return { properties: allProperties, totalCount: count || allProperties.length };
    },
  });
};

export const useMapProperties = (filters?: Omit<PropertyFilters, "page" | "pageSize" | "disablePagination">, enabled = true) => {
  return useQuery({
    queryKey: ["map-properties", filters],
    queryFn: async () => {
      const allMapProperties: Property[] = [];
      let from = 0;

      while (true) {
        let query = supabase
          .from("properties")
          .select("id, title, price, listing_type, property_type, city, street, house_number, slug, images, latitude, longitude, status, bedrooms, surface_area, source_site")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("created_at", { ascending: false })
          .range(from, from + DEFAULT_BATCH_SIZE - 1);

        query = applyPropertyFilters(query, filters);

        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;

        allMapProperties.push(...(data as unknown as Property[]));

        if (data.length < DEFAULT_BATCH_SIZE) break;
        from += DEFAULT_BATCH_SIZE;
      }

      return allMapProperties;
    },
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useProperty = (slugOrId: string) => {
  return useQuery({
    queryKey: ["property", slugOrId],
    queryFn: async () => {
      // Try slug first, fall back to id (for backwards compatibility)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq(isUuid ? "id" : "slug", slugOrId)
        .maybeSingle();

      if (error) throw error;
      return data as Property | null;
    },
    enabled: !!slugOrId,
  });
};

export const generatePropertySlug = (property: { street: string; house_number: string; city: string }) => {
  return `${property.street}-${property.house_number}-${property.city}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const useUserProperties = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-properties", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
    enabled: !!user,
  });
};

export const useCreateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (property: PropertyInsert) => {
      const { data, error } = await supabase
        .from("properties")
        .insert(property)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
    },
  });
};

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...property }: PropertyUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("properties")
        .update(property)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property", data.id] });
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["user-properties"] });
    },
  });
};

export const useFeaturedProperties = () => {
  return useQuery({
    queryKey: ["featured-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "actief")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Property[];
    },
  });
};

export const useSimilarProperties = (currentId: string, city: string, listingType: string) => {
  return useQuery({
    queryKey: ["similar-properties", currentId, city, listingType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "actief")
        .eq("city", city)
        .eq("listing_type", listingType as ListingType)
        .neq("id", currentId)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as Property[];
    },
    enabled: !!currentId && !!city && !!listingType,
  });
};

export interface FilterFacets {
  propertyTypes: Record<string, number>;
  listingTypes: Record<string, number>;
  bedroomCounts: Record<string, number>;
  surfaceRanges: Record<string, number>;
  priceMax: number;
}

interface FacetFilters {
  city?: string;
  propertyType?: string;
  listingType?: string;
  maxPrice?: number;
  minBedrooms?: number;
  includeInactive?: boolean;
}

export const useFilterFacets = (filters: FacetFilters) => {
  return useQuery({
    queryKey: ["filter-facets", filters.city, filters.propertyType, filters.listingType, filters.maxPrice, filters.minBedrooms, filters.includeInactive],
    queryFn: async () => {
      // We need to fetch minimal data to compute facets
      // Only select the fields we need for counting
      let query = supabase
        .from("properties")
        .select("property_type, listing_type, bedrooms, surface_area, price");

      if (!filters.includeInactive) {
        query = query.eq("status", "actief");
      }

      if (filters.city) {
        const isPostalCode = /^\d/.test(filters.city.trim());
        if (isPostalCode) {
          query = query.ilike("postal_code", `%${filters.city.trim()}%`);
        } else {
          query = query.ilike("city", `%${filters.city}%`);
        }
      }

      const { data, error } = await query.limit(10000);
      if (error) throw error;

      const propertyTypes: Record<string, number> = {};
      const listingTypes: Record<string, number> = {};
      const bedroomCounts: Record<string, number> = {};
      const surfaceRanges: Record<string, number> = { "25": 0, "50": 0, "75": 0, "100": 0 };
      let priceMax = 0;

      // Apply cross-filtering: when computing facets for one dimension,
      // apply filters from OTHER dimensions
      for (const row of data || []) {
        const matchesType = !filters.propertyType || row.property_type === filters.propertyType;
        const matchesListing = !filters.listingType || row.listing_type === filters.listingType;

        // Count property types (filtered by listing type only)
        if (matchesListing) {
          propertyTypes[row.property_type] = (propertyTypes[row.property_type] || 0) + 1;
        }

        // Count listing types (filtered by property type only)
        if (matchesType) {
          listingTypes[row.listing_type] = (listingTypes[row.listing_type] || 0) + 1;
        }

        // For bedrooms/surface/price, apply both filters
        if (matchesType && matchesListing) {
          if (row.bedrooms != null) {
            for (const threshold of [1, 2, 3, 4]) {
              if (row.bedrooms >= threshold) {
                bedroomCounts[String(threshold)] = (bedroomCounts[String(threshold)] || 0) + 1;
              }
            }
          }
          if (row.surface_area != null) {
            for (const threshold of [25, 50, 75, 100]) {
              if (row.surface_area >= threshold) {
                surfaceRanges[String(threshold)] = (surfaceRanges[String(threshold)] || 0) + 1;
              }
            }
          }
          if (row.price > priceMax) priceMax = row.price;
        }
      }

      return { propertyTypes, listingTypes, bedroomCounts, surfaceRanges, priceMax } as FilterFacets;
    },
    staleTime: 30 * 1000,
  });
};
