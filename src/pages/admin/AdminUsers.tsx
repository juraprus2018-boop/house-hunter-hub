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
import { Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get all user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // Get property counts per user
      const { data: propertyCounts } = await supabase
        .from("properties")
        .select("user_id");

      const propertyCountMap: Record<string, number> = {};
      propertyCounts?.forEach((p) => {
        propertyCountMap[p.user_id] = (propertyCountMap[p.user_id] || 0) + 1;
      });

      const roleMap: Record<string, string[]> = {};
      roles?.forEach((r) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });

      return (profiles || []).map((profile) => ({
        ...profile,
        roles: roleMap[profile.user_id] || [],
        property_count: propertyCountMap[profile.user_id] || 0,
      }));
    },
  });
};

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return format(new Date(date), "d MMM yyyy HH:mm", { locale: nl });
};

const AdminUsers = () => {
  const { data: users, isLoading } = useAdminUsers();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Gebruikers</h1>
          {users && (
            <Badge variant="secondary">{users.length}</Badge>
          )}
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
                  <TableHead>Naam</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Woningen</TableHead>
                  <TableHead>Geregistreerd</TableHead>
                  <TableHead>Laatst ingelogd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.display_name || "—"}</p>
                        {user.phone && (
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant={role === "admin" ? "default" : "secondary"}
                            className="mr-1"
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">user</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.property_count}</TableCell>
                    <TableCell className="text-sm">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate((user as any).last_login_at)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!users || users.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Geen gebruikers gevonden
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

export default AdminUsers;
