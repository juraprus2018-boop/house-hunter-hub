import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      return data === true;
    },
    enabled: !!user,
  });
};

export const useScrapers = () => {
  return useQuery({
    queryKey: ["scrapers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scrapers")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
};

export const useToggleScraper = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("scrapers")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrapers"] });
    },
  });
};

export const useUpdateScraperSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      schedule_interval,
      schedule_days,
    }: {
      id: string;
      schedule_interval: string;
      schedule_days: number[] | null;
    }) => {
      const { data, error } = await supabase
        .from("scrapers")
        .update({ schedule_interval, schedule_days })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrapers"] });
    },
  });
};

export const useScraperLogs = (scraperId?: string) => {
  return useQuery({
    queryKey: ["scraper-logs", scraperId],
    queryFn: async () => {
      let query = supabase
        .from("scraper_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (scraperId) {
        query = query.eq("scraper_id", scraperId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!scraperId || true,
  });
};

export const useAllProperties = () => {
  return useQuery({
    queryKey: ["all-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdatePropertyAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};

export const useDeletePropertyAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};

export const useRunScraper = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scraperId: string) => {
      const { data, error } = await supabase.functions.invoke("run-scraper", {
        body: { scraper_id: scraperId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scrapers"] });
      queryClient.invalidateQueries({ queryKey: ["scraper-logs"] });
      queryClient.invalidateQueries({ queryKey: ["scraped-properties"] });
    },
  });
};

export const useScrapedProperties = (status?: string) => {
  return useQuery({
    queryKey: ["scraped-properties", status],
    queryFn: async () => {
      let query = supabase
        .from("scraped_properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const usePostToFacebook = () => {
  return useMutation({
    mutationFn: async (propertyId: string) => {
      const { data, error } = await supabase.functions.invoke("post-to-facebook", {
        body: { property_id: propertyId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });
};

export const useUpdateScrapedProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; reviewed_at?: string; reviewed_by?: string }) => {
      const { data, error } = await supabase
        .from("scraped_properties")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scraped-properties"] });
    },
  });
};
