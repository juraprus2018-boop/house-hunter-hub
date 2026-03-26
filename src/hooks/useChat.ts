import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface Conversation {
  id: string;
  user_id: string;
  admin_id: string | null;
  subject: string | null;
  last_message_at: string;
  user_unread_count: number;
  admin_unread_count: number;
  is_closed: boolean;
  created_at: string;
  profile?: { display_name: string | null };
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Hook for admin: get all conversations with user profiles
export const useAdminConversations = () => {
  return useQuery({
    queryKey: ["admin-conversations"],
    queryFn: async () => {
      const { data: convos, error } = await (supabase as any)
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for user_ids
      const userIds = [...new Set((convos || []).map((c: any) => c.user_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        profileMap[p.user_id] = p.display_name || "Gebruiker";
      });

      return (convos || []).map((c: any) => ({
        ...c,
        profile: { display_name: profileMap[c.user_id] || "Gebruiker" },
      })) as Conversation[];
    },
  });
};

// Hook for user: get their conversations
export const useUserConversations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Conversation[];
    },
    enabled: !!user,
  });
};

// Hook: get messages for a conversation
export const useChatMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ["chat-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await (supabase as any)
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ChatMessage[];
    },
    enabled: !!conversationId,
  });
};

// Hook: send a message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      senderId,
      content,
      isAdmin,
    }: {
      conversationId: string;
      senderId: string;
      content: string;
      isAdmin: boolean;
    }) => {
      const { error: msgError } = await (supabase as any)
        .from("chat_messages")
        .insert({ conversation_id: conversationId, sender_id: senderId, content });
      if (msgError) throw msgError;

      // Update conversation
      const updateData: any = { last_message_at: new Date().toISOString() };
      if (isAdmin) {
        // Admin sends → increment user_unread
        updateData.user_unread_count = (supabase as any).rpc ? undefined : undefined;
      }
      // Use raw SQL increment via rpc would be ideal, but let's do a simple update
      const { data: conv } = await (supabase as any)
        .from("conversations")
        .select("user_unread_count, admin_unread_count")
        .eq("id", conversationId)
        .single();

      if (conv) {
        if (isAdmin) {
          updateData.user_unread_count = (conv.user_unread_count || 0) + 1;
          updateData.admin_unread_count = 0;
        } else {
          updateData.admin_unread_count = (conv.admin_unread_count || 0) + 1;
          updateData.user_unread_count = 0;
        }
      }

      await (supabase as any)
        .from("conversations")
        .update(updateData)
        .eq("id", conversationId);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["user-conversations"] });
    },
  });
};

// Hook: create a new conversation (user side)
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      subject,
      firstMessage,
    }: {
      userId: string;
      subject: string;
      firstMessage: string;
    }) => {
      const { data: convo, error: convoError } = await (supabase as any)
        .from("conversations")
        .insert({
          user_id: userId,
          subject,
          admin_unread_count: 1,
        })
        .select()
        .single();
      if (convoError) throw convoError;

      const { error: msgError } = await (supabase as any)
        .from("chat_messages")
        .insert({
          conversation_id: convo.id,
          sender_id: userId,
          content: firstMessage,
        });
      if (msgError) throw msgError;

      return convo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
    },
  });
};

// Hook: mark conversation as read
export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      isAdmin,
    }: {
      conversationId: string;
      isAdmin: boolean;
    }) => {
      const updateData = isAdmin
        ? { admin_unread_count: 0 }
        : { user_unread_count: 0 };

      await (supabase as any)
        .from("conversations")
        .update(updateData)
        .eq("id", conversationId);

      // Mark messages as read
      await (supabase as any)
        .from("chat_messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["user-conversations"] });
    },
  });
};

// Hook: get total unread count for user
export const useUserUnreadCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-unread-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await (supabase as any)
        .from("conversations")
        .select("user_unread_count")
        .eq("user_id", user.id);
      if (error) return 0;
      return (data || []).reduce((sum: number, c: any) => sum + (c.user_unread_count || 0), 0);
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30s
  });
};

// Hook: realtime subscription for new messages
export const useChatRealtime = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
          queryClient.invalidateQueries({ queryKey: ["user-conversations"] });
          queryClient.invalidateQueries({ queryKey: ["user-unread-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
};
