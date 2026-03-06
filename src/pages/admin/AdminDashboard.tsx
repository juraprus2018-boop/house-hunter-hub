import { useState } from "react";
import propertyPlaceholder from "@/assets/property-placeholder.jpg";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAllProperties, useDailyAlertSubscribers, useDaisyconStatus, useDaisyconFeeds, useRunDaisyconImport } from "@/hooks/useAdmin";
import {
  Home, Loader2, Clock, CheckCircle, XCircle,
  Building2, Eye, RefreshCw, ExternalLink, BarChart3, Trash2, Facebook, Rss, Link2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminDashboard = () => {
  const { data: properties, isLoading: propertiesLoading } = useAllProperties();
  const { data: dailyAlertSubscribers } = useDailyAlertSubscribers();
  const { data: daisyconStatus } = useDaisyconStatus();
  const { data: daisyconFeeds } = useDaisyconFeeds();
  const runImport = useRunDaisyconImport();
  const [resetting, setResetting] = useState(false);
  const [resetSource, setResetSource] = useState<string>("all");
  const queryClient = useQueryClient();

  const totalProperties = properties?.length || 0;
  const activeProperties = properties?.filter((p) => p.status === "actief").length || 0;
  const inactiveProperties = properties?.filter((p) => p.status === "inactief").length || 0;
  const otherStatusesProperties = Math.max(totalProperties - activeProperties - inactiveProperties, 0);
  const activeAlertSubscribers = dailyAlertSubscribers?.filter((s) => s.is_active).length || 0;
  const unsubscribedAlertSubscribers = dailyAlertSubscribers?.filter((s) => !s.is_active).length || 0;
  const activeFeeds = daisyconFeeds?.filter((f: any) => f.is_active).length || 0;
  const totalFeeds = daisyconFeeds?.length || 0;

  // Properties by city (top 5)
  const cityMap = new Map<string, number>();
  properties?.filter(p => p.status === "actief").forEach((p) => {
    const city = p.city || "Onbekend";
    cityMap.set(city, (cityMap.get(city) || 0) + 1);
  });
  const topCities = [...cityMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Properties by source
  const sourceMap = new Map<string, { actief: number; inactief: number }>();
  properties?.forEach((p) => {
    const src = p.source_site || "Handmatig";
    const entry = sourceMap.get(src) || { actief: 0, inactief: 0 };
    if (p.status === "actief") entry.actief++;
    else entry.inactief++;
    sourceMap.set(src, entry);
  });
  const sourceEntries = [...sourceMap.entries()].sort((a, b) => (b[1].actief + b[1].inactief) - (a[1].actief + a[1].inactief));

  // Properties by type
  const typeMap = new Map<string, number>();
  properties?.filter(p => p.status === "actief").forEach((p) => {
    typeMap.set(p.property_type, (typeMap.get(p.property_type) || 0) + 1);
  });

  // Unique sources for reset dropdown
  const availableSources = Array.from(
    new Set(properties?.map((p) => p.source_site).filter(Boolean) as string[])
  ).sort();

  const handleReset = async () => {
    setResetting(true);
    try {
      const body = resetSource !== "all" ? { source_site: resetSource } : {};
      const { data, error } = await supabase.functions.invoke("admin-reset", { body });
      if (error) throw error;
      const label = resetSource === "all" ? "Alles" : resetSource;
      toast.success(`Reset voltooid (${label}): ${data.active_deleted || 0} woningen verwijderd`);
      queryClient.invalidateQueries({ queryKey: ["all-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    } catch (e) {
      toast.error("Reset mislukt: " + (e instanceof Error ? e.message : "onbekend"));
    } finally {
      setResetting(false);
    }
  };

  const handleImportAll = async () => {
    try {
      toast.info("Daisycon import gestart...");
      const result = await runImport.mutateAsync(undefined);
      toast.success(`Import voltooid: ${result.total_imported} nieuw, ${result.total_skipped} overgeslagen`);
    } catch (e) {
      toast.error("Import mislukt: " + (e instanceof Error ? e.message : "onbekend"));
    }
  };

  if (propertiesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overzicht van je woningplatform
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleImportAll}
              disabled={runImport.isPending || !daisyconStatus?.connected}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", runImport.isPending && "animate-spin")} />
              Daisycon import
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2" disabled={resetting}>
                  <Trash2 className={cn("h-4 w-4", resetting && "animate-spin")} />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Data resetten</AlertDialogTitle>
                  <AlertDialogDescription>
                    Selecteer welke bron je wilt resetten. Dit verwijdert actieve woningen van die bron.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Select value={resetSource} onValueChange={setResetSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer bron" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      <SelectItem value="all">Alle bronnen</SelectItem>
                      {availableSources.map((source) => (
                        <SelectItem key={source} value={source} className="capitalize">
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    {resetSource === "all" ? "Ja, reset alles" : `Reset ${resetSource}`}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground md:text-sm">Woningen overzicht</p>
                  <p className="mt-1 text-2xl font-bold md:text-3xl">{totalProperties}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activeProperties} actief · {inactiveProperties} inactief
                  </p>
                  {otherStatusesProperties > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {otherStatusesProperties} verhuurd/verkocht
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 md:p-3">
                  <Building2 className="h-5 w-5 text-primary md:h-6 md:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Link to="/admin/scrapers">
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground md:text-sm">Daisycon</p>
                    <p className="mt-1 text-2xl font-bold md:text-3xl">
                      {activeFeeds}<span className="text-lg text-muted-foreground">/{totalFeeds}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {daisyconStatus?.connected ? "verbonden ✓" : "niet verbonden"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-green-600/10 p-2.5 md:p-3">
                    <Rss className="h-5 w-5 text-green-600 md:h-6 md:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground md:text-sm">Dagelijkse alerts</p>
                  <p className="mt-1 text-2xl font-bold md:text-3xl">{activeAlertSubscribers}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    actieve abonnees
                  </p>
                </div>
                <div className="rounded-xl bg-accent/10 p-2.5 md:p-3">
                  <Link2 className="h-5 w-5 text-accent md:h-6 md:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground md:text-sm">Steden</p>
                  <p className="mt-1 text-2xl font-bold md:text-3xl">{cityMap.size}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    unieke steden
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 md:p-3">
                  <Home className="h-5 w-5 text-primary md:h-6 md:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Source Distribution + City Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Woningen per bron
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sourceEntries.length > 0 ? (
                sourceEntries.map(([source, counts]) => {
                  const maxTotal = sourceEntries[0] ? sourceEntries[0][1].actief + sourceEntries[0][1].inactief : 1;
                  return (
                    <div key={source} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium capitalize">{source}</span>
                        <span className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{counts.actief}</span> actief
                          {counts.inactief > 0 && (
                            <span className="ml-1 text-muted-foreground">· {counts.inactief} inactief</span>
                          )}
                        </span>
                      </div>
                      <div className="flex h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-1.5 bg-primary transition-all"
                          style={{ width: `${(counts.actief / maxTotal) * 100}%` }}
                        />
                        {counts.inactief > 0 && (
                          <div
                            className="h-1.5 bg-muted-foreground/30 transition-all"
                            style={{ width: `${(counts.inactief / maxTotal) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nog geen woningen
                </p>
              )}

              {topCities.length > 0 && (
                <div className="border-t pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Top steden</p>
                  <div className="flex flex-wrap gap-2">
                    {topCities.slice(0, 5).map(([city, count]) => (
                      <Badge key={city} variant="secondary" className="text-xs">
                        {city}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {typeMap.size > 0 && (
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  {[...typeMap.entries()].map(([type, count]) => (
                    <Badge key={type} variant="secondary" className="capitalize">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Properties */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recente woningen</CardTitle>
              <Link to="/admin/woningen">
                <Button variant="ghost" size="sm" className="text-xs">
                  Bekijk alle
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {properties && properties.length > 0 ? (
                <div className="space-y-2">
                  {properties.slice(0, 6).map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        <img
                          src={property.images?.[0] || propertyPlaceholder}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{property.title}</p>
                        <p className="text-xs text-muted-foreground">{property.city} · €{Number(property.price).toLocaleString("nl-NL")}</p>
                      </div>
                      <Badge
                        variant={property.status === "actief" ? "default" : "secondary"}
                        className="text-[10px] flex-shrink-0"
                      >
                        {property.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nog geen woningen
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Alert Subscribers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dagelijkse alerts (nieuw aanbod)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <Badge variant="default">{activeAlertSubscribers} actief</Badge>
              <Badge variant="secondary">{unsubscribedAlertSubscribers} afgemeld</Badge>
              <Badge variant="outline">{dailyAlertSubscribers?.length || 0} totaal</Badge>
            </div>
            {dailyAlertSubscribers && dailyAlertSubscribers.length > 0 ? (
              <div className="space-y-2">
                {dailyAlertSubscribers.slice(0, 12).map((subscriber) => (
                  <div key={subscriber.id} className="flex flex-col justify-between gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-medium">{subscriber.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Ingeschreven: {format(new Date(subscriber.subscribed_at), "d MMM yyyy HH:mm", { locale: nl })}
                      </p>
                    </div>
                    <Badge variant={subscriber.is_active ? "default" : "secondary"}>
                      {subscriber.is_active ? "Actief" : "Afgemeld"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen aanmeldingen voor dagelijkse alerts.</p>
            )}
          </CardContent>
        </Card>

        {/* Facebook Posts Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Facebook className="h-4 w-4 text-muted-foreground" />
              Facebook Posts
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {properties?.filter(p => p.facebook_posted_at).length || 0} geplaatst
            </Badge>
          </CardHeader>
          <CardContent>
            {(() => {
              const postedProperties = properties
                ?.filter(p => p.facebook_posted_at)
                .sort((a, b) => new Date(b.facebook_posted_at!).getTime() - new Date(a.facebook_posted_at!).getTime())
                .slice(0, 10);
              
              if (!postedProperties || postedProperties.length === 0) {
                return (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nog geen woningen op Facebook geplaatst
                  </p>
                );
              }

              return (
                <div className="space-y-2">
                  {postedProperties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        <img
                          src={property.images?.[0] || propertyPlaceholder}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{property.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {property.city} · €{Number(property.price).toLocaleString("nl-NL")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <Badge variant="default" className="text-[10px] mb-0.5">
                          <Facebook className="h-2.5 w-2.5 mr-1" />
                          geplaatst
                        </Badge>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(property.facebook_posted_at!), "dd MMM yyyy HH:mm", { locale: nl })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
