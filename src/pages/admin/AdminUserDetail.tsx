import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Loader2,
  User,
  Home,
  MessageSquare,
  Calendar,
  Clock,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const fmt = (date: string | null) => {
  if (!date) return "—";
  return format(new Date(date), "d MMM yyyy HH:mm", { locale: nl });
};

const useUserDetail = (userId: string) => {
  return useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      // Profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;

      // Roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      // Properties
      const { data: properties } = await supabase
        .from("properties")
        .select("id, title, city, price, status, listing_type, created_at, slug")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Comments
      const { data: comments } = await supabase
        .from("property_comments")
        .select("id, content, name, created_at, is_approved, property_id")
        .order("created_at", { ascending: false });

      // Favorites count
      const { count: favCount } = await supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      // Search alerts
      const { data: alerts } = await supabase
        .from("search_alerts")
        .select("id, name, city, listing_type, is_active, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Conversations
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id, subject, created_at, is_closed, last_message_at")
        .eq("user_id", userId)
        .order("last_message_at", { ascending: false });

      return {
        profile,
        roles: roles?.map((r) => r.role) || [],
        properties: properties || [],
        comments: comments || [],
        favoritesCount: favCount || 0,
        alerts: alerts || [],
        conversations: conversations || [],
      };
    },
    enabled: !!userId,
  });
};

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useUserDetail(userId || "");

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!data?.profile) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground">
          Gebruiker niet gevonden
        </div>
      </AdminLayout>
    );
  }

  const { profile, roles, properties, comments, favoritesCount, alerts, conversations } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/gebruikers")} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">{profile.display_name || "Naamloos"}</h1>
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.length > 0 ? roles.map((r) => (
                  <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-xs">{r}</Badge>
                )) : <Badge variant="outline" className="text-xs">user</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Calendar className="h-3.5 w-3.5" /> Geregistreerd
              </div>
              <p className="font-semibold text-sm">{fmt(profile.created_at)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" /> Laatste login
              </div>
              <p className="font-semibold text-sm">{fmt(profile.last_login_at)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Home className="h-3.5 w-3.5" /> Woningen
              </div>
              <p className="font-semibold text-sm">{properties.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Phone className="h-3.5 w-3.5" /> Telefoon
              </div>
              <p className="font-semibold text-sm">{profile.phone || "—"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Extra stats */}
        <div className="grid gap-3 grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{favoritesCount}</p>
              <p className="text-xs text-muted-foreground">Favorieten</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{alerts.length}</p>
              <p className="text-xs text-muted-foreground">Zoekalerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{conversations.length}</p>
              <p className="text-xs text-muted-foreground">Gesprekken</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties */}
        {properties.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-4 w-4" /> Geplaatste woningen ({properties.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead className="hidden sm:table-cell">Stad</TableHead>
                      <TableHead>Prijs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/woning/${p.slug || p.id}`)}
                      >
                        <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                        <TableCell className="hidden sm:table-cell">{p.city}</TableCell>
                        <TableCell>€{p.price?.toLocaleString("nl-NL")}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "actief" ? "default" : "secondary"} className="text-xs">
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{fmt(p.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversations */}
        {conversations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Gesprekken ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Onderwerp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Laatste bericht</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.subject || "Geen onderwerp"}</TableCell>
                        <TableCell>
                          <Badge variant={c.is_closed ? "secondary" : "default"} className="text-xs">
                            {c.is_closed ? "Gesloten" : "Open"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{fmt(c.last_message_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search alerts */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Zoekalerts ({alerts.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Stad</TableHead>
                      <TableHead>Actief</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.city || "Alle"}</TableCell>
                        <TableCell>
                          <Badge variant={a.is_active ? "default" : "secondary"} className="text-xs">
                            {a.is_active ? "Ja" : "Nee"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;
