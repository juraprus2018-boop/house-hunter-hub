import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
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

export const useAllProperties = () => {
  return useQuery({
    queryKey: ["all-properties"],
    queryFn: async () => {
      const pageSize = 1000;
      let from = 0;
      const allProperties: Database["public"]["Tables"]["properties"]["Row"][] = [];

      while (true) {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allProperties.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }

      return allProperties;
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

export const useDailyAlertSubscribers = () => {
  return useQuery({
    queryKey: ["daily-alert-subscribers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("daily_alert_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
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

// Daisycon hooks
export const useDaisyconStatus = () => {
  return useQuery({
    queryKey: ["daisycon-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("daisycon-auth", {
        body: { action: "status" },
      });
      if (error) throw error;
      return data as { connected: boolean; expires_at?: string; last_refreshed?: string };
    },
  });
};

export const useDaisyconFeeds = () => {
  return useQuery({
    queryKey: ["daisycon-feeds"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("daisycon_feeds")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useAddDaisyconFeed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (feed: { name: string; program_id: number; media_id: number; feed_url?: string }) => {
      const { data, error } = await (supabase as any)
        .from("daisycon_feeds")
        .insert(feed)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daisycon-feeds"] });
    },
  });
};

export const useToggleDaisyconFeed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("daisycon_feeds")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daisycon-feeds"] });
    },
  });
};

export const useDeleteDaisyconFeed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("daisycon_feeds")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daisycon-feeds"] });
    },
  });
};

export const useRunDaisyconImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (feedId?: string) => {
      const { data, error } = await supabase.functions.invoke("daisycon-import", {
        body: feedId ? { feed_id: feedId } : {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daisycon-feeds"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["all-properties"] });
    },
  });
};

export const useDaisyconAuth = () => {
  return useMutation({
    mutationFn: async ({ action, code, code_verifier }: { action: string; code?: string; code_verifier?: string }) => {
      const { data, error } = await supabase.functions.invoke("daisycon-auth", {
        body: { action, code, code_verifier },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });
};
