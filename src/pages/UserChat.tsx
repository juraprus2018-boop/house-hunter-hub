import { useState, useRef, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  MessageCircle,
  Send,
  Plus,
  User,
  Shield,
  Circle,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  useUserConversations,
  useChatMessages,
  useSendMessage,
  useCreateConversation,
  useMarkConversationRead,
  useChatRealtime,
} from "@/hooks/useChat";
import { cn } from "@/lib/utils";

const UserChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useUserConversations();
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const { data: messages } = useChatMessages(selectedConvoId);
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  const markRead = useMarkConversationRead();
  const [newMessage, setNewMessage] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newFirstMessage, setNewFirstMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useChatRealtime(selectedConvoId);

  useEffect(() => {
    if (!user) navigate("/inloggen");
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedConvoId) {
      markRead.mutate({ conversationId: selectedConvoId, isAdmin: false });
    }
  }, [selectedConvoId]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvoId || !user) return;
    sendMessage.mutate({
      conversationId: selectedConvoId,
      senderId: user.id,
      content: newMessage.trim(),
      isAdmin: false,
    });
    setNewMessage("");
  };

  const handleCreateConversation = () => {
    if (!newSubject.trim() || !newFirstMessage.trim() || !user) return;
    createConversation.mutate(
      {
        userId: user.id,
        subject: newSubject.trim(),
        firstMessage: newFirstMessage.trim(),
      },
      {
        onSuccess: (convo) => {
          setNewDialogOpen(false);
          setNewSubject("");
          setNewFirstMessage("");
          setSelectedConvoId(convo.id);
        },
      }
    );
  };

  if (!user) return null;

  const selectedConvo = conversations?.find((c) => c.id === selectedConvoId);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title="Berichten – WoonPeek" description="Stuur ons een bericht" />
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold">Mijn berichten</h1>
          </div>
          <Button onClick={() => setNewDialogOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nieuw gesprek
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[300px_1fr] h-[calc(100vh-260px)] min-h-[400px]">
            {/* Conversations */}
            <Card className="overflow-hidden">
              <CardHeader className="p-3 border-b">
                <CardTitle className="text-sm">Gesprekken</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[calc(100%-52px)]">
                {conversations?.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p>Nog geen gesprekken</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setNewDialogOpen(true)}
                    >
                      Start een gesprek
                    </Button>
                  </div>
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
                          {convo.user_unread_count > 0 && (
                            <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm truncate">
                            {convo.subject || "Gesprek"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(convo.last_message_at), "d MMM", { locale: nl })}
                      </span>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </Card>

            {/* Messages */}
            <Card className="flex flex-col overflow-hidden">
              {selectedConvo ? (
                <>
                  <CardHeader className="p-3 border-b flex-shrink-0">
                    <CardTitle className="text-sm">{selectedConvo.subject || "Gesprek"}</CardTitle>
                  </CardHeader>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages?.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn("flex", isMe ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                                isMe
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              )}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {isMe ? (
                                  <User className="h-3 w-3" />
                                ) : (
                                  <Shield className="h-3 w-3" />
                                )}
                                <span className="text-[10px] opacity-70">
                                  {!isMe && "WoonPeek · "}
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
                    <p>Selecteer een gesprek of start een nieuw gesprek</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
      <Footer />

      {/* New conversation dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw gesprek starten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Onderwerp</Label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Waar gaat je vraag over?"
              />
            </div>
            <div className="space-y-2">
              <Label>Bericht</Label>
              <Textarea
                value={newFirstMessage}
                onChange={(e) => setNewFirstMessage(e.target.value)}
                placeholder="Stel je vraag..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateConversation}
              disabled={
                !newSubject.trim() ||
                !newFirstMessage.trim() ||
                createConversation.isPending
              }
            >
              {createConversation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verstuur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserChat;
