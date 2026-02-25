import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type SearchAlert = Database["public"]["Tables"]["search_alerts"]["Row"];
type SearchAlertInsert = Database["public"]["Tables"]["search_alerts"]["Insert"];

export const useSearchAlerts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["search-alerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SearchAlert[];
    },
    enabled: !!user,
  });
};

export const useCreateSearchAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: SearchAlertInsert) => {
      const { data, error } = await supabase
        .from("search_alerts")
        .insert(alert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-alerts"] });
    },
  });
};

export const useToggleSearchAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("search_alerts")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-alerts"] });
    },
  });
};

export const useDeleteSearchAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("search_alerts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-alerts"] });
    },
  });
};
