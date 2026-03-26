import { useState, useRef, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  MessageCircle,
  Send,
  User,
  Shield,
  Circle,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdminConversations,
  useChatMessages,
  useSendMessage,
  useMarkConversationRead,
  useChatRealtime,
  type Conversation,
} from "@/hooks/useChat";
import { cn } from "@/lib/utils";

const AdminChat = () => {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useAdminConversations();
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const { data: messages } = useChatMessages(selectedConvoId);
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useChatRealtime(selectedConvoId);

  const selectedConvo = conversations?.find((c) => c.id === selectedConvoId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedConvoId) {
      markRead.mutate({ conversationId: selectedConvoId, isAdmin: true });
    }
  }, [selectedConvoId]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvoId || !user) return;
    sendMessage.mutate({
      conversationId: selectedConvoId,
      senderId: user.id,
      content: newMessage.trim(),
      isAdmin: true,
    });
    setNewMessage("");
  };

  const totalUnread = conversations?.reduce((sum, c) => sum + (c.admin_unread_count || 0), 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Berichten</h1>
          {totalUnread > 0 && (
            <Badge variant="destructive">{totalUnread} ongelezen</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr] h-[calc(100vh-220px)]">
            {/* Conversation list */}
            <Card className="overflow-hidden">
              <CardHeader className="p-3 border-b">
                <CardTitle className="text-sm">Gesprekken ({conversations?.length || 0})</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[calc(100%-52px)]">
                {conversations?.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    Nog geen gesprekken
                  </p>
                )}
                {conversations?.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvoId(convo.id)}
                    className={cn(
                      "w-full text-left p-3 border-b hover:bg-muted/50 transition-colors",
                      selectedConvoId === convo.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {convo.admin_unread_count > 0 && (
                            <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm truncate">
                            {convo.profile?.display_name || "Gebruiker"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {convo.subject || "Geen onderwerp"}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(convo.last_message_at), "d MMM HH:mm", { locale: nl })}
                      </span>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </Card>

            {/* Chat area */}
            <Card className="flex flex-col overflow-hidden">
              {selectedConvo ? (
                <>
                  <CardHeader className="p-3 border-b flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">
                        {selectedConvo.profile?.display_name}
                      </CardTitle>
                      {selectedConvo.subject && (
                        <span className="text-xs text-muted-foreground">
                          — {selectedConvo.subject}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages?.map((msg) => {
                        const isAdminMsg = msg.sender_id !== selectedConvo.user_id;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              isAdminMsg ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                                isAdminMsg
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              )}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {isAdminMsg ? (
                                  <Shield className="h-3 w-3" />
                                ) : (
                                  <User className="h-3 w-3" />
                                )}
                                <span className="text-[10px] opacity-70">
                                  {format(new Date(msg.created_at), "HH:mm")}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-3 border-t flex-shrink-0">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Typ een bericht..."
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim() || sendMessage.isPending}
                      >
                        {sendMessage.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p>Selecteer een gesprek om berichten te bekijken</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminChat;
