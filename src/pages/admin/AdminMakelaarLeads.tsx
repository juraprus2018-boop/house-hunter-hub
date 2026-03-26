import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Building2,
  Mail,
  Phone,
  Globe,
  Link2,
  MessageSquare,
  Rss,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

const useMakelaarLeads = () => {
  return useQuery({
    queryKey: ["makelaar-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("makelaar_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
};

const statusColors: Record<string, string> = {
  nieuw: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  actief: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  afgewezen: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusOptions = ["nieuw", "contacted", "actief", "afgewezen"];

const AdminMakelaarLeads = () => {
  const { data: leads, isLoading } = useMakelaarLeads();
  const queryClient = useQueryClient();
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [feedUrl, setFeedUrl] = useState("");
  const [sourceName, setSourceName] = useState("");

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("makelaar_leads")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["makelaar-leads"] });
      toast.success("Status bijgewerkt");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const activateFeedMutation = useMutation({
    mutationFn: async ({
      lead,
      feedUrl,
      sourceName,
    }: {
      lead: any;
      feedUrl: string;
      sourceName: string;
    }) => {
      // 1. Create scraper entry
      const { error: scraperError } = await supabase.from("scrapers").insert({
        name: sourceName || lead.kantoornaam,
        website_url: lead.website || feedUrl,
        description: `makelaar-feed | ${lead.kantoornaam}`,
        is_active: true,
        config: {
          feed_url: feedUrl,
          source_name: sourceName || lead.kantoornaam,
          lead_id: lead.id,
        },
        schedule_interval: "daily",
      });
      if (scraperError) throw scraperError;

      // 2. Update lead status to actief
      const { error: leadError } = await (supabase as any)
        .from("makelaar_leads")
        .update({ status: "actief", feed_url: feedUrl })
        .eq("id", lead.id);
      if (leadError) throw leadError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["makelaar-leads"] });
      setActivateDialogOpen(false);
      setFeedUrl("");
      setSourceName("");
      toast.success("Feed geactiveerd! De woningen worden dagelijks automatisch geïmporteerd.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const testFeedMutation = useMutation({
    mutationFn: async (url: string) => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/makelaar-feed-import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ feed_url: url }),
        }
      );
      if (!resp.ok) throw new Error(await resp.text());
      return resp.json();
    },
    onSuccess: (data) => {
      toast.success(
        `Feed test: ${data.imported} geïmporteerd, ${data.skipped} overgeslagen, ${data.errors} fouten`
      );
    },
    onError: (err: any) => toast.error(`Feed test mislukt: ${err.message}`),
  });

  const openActivateDialog = (lead: any) => {
    setSelectedLead(lead);
    setFeedUrl(lead.feed_url || "");
    setSourceName(lead.kantoornaam || "");
    setActivateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter((l: any) => l.status === "nieuw").length || 0;
  const activeLeads = leads?.filter((l: any) => l.status === "actief").length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Makelaar Leads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aanmeldingen van makelaars die hun aanbod willen koppelen
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Totaal</p>
              <p className="mt-1 text-2xl font-bold">{totalLeads}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Nieuw</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{newLeads}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Actieve feeds</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{activeLeads}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Afgehandeld</p>
              <p className="mt-1 text-2xl font-bold text-muted-foreground">
                {totalLeads - newLeads}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leads list */}
        {leads && leads.length > 0 ? (
          <div className="space-y-3">
            {leads.map((lead: any) => (
              <Card key={lead.id}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">{lead.kantoornaam}</h3>

                        {/* Status dropdown */}
                        <Select
                          value={lead.status}
                          onValueChange={(val) =>
                            updateStatusMutation.mutate({ id: lead.id, status: val })
                          }
                        >
                          <SelectTrigger className="h-7 w-auto min-w-[100px]">
                            <Badge className={statusColors[lead.status] || ""}>
                              {lead.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {lead.contactpersoon}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-primary hover:underline"
                          >
                            {lead.email}
                          </a>
                        </div>
                        {lead.telefoon && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            <a href={`tel:${lead.telefoon}`} className="hover:underline">
                              {lead.telefoon}
                            </a>
                          </div>
                        )}
                        {lead.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5" />
                            <a
                              href={
                                lead.website.startsWith("http")
                                  ? lead.website
                                  : `https://${lead.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {lead.website}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className="text-xs">
                          <Link2 className="mr-1 h-3 w-3" />
                          {lead.koppeling_type?.toUpperCase()}
                        </Badge>
                        {lead.crm_software && (
                          <Badge variant="secondary" className="text-xs">
                            CRM: {lead.crm_software}
                          </Badge>
                        )}
                        {lead.feed_url && (
                          <Badge variant="secondary" className="text-xs truncate max-w-[200px]">
                            Feed: {lead.feed_url}
                          </Badge>
                        )}
                      </div>

                      {lead.opmerking && (
                        <div className="flex items-start gap-2 rounded-md bg-muted p-2 text-sm">
                          <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                          <span>{lead.opmerking}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {lead.status !== "actief" && (
                          <Button
                            size="sm"
                            onClick={() => openActivateDialog(lead)}
                            className="gap-1.5"
                          >
                            <Rss className="h-3.5 w-3.5" />
                            Activeer als feed
                          </Button>
                        )}
                        {lead.status === "actief" && (
                          <Badge
                            variant="outline"
                            className="gap-1.5 border-green-300 text-green-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Feed actief
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(lead.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nog geen aanmeldingen van makelaars.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activate Feed Dialog */}
      <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feed activeren — {selectedLead?.kantoornaam}</DialogTitle>
            <DialogDescription>
              Voer de XML-feed URL in van deze makelaar. De woningen worden dagelijks automatisch
              geïmporteerd.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sourceName">Bronnaam (wordt getoond bij woningen)</Label>
              <Input
                id="sourceName"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="bijv. Makelaarskantoor De Vries"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedUrl">XML Feed URL</Label>
              <Input
                id="feedUrl"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://feeds.pararius.com/..."
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => feedUrl && testFeedMutation.mutate(feedUrl)}
              disabled={!feedUrl || testFeedMutation.isPending}
            >
              {testFeedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test feed
            </Button>
            <Button
              onClick={() =>
                selectedLead &&
                feedUrl &&
                activateFeedMutation.mutate({
                  lead: selectedLead,
                  feedUrl,
                  sourceName,
                })
              }
              disabled={!feedUrl || activateFeedMutation.isPending}
            >
              {activateFeedMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Activeer & importeer dagelijks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMakelaarLeads;
