import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useFavorites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          property_id,
          created_at,
          properties (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useFavoriteIds = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorite-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select("property_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((f) => f.property_id);
    },
    enabled: !!user,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error("Je moet ingelogd zijn");

      const { data, error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, property_id: propertyId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-ids"] });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error("Je moet ingelogd zijn");

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-ids"] });
    },
  });
};

export const useToggleFavorite = () => {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { data: favoriteIds = [] } = useFavoriteIds();

  return {
    toggle: (propertyId: string) => {
      if (favoriteIds.includes(propertyId)) {
        return removeFavorite.mutate(propertyId);
      } else {
        return addFavorite.mutate(propertyId);
      }
    },
    isFavorite: (propertyId: string) => favoriteIds.includes(propertyId),
    isLoading: addFavorite.isPending || removeFavorite.isPending,
  };
};
