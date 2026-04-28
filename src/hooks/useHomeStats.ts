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
      const stats = data as unknown as HomeStats;
      return {
        properties_count: stats.properties_count ?? 0,
        users_count: stats.users_count ?? 0,
        cities_count: stats.cities_count ?? 0,
      } as HomeStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
