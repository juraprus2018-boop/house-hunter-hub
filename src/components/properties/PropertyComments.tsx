import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface PropertyCommentsProps {
  propertyId: string;
}

const usePropertyComments = (propertyId: string) => {
  return useQuery({
    queryKey: ["property-comments", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_comments")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId,
  });
};

const PropertyComments = ({ propertyId }: PropertyCommentsProps) => {
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = usePropertyComments(propertyId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");

  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("property_comments").insert({
        property_id: propertyId,
        name: name.trim().substring(0, 100),
        email: email.trim().substring(0, 255),
        content: content.trim().substring(0, 2000),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-comments", propertyId] });
      setName("");
      setEmail("");
      setContent("");
      toast({ title: "Reactie geplaatst!" });
    },
    onError: () => {
      toast({ title: "Er ging iets mis", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !content.trim()) {
      toast({ title: "Vul alle velden in", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({ title: "Vul een geldig e-mailadres in", variant: "destructive" });
      return;
    }
    addComment.mutate();
  };

  return (
    <section className="border-t py-12 lg:py-16">
      <div className="container max-w-3xl">
        <div className="flex items-center gap-2 mb-8">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-bold">
            Reacties {comments && comments.length > 0 && `(${comments.length})`}
          </h2>
        </div>

        {/* Comment form */}
        <form onSubmit={handleSubmit} className="mb-10 rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Laat een reactie achter</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="comment-name">Naam *</Label>
              <Input
                id="comment-name"
                placeholder="Je naam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment-email">E-mail *</Label>
              <Input
                id="comment-email"
                type="email"
                placeholder="je@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment-content">Reactie *</Label>
            <Textarea
              id="comment-content"
              placeholder="Schrijf je reactie..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              rows={4}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Je e-mailadres wordt niet publiek getoond.
          </p>
          <Button type="submit" disabled={addComment.isPending} className="gap-2">
            <Send className="h-4 w-4" />
            {addComment.isPending ? "Plaatsen..." : "Reactie plaatsen"}
          </Button>
        </form>

        {/* Comments list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border bg-card p-5">
                <div className="h-4 w-32 rounded bg-muted mb-3" />
                <div className="h-3 w-full rounded bg-muted mb-2" />
                <div className="h-3 w-3/4 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{comment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: nl })}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">
            Nog geen reacties. Wees de eerste!
          </p>
        )}
      </div>
    </section>
  );
};

export default PropertyComments;
