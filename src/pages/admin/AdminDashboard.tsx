import { useState } from "react";
import propertyPlaceholder from "@/assets/property-placeholder.jpg";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useScrapers, useAllProperties, useScrapedProperties, useScraperLogs, useRunScraper } from "@/hooks/useAdmin";
import {
  Home, Activity, Loader2, ClipboardCheck, Clock, CheckCircle, XCircle,
  TrendingUp, Building2, Eye, Zap, RefreshCw, ExternalLink, BarChart3, Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
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
  const { data: scrapers, isLoading: scrapersLoading } = useScrapers();
  const { data: properties, isLoading: propertiesLoading } = useAllProperties();
  const { data: scrapedProperties } = useScrapedProperties("pending");
  const { data: allLogs } = useScraperLogs();
  const runScraper = useRunScraper();
  const [resetting, setResetting] = useState(false);
  const [resetSource, setResetSource] = useState<string>("all");
  const queryClient = useQueryClient();

  const activeScrapers = scrapers?.filter((s) => s.is_active).length || 0;
  const totalScrapers = scrapers?.length || 0;
  const totalProperties = properties?.length || 0;
  const activeProperties = properties?.filter((p) => p.status === "actief").length || 0;
  const inactiveProperties = properties?.filter((p) => p.status === "inactief").length || 0;
  const pendingReviews = scrapedProperties?.length || 0;

  // Last scrape run info
  const lastLog = allLogs?.[0];
  const todayLogs = allLogs?.filter((l) => {
    const logDate = new Date(l.created_at);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }) || [];
  const totalScrapedToday = todayLogs.reduce((sum, l) => sum + (l.properties_scraped || 0), 0);
  const successfulRunsToday = todayLogs.filter((l) => l.status === "success").length;
  const failedRunsToday = todayLogs.filter((l) => l.status === "error").length;
  const recentLogs = allLogs?.slice(0, 10) || [];

  // Properties by city (top 5)
  const cityMap = new Map<string, number>();
  properties?.filter(p => p.status === "actief").forEach((p) => {
    const city = p.city || "Onbekend";
    cityMap.set(city, (cityMap.get(city) || 0) + 1);
  });
  const topCities = [...cityMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCityCount = topCities[0]?.[1] || 1;

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

  // Scraper health
  const workingScrapers = scrapers?.filter(s => s.last_run_status === "success" && s.is_active).length || 0;
  const scraperHealthPct = activeScrapers > 0 ? Math.round((workingScrapers / activeScrapers) * 100) : 0;

  const handleRunAllScrapers = async () => {
    const activeOnes = scrapers?.filter(s => s.is_active) || [];
    if (activeOnes.length === 0) {
      toast.error("Geen actieve scrapers");
      return;
    }
    toast.info(`${activeOnes.length} scrapers worden gestart...`);
    for (const scraper of activeOnes) {
      try {
        await runScraper.mutateAsync(scraper.id);
      } catch {
        // individual errors handled
      }
    }
    toast.success("Alle scrapers zijn uitgevoerd");
  };

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
      queryClient.invalidateQueries({ queryKey: ["scrapers"] });
      queryClient.invalidateQueries({ queryKey: ["scraper-logs"] });
      queryClient.invalidateQueries({ queryKey: ["scraped-properties"] });
    } catch (e) {
      toast.error("Reset mislukt: " + (e instanceof Error ? e.message : "onbekend"));
    } finally {
      setResetting(false);
    }
  };

  if (scrapersLoading || propertiesLoading) {
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
              onClick={handleRunAllScrapers}
              disabled={runScraper.isPending}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", runScraper.isPending && "animate-spin")} />
              Alle scrapers draaien
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  disabled={resetting}
                >
                  <Trash2 className={cn("h-4 w-4", resetting && "animate-spin")} />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Data resetten</AlertDialogTitle>
                  <AlertDialogDescription>
                    Selecteer welke bron je wilt resetten. Dit verwijdert actieve woningen van die bron, bijbehorende scraped data en logs. Verlopen woningen blijven behouden.
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
                  <p className="text-xs font-medium text-muted-foreground md:text-sm">Actieve woningen</p>
                  <p className="mt-1 text-2xl font-bold md:text-3xl">{activeProperties}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {inactiveProperties} inactief
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 md:p-3">
                  <Building2 className="h-5 w-5 text-primary md:h-6 md:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground md:text-sm">Vandaag gescraped</p>
                  <p className="mt-1 text-2xl font-bold md:text-3xl">{totalScrapedToday}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {successfulRunsToday} runs ✓ {failedRunsToday > 0 && `${failedRunsToday} ✗`}
                  </p>
                </div>
                <div className="rounded-xl bg-accent/10 p-2.5 md:p-3">
                  <TrendingUp className="h-5 w-5 text-accent md:h-6 md:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Link to="/admin/scrapers">
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground md:text-sm">Scrapers</p>
                    <p className="mt-1 text-2xl font-bold md:text-3xl">
                      {workingScrapers}<span className="text-lg text-muted-foreground">/{activeScrapers}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">werkend</p>
                  </div>
                  <div className="rounded-xl bg-green-500/10 p-2.5 md:p-3">
                    <Activity className="h-5 w-5 text-green-600 md:h-6 md:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/review">
            <Card className={cn(
              "h-full cursor-pointer transition-shadow hover:shadow-md",
              pendingReviews > 0 && "ring-2 ring-amber-400/50"
            )}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground md:text-sm">Review Queue</p>
                    <p className="mt-1 text-2xl font-bold md:text-3xl">{pendingReviews}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pendingReviews > 0 ? "wachten op review" : "alles verwerkt ✓"}
                    </p>
                  </div>
                  <div className={cn(
                    "rounded-xl p-2.5 md:p-3",
                    pendingReviews > 0 ? "bg-amber-500/10" : "bg-green-500/10"
                  )}>
                    <ClipboardCheck className={cn(
                      "h-5 w-5 md:h-6 md:w-6",
                      pendingReviews > 0 ? "text-amber-600" : "text-green-600"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Scraper Health + City Distribution */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Scraper Health */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  Scraper Gezondheid
                </CardTitle>
                <Badge variant={scraperHealthPct >= 80 ? "default" : scraperHealthPct >= 50 ? "secondary" : "destructive"}>
                  {scraperHealthPct}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={scraperHealthPct} className="h-2" />
              <div className="space-y-2">
                {scrapers?.filter(s => s.is_active).slice(0, 6).map((scraper) => {
                  const srcData = sourceMap.get(scraper.name.toLowerCase()) || sourceMap.get(
                    // try to match scraper name to source_site
                    [...sourceMap.keys()].find(k => scraper.name.toLowerCase().includes(k)) || ""
                  );
                  const activeCount = srcData?.actief || 0;
                  return (
                    <div key={scraper.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {scraper.last_run_status === "success" ? (
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                        ) : scraper.last_run_status === "error" ? (
                          <div className="h-2 w-2 rounded-full bg-destructive" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                        )}
                        <span className="truncate">{scraper.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {activeCount} actief
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link to="/admin/scrapers" className="block">
                <Button variant="ghost" size="sm" className="w-full gap-2 text-xs">
                  Alle scrapers bekijken
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Source Distribution */}
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
                  const total = counts.actief + counts.inactief;
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

              {/* City overview */}
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

              {/* Property types mini-overview */}
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
        </div>

        {/* Inactive Properties */}
        {inactiveProperties > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-muted-foreground" />
                Inactieve woningen ({inactiveProperties})
              </CardTitle>
              <Link to="/admin/woningen">
                <Button variant="ghost" size="sm" className="text-xs">
                  Bekijk alle
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {properties?.filter(p => p.status === "inactief").slice(0, 6).map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                         src={property.images?.[0] || propertyPlaceholder}
                        alt=""
                        className="h-full w-full object-cover opacity-60"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{property.title}</p>
                      <p className="text-xs text-muted-foreground">{property.city} · €{Number(property.price).toLocaleString("nl-NL")}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                      inactief
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Properties + Recent Logs */}
        <div className="grid gap-4 md:grid-cols-2">
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

          {/* Recent Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recente runs
              </CardTitle>
              {lastLog && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(lastLog.created_at), { addSuffix: true, locale: nl })}
                </span>
              )}
            </CardHeader>
            <CardContent>
              {recentLogs.length > 0 ? (
                <div className="space-y-2">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border p-2.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {log.status === "success" ? (
                          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                        ) : log.status === "warning" ? (
                          <Eye className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-destructive" />
                        )}
                        <span className="truncate text-xs">{log.message || log.status}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {log.properties_scraped ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {log.properties_scraped}
                          </Badge>
                        ) : null}
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "dd MMM HH:mm", { locale: nl })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nog geen runs uitgevoerd
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
