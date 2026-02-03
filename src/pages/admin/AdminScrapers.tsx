import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useScrapers, useToggleScraper, useScraperLogs } from "@/hooks/useAdmin";
import { 
  Loader2, 
  Play, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Activity 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const AdminScrapers = () => {
  const { data: scrapers, isLoading } = useScrapers();
  const toggleScraper = useToggleScraper();
  const { toast } = useToast();
  const [selectedScraper, setSelectedScraper] = useState<string | null>(null);
  const { data: logs } = useScraperLogs(selectedScraper || undefined);
  const [runningScrapers, setRunningScrapers] = useState<Set<string>>(new Set());

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      await toggleScraper.mutateAsync({ id, isActive: !currentState });
      toast({
        title: currentState ? "Scraper gedeactiveerd" : "Scraper geactiveerd",
        description: currentState 
          ? "De scraper is uitgeschakeld en zal geen nieuwe woningen ophalen."
          : "De scraper is nu actief en zal woningen ophalen.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon de scraper niet wijzigen.",
        variant: "destructive",
      });
    }
  };

  const handleRunScraper = async (id: string, name: string) => {
    setRunningScrapers((prev) => new Set(prev).add(id));
    
    // Simulate scraper run (in production this would call an edge function)
    toast({
      title: `${name} wordt gestart...`,
      description: "De scraper wordt uitgevoerd. Dit kan enkele minuten duren.",
    });

    // Simulate delay
    setTimeout(() => {
      setRunningScrapers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast({
        title: `${name} voltooid`,
        description: "De scraper heeft de run afgerond. Check de logs voor details.",
      });
    }, 3000);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Scrapers</h1>
          <p className="mt-1 text-muted-foreground">
            Beheer scrapers om automatisch woningen van externe websites op te halen
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totaal Scrapers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scrapers?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actieve Scrapers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {scrapers?.filter((s) => s.is_active).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totaal Gevonden Woningen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scrapers?.reduce((acc, s) => acc + (s.properties_found || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scrapers Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scrapers?.map((scraper) => (
            <Card key={scraper.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{scraper.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {scraper.description}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={scraper.is_active}
                    onCheckedChange={() => handleToggle(scraper.id, scraper.is_active)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href={scraper.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                  >
                    {scraper.website_url}
                  </a>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>{scraper.properties_found || 0} woningen</span>
                  </div>
                  {scraper.last_run_at && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(scraper.last_run_at), "d MMM HH:mm", { locale: nl })}
                      </span>
                    </div>
                  )}
                </div>

                {scraper.last_run_status && (
                  <Badge
                    variant={scraper.last_run_status === "success" ? "default" : "destructive"}
                    className="gap-1"
                  >
                    {scraper.last_run_status === "success" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {scraper.last_run_status}
                  </Badge>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedScraper(scraper.id)}
                  >
                    Logs bekijken
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!scraper.is_active || runningScrapers.has(scraper.id)}
                    onClick={() => handleRunScraper(scraper.id, scraper.name)}
                  >
                    {runningScrapers.has(scraper.id) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Bezig...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Nu uitvoeren
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="border-dashed">
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">
              <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">Scraper Functionaliteit</p>
              <p className="text-sm mt-1">
                Activeer scrapers om automatisch woningen van externe websites op te halen.
                <br />
                De scrapers draaien periodiek of kunnen handmatig gestart worden.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Dialog */}
      <Dialog open={!!selectedScraper} onOpenChange={() => setSelectedScraper(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Scraper Logs</DialogTitle>
            <DialogDescription>
              Bekijk de recente activiteit van deze scraper
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={log.status === "success" ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(log.created_at), "d MMM yyyy HH:mm:ss", { locale: nl })}
                    </span>
                  </div>
                  {log.message && (
                    <p className="text-muted-foreground">{log.message}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {log.properties_scraped !== null && (
                      <span>{log.properties_scraped} woningen gevonden</span>
                    )}
                    {log.duration_ms && (
                      <span>{(log.duration_ms / 1000).toFixed(2)}s</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen logs beschikbaar
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedScraper(null)}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminScrapers;
