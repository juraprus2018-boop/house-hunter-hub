import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdSlotKey = "homepage" | "city_page" | "search_page" | "property_detail";

export const useAdSlot = (slotKey: AdSlotKey) => {
  return useQuery({
    queryKey: ["ad-slot", slotKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_slots")
        .select("ad_code, is_active")
        .eq("slot_key", slotKey)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
};
