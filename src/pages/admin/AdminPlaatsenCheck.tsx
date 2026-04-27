import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  RefreshCw,
  MapPinned,
  EyeOff,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface MissingLogRow {
  id: string;
  run_at: string;
  triggered_by: string;
  total_unique_cities: number;
  missing_count: number;
  added_count: number;
  missing_cities: { name: string; count: number }[];
  added_cities: { name: string; count: number }[];
}

interface ExtraCityRow {
  id: string;
  name: string;
  source: string;
  property_count: number;
  is_visible: boolean;
  created_at: string;
}

const AdminPlaatsenCheck = () => {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);

  const extraCitiesQuery = useQuery({
    queryKey: ["admin-extra-cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extra_cities")
        .select("*")
        .order("property_count", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExtraCityRow[];
    },
  });

  const logsQuery = useQuery({
    queryKey: ["admin-missing-cities-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missing_cities_log")
        .select("*")
        .order("run_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as MissingLogRow[];
    },
  });

  const lastRun = logsQuery.data?.[0];

  const handleRun = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "sync-missing-cities",
        { body: { triggered_by: "manual", auto_add: true } },
      );
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? "Onbekende fout");
      toast.success(
        `${data.missing_count} ontbrekende plaatsen gevonden, ${data.added_count} toegevoegd`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-extra-cities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-missing-cities-log"] });
      queryClient.invalidateQueries({ queryKey: ["extra-cities-visible"] });
    } catch (e) {
      toast.error(
        "Sync mislukt: " + (e instanceof Error ? e.message : "onbekend"),
      );
    } finally {
      setRunning(false);
    }
  };

  const toggleVisibility = async (row: ExtraCityRow) => {
    const { error } = await supabase
      .from("extra_cities")
      .update({ is_visible: !row.is_visible })
      .eq("id", row.id);
    if (error) {
      toast.error("Bijwerken mislukt: " + error.message);
      return;
    }
    toast.success(`'${row.name}' ${row.is_visible ? "verborgen" : "zichtbaar"}`);
    queryClient.invalidateQueries({ queryKey: ["admin-extra-cities"] });
    queryClient.invalidateQueries({ queryKey: ["extra-cities-visible"] });
  };

  const deleteRow = async (row: ExtraCityRow) => {
    if (!confirm(`'${row.name}' definitief verwijderen?`)) return;
    const { error } = await supabase
      .from("extra_cities")
      .delete()
      .eq("id", row.id);
    if (error) {
      toast.error("Verwijderen mislukt: " + error.message);
      return;
    }
    toast.success(`'${row.name}' verwijderd`);
    queryClient.invalidateQueries({ queryKey: ["admin-extra-cities"] });
    queryClient.invalidateQueries({ queryKey: ["extra-cities-visible"] });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MapPinned className="h-6 w-6 text-primary" />
              Plaatsen check
            </h1>
            <p className="text-sm text-muted-foreground">
              Vergelijkt unieke plaatsen uit het actieve aanbod met de
              codelijst (DUTCH_CITIES + gemeentes/kernen) en logt ontbrekende
              plaatsen voor controle. Nieuwe plaatsen worden automatisch
              toegevoegd aan de selector.
            </p>
          </div>
          <Button onClick={handleRun} disabled={running} size="lg">
            {running ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Vergelijking starten
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Laatste run</CardDescription>
              <CardTitle className="text-xl">
                {lastRun
                  ? formatDistanceToNow(new Date(lastRun.run_at), {
                      addSuffix: true,
                      locale: nl,
                    })
                  : "Nog niet gedraaid"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {lastRun
                ? `${lastRun.triggered_by} · ${format(
                    new Date(lastRun.run_at),
                    "dd MMM yyyy HH:mm",
                    { locale: nl },
                  )}`
                : "—"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ontbrekend (laatste run)</CardDescription>
              <CardTitle className="text-xl">
                {lastRun?.missing_count ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              op {lastRun?.total_unique_cities ?? 0} unieke plaatsen
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Auto-toegevoegde plaatsen</CardDescription>
              <CardTitle className="text-xl">
                {extraCitiesQuery.data?.length ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              waarvan{" "}
              {extraCitiesQuery.data?.filter((c) => c.is_visible).length ?? 0}{" "}
              zichtbaar in selector
            </CardContent>
          </Card>
        </div>

        {/* Auto-added cities */}
        <Card>
          <CardHeader>
            <CardTitle>Automatisch toegevoegde plaatsen</CardTitle>
            <CardDescription>
              Deze plaatsen werden via de sync ontdekt in het aanbod en
              toegevoegd aan de gemeente-selector. Verberg of verwijder
              plaatsen die niet kloppen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {extraCitiesQuery.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (extraCitiesQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nog geen plaatsen toegevoegd.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plaats</TableHead>
                      <TableHead>Bron</TableHead>
                      <TableHead className="text-right">Woningen</TableHead>
                      <TableHead>Toegevoegd</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extraCitiesQuery.data!.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.source}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {row.property_count}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(row.created_at), "dd MMM yyyy", {
                            locale: nl,
                          })}
                        </TableCell>
                        <TableCell>
                          {row.is_visible ? (
                            <Badge>Zichtbaar</Badge>
                          ) : (
                            <Badge variant="secondary">Verborgen</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleVisibility(row)}
                            >
                              {row.is_visible ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteRow(row)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History log */}
        <Card>
          <CardHeader>
            <CardTitle>Geschiedenis (laatste 20 runs)</CardTitle>
            <CardDescription>
              Per run: hoeveel unieke plaatsen, hoeveel ontbrekend en hoeveel
              automatisch toegevoegd.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsQuery.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (logsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nog geen runs gelogd.
              </p>
            ) : (
              <div className="space-y-3">
                {logsQuery.data!.map((log) => (
                  <details
                    key={log.id}
                    className="rounded-lg border bg-card p-3"
                  >
                    <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                      <span className="font-medium">
                        {format(new Date(log.run_at), "dd MMM yyyy HH:mm", {
                          locale: nl,
                        })}
                      </span>
                      <Badge variant="outline">{log.triggered_by}</Badge>
                      <span className="text-muted-foreground">
                        {log.total_unique_cities} unieke ·{" "}
                        <strong className="text-foreground">
                          {log.missing_count} ontbrekend
                        </strong>{" "}
                        · {log.added_count} toegevoegd
                      </span>
                    </summary>
                    <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <p className="mb-1 font-semibold">
                          Ontbrekende plaatsen
                        </p>
                        {log.missing_cities.length === 0 ? (
                          <p className="text-muted-foreground">Geen.</p>
                        ) : (
                          <ul className="max-h-48 space-y-0.5 overflow-y-auto">
                            {log.missing_cities.slice(0, 100).map((c) => (
                              <li key={c.name}>
                                {c.name}{" "}
                                <span className="text-muted-foreground">
                                  ({c.count})
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="mb-1 font-semibold">Toegevoegde plaatsen</p>
                        {log.added_cities.length === 0 ? (
                          <p className="text-muted-foreground">Geen.</p>
                        ) : (
                          <ul className="max-h-48 space-y-0.5 overflow-y-auto">
                            {log.added_cities.slice(0, 100).map((c) => (
                              <li key={c.name}>
                                {c.name}{" "}
                                <span className="text-muted-foreground">
                                  ({c.count})
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPlaatsenCheck;