import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Trash2, Eye, EyeOff, Loader2, MessageSquare, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const AdminComments = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin-comments", filter],
    queryFn: async () => {
      let query = supabase
        .from("property_comments")
        .select("*, properties:property_id(title, slug, id, city)")
        .order("created_at", { ascending: false });

      if (filter === "pending") query = query.eq("is_approved", false);
      if (filter === "approved") query = query.eq("is_approved", true);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("property_comments")
        .update({ is_approved: approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Reactie bijgewerkt");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("property_comments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Reactie verwijderd");
    },
  });

  const pendingCount = comments.filter((c: any) => !c.is_approved).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reacties</h1>
            <p className="text-sm text-muted-foreground">
              Beheer reacties op woningen
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingCount} wachtend</Badge>
              )}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Alle" : f === "pending" ? "Wachtend" : "Goedgekeurd"}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Geen reacties</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Er zijn nog geen reacties geplaatst.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment: any) => (
              <div
                key={comment.id}
                className="rounded-xl border bg-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{comment.name}</span>
                      <span className="text-xs text-muted-foreground">{comment.email}</span>
                      <Badge variant={comment.is_approved ? "default" : "secondary"}>
                        {comment.is_approved ? "Goedgekeurd" : "Wachtend"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                      {comment.properties && (
                        <>
                          {" · "}
                          <a
                            href={`/woning/${comment.properties.slug || comment.properties.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {comment.properties.title}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => approveMutation.mutate({ id: comment.id, approved: !comment.is_approved })}
                      title={comment.is_approved ? "Verbergen" : "Goedkeuren"}
                    >
                      {comment.is_approved ? <EyeOff className="h-4 w-4" /> : <Check className="h-4 w-4 text-green-600" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Weet je zeker dat je deze reactie wilt verwijderen?")) {
                          deleteMutation.mutate(comment.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminComments;
