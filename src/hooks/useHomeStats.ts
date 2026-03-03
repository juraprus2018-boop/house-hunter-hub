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
      const [propertiesRes, usersRes] = await Promise.all([
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", "actief"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      if (propertiesRes.error) throw propertiesRes.error;
      if (usersRes.error) throw usersRes.error;

      const { data: citiesData, error: distinctCitiesError } = await supabase
        .from("properties")
        .select("city")
        .eq("status", "actief")
        .not("city", "is", null);

      if (distinctCitiesError) throw distinctCitiesError;

      const uniqueCities = new Set(
        (citiesData ?? [])
          .map((row) => row.city?.trim())
          .filter((city): city is string => Boolean(city))
      );

      return {
        properties_count: propertiesRes.count ?? 0,
        users_count: usersRes.count ?? 0,
        cities_count: uniqueCities.size,
      } as HomeStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
