import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HomeStats {
  properties_count: number;
  users_count: number;
  cities_count: number;
}

export const useHomeStats = () => {
  return useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_home_stats");
      if (error) throw error;
      return data as unknown as HomeStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
