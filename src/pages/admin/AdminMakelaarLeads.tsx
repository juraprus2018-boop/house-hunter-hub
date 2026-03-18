import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Mail, Phone, Globe, Link2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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

const AdminMakelaarLeads = () => {
  const { data: leads, isLoading } = useMakelaarLeads();

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
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
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
              <p className="text-xs font-medium text-muted-foreground">Afgehandeld</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{totalLeads - newLeads}</p>
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
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">{lead.kantoornaam}</h3>
                        <Badge className={statusColors[lead.status] || ""}>{lead.status}</Badge>
                      </div>

                      <div className="grid gap-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{lead.contactpersoon}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                        </div>
                        {lead.telefoon && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            <a href={`tel:${lead.telefoon}`} className="hover:underline">{lead.telefoon}</a>
                          </div>
                        )}
                        {lead.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5" />
                            <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{lead.website}</a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className="text-xs">
                          <Link2 className="mr-1 h-3 w-3" />
                          {lead.koppeling_type?.toUpperCase()}
                        </Badge>
                        {lead.crm_software && (
                          <Badge variant="secondary" className="text-xs">CRM: {lead.crm_software}</Badge>
                        )}
                        {lead.feed_url && (
                          <Badge variant="secondary" className="text-xs truncate max-w-[200px]">Feed: {lead.feed_url}</Badge>
                        )}
                      </div>

                      {lead.opmerking && (
                        <div className="flex items-start gap-2 rounded-md bg-muted p-2 text-sm">
                          <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                          <span>{lead.opmerking}</span>
                        </div>
                      )}
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
    </AdminLayout>
  );
};

export default AdminMakelaarLeads;
