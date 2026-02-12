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
}

export const useProperties = (filters?: PropertyFilters) => {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*")
        .eq("status", "actief")
        .order("created_at", { ascending: false });

      if (filters?.city) {
        query = query.ilike("city", `%${filters.city}%`);
      }
      if (filters?.propertyType) {
        query = query.eq("property_type", filters.propertyType);
      }
      if (filters?.listingType) {
        query = query.eq("listing_type", filters.listingType);
      }
      if (filters?.minPrice) {
        query = query.gte("price", filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte("price", filters.maxPrice);
      }
      if (filters?.minSurface) {
        query = query.gte("surface_area", filters.minSurface);
      }
      if (filters?.minBedrooms) {
        query = query.gte("bedrooms", filters.minBedrooms);
      }
      if (filters?.sourceSite) {
        query = query.eq("source_site", filters.sourceSite);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Property[];
    },
  });
};

export const useProperty = (id: string) => {
  return useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Property | null;
    },
    enabled: !!id,
  });
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
        .order("views_count", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Property[];
    },
  });
};
