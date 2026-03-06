import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDaisyconStatus,
  useDaisyconFeeds,
  useAddDaisyconFeed,
  useToggleDaisyconFeed,
  useDeleteDaisyconFeed,
  useRunDaisyconImport,
  useDaisyconAuth,
} from "@/hooks/useAdmin";
import {
  Loader2,
  Play,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Link2,
  RefreshCw,
  Rss,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const AdminDaisycon = () => {
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useDaisyconStatus();
  const { data: feeds, isLoading: feedsLoading } = useDaisyconFeeds();
  const addFeed = useAddDaisyconFeed();
  const toggleFeed = useToggleDaisyconFeed();
  const deleteFeed = useDeleteDaisyconFeed();
  const runImport = useRunDaisyconImport();
  const daisyconAuth = useDaisyconAuth();

  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: "", program_id: "", media_id: "", feed_url: "" });
  const [authCode, setAuthCode] = useState("");
  const [codeVerifier, setCodeVerifier] = useState("");
  const [authUrl, setAuthUrl] = useState("");

  const handleConnect = async () => {
    try {
      const result = await daisyconAuth.mutateAsync({ action: "init" });
      setAuthUrl(result.auth_url);
      setCodeVerifier(result.code_verifier);
      setShowConnect(true);
    } catch (e) {
      toast.error("Kon verbinding niet starten: " + (e instanceof Error ? e.message : "onbekend"));
    }
  };

  const handleExchangeCode = async () => {
    if (!authCode.trim()) {
      toast.error("Voer de autorisatiecode in");
      return;
    }
    try {
      await daisyconAuth.mutateAsync({ action: "exchange", code: authCode.trim(), code_verifier: codeVerifier });
      toast.success("Daisycon succesvol gekoppeld!");
      setShowConnect(false);
      setAuthCode("");
      refetchStatus();
    } catch (e) {
      toast.error("Koppeling mislukt: " + (e instanceof Error ? e.message : "onbekend"));
    }
  };

  const handleAddFeed = async () => {
    if (!newFeed.name || !newFeed.program_id || !newFeed.media_id) {
      toast.error("Vul naam, program ID en media ID in");
      return;
    }
    try {
      await addFeed.mutateAsync({
        name: newFeed.name,
        program_id: parseInt(newFeed.program_id),
        media_id: parseInt(newFeed.media_id),
        feed_url: newFeed.feed_url || undefined,
      });
      toast.success("Feed toegevoegd");
      setShowAddFeed(false);
      setNewFeed({ name: "", program_id: "", media_id: "", feed_url: "" });
    } catch (e) {
      toast.error("Feed toevoegen mislukt: " + (e instanceof Error ? e.message : "onbekend"));
    }
  };

  const handleImport = async (feedId?: string) => {
    try {
      toast.info("Import gestart...");
      const result = await runImport.mutateAsync(feedId);
      toast.success(`Import voltooid: ${result.total_imported} nieuw, ${result.total_skipped} overgeslagen`);
    } catch (e) {
      toast.error("Import mislukt: " + (e instanceof Error ? e.message : "onbekend"));
    }
  };

  if (statusLoading || feedsLoading) {
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Daisycon Integratie</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Beheer je Daisycon feeds en importeer woningen
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleImport()}
              disabled={runImport.isPending || !status?.connected}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${runImport.isPending ? "animate-spin" : ""}`} />
              Alle feeds importeren
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Daisycon Verbinding
                </CardTitle>
                <CardDescription>OAuth 2.1 authenticatie met Daisycon API</CardDescription>
              </div>
              {status?.connected ? (
                <Badge className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verbonden
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Niet verbonden
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {status?.connected ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Laatst vernieuwd: {status.last_refreshed
                    ? formatDistanceToNow(new Date(status.last_refreshed), { addSuffix: true, locale: nl })
                    : "onbekend"}
                </div>
                <Button variant="outline" size="sm" onClick={handleConnect}>
                  Opnieuw verbinden
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnect} disabled={daisyconAuth.isPending} className="gap-2">
                <Link2 className="h-4 w-4" />
                Verbind met Daisycon
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Feeds */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Rss className="h-5 w-5" />
                  Product Feeds
                </CardTitle>
                <CardDescription>
                  Configureer welke Daisycon feeds worden geïmporteerd
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddFeed(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Feed toevoegen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {feeds && feeds.length > 0 ? (
              <div className="space-y-3">
                {feeds.map((feed: any) => (
                  <div
                    key={feed.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{feed.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Program: {feed.program_id}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Media: {feed.media_id}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {feed.properties_imported || 0} geïmporteerd
                        {feed.last_import_at && (
                          <> · Laatst: {formatDistanceToNow(new Date(feed.last_import_at), { addSuffix: true, locale: nl })}</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={feed.is_active}
                        onCheckedChange={(checked) =>
                          toggleFeed.mutate({ id: feed.id, is_active: checked })
                        }
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleImport(feed.id)}
                        disabled={runImport.isPending || !feed.is_active}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Feed verwijderen?")) {
                            deleteFeed.mutate(feed.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Rss className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Nog geen feeds geconfigureerd</p>
                <p className="text-xs mt-1">Voeg een feed toe om woningen te importeren</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connect Dialog */}
        <Dialog open={showConnect} onOpenChange={setShowConnect}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verbind met Daisycon</DialogTitle>
              <DialogDescription>
                Volg de stappen om je Daisycon account te koppelen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Stap 1: Open de autorisatie-URL</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Klik op de link hieronder, log in bij Daisycon en kopieer de code die je krijgt.
                </p>
                {authUrl && (
                  <a
                    href={authUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Open Daisycon Login <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div>
                <Label htmlFor="auth-code" className="text-sm font-medium">
                  Stap 2: Plak de autorisatiecode
                </Label>
                <Input
                  id="auth-code"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Plak hier de code..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConnect(false)}>
                Annuleren
              </Button>
              <Button
                onClick={handleExchangeCode}
                disabled={daisyconAuth.isPending || !authCode.trim()}
              >
                {daisyconAuth.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verbinden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Feed Dialog */}
        <Dialog open={showAddFeed} onOpenChange={setShowAddFeed}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Feed toevoegen</DialogTitle>
              <DialogDescription>
                Voeg een Daisycon product feed toe om woningen te importeren
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feed-name">Naam</Label>
                <Input
                  id="feed-name"
                  value={newFeed.name}
                  onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                  placeholder="bijv. Pararius Huurwoningen"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program-id">Program ID</Label>
                  <Input
                    id="program-id"
                    type="number"
                    value={newFeed.program_id}
                    onChange={(e) => setNewFeed({ ...newFeed, program_id: e.target.value })}
                    placeholder="bijv. 7611"
                  />
                </div>
                <div>
                  <Label htmlFor="media-id">Media ID</Label>
                  <Input
                    id="media-id"
                    type="number"
                    value={newFeed.media_id}
                    onChange={(e) => setNewFeed({ ...newFeed, media_id: e.target.value })}
                    placeholder="bijv. 22848"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="feed-url">Feed URL (optioneel)</Label>
                <Input
                  id="feed-url"
                  value={newFeed.feed_url}
                  onChange={(e) => setNewFeed({ ...newFeed, feed_url: e.target.value })}
                  placeholder="https://daisycon.io/datafeed/?..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Laat leeg om automatisch te genereren op basis van Program en Media ID
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFeed(false)}>
                Annuleren
              </Button>
              <Button onClick={handleAddFeed} disabled={addFeed.isPending}>
                {addFeed.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Toevoegen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDaisycon;
