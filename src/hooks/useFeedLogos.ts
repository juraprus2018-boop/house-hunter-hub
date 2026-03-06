import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFeedLogos = () => {
  return useQuery({
    queryKey: ["feed-logos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("daisycon_feeds")
        .select("name, logo_url")
        .not("logo_url", "is", null);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as any[])?.forEach((f) => {
        if (f.logo_url) {
          map[f.name.toLowerCase()] = f.logo_url;
        }
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });
};
