import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, BellRing, Users, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const useAlertSubscribers = () => {
  return useQuery({
    queryKey: ["admin-alert-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_alert_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return format(new Date(date), "d MMM yyyy HH:mm", { locale: nl });
};

const AdminAlertSubscribers = () => {
  const { data: subscribers, isLoading } = useAlertSubscribers();

  const totalCount = subscribers?.length || 0;
  const activeCount = subscribers?.filter((s) => s.is_active).length || 0;
  const inactiveCount = totalCount - activeCount;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BellRing className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Alert Abonnees</h1>
          {subscribers && <Badge variant="secondary">{totalCount}</Badge>}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Totaal</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Actief</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <UserX className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{inactiveCount}</p>
                <p className="text-xs text-muted-foreground">Inactief</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Stad</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bron</TableHead>
                  <TableHead>Ingeschreven</TableHead>
                  <TableHead>Laatst genotificeerd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers?.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell>{sub.city || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={sub.is_active ? "default" : "secondary"}>
                        {sub.is_active ? "Actief" : "Inactief"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sub.source || "guest"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(sub.subscribed_at)}</TableCell>
                    <TableCell className="text-sm">{formatDate(sub.last_notified_at)}</TableCell>
                  </TableRow>
                ))}
                {(!subscribers || subscribers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Geen abonnees gevonden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAlertSubscribers;
