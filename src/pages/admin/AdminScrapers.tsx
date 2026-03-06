import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  useDaisyconPrograms,
  useUpdateDaisyconFeed,
  useUploadFeedLogo,
  useRunWooniezieImport,
  useWooniezieStats,
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
  Search,
  Pencil,
  Upload,
  Image,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const AdminDaisycon = () => {
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useDaisyconStatus();
  const { data: feeds, isLoading: feedsLoading } = useDaisyconFeeds();
  const addFeed = useAddDaisyconFeed();
  const toggleFeed = useToggleDaisyconFeed();
  const deleteFeed = useDeleteDaisyconFeed();
  const runImport = useRunDaisyconImport();
  const daisyconAuth = useDaisyconAuth();
  const updateFeed = useUpdateDaisyconFeed();
  const uploadLogo = useUploadFeedLogo();
  const { data: programsData, refetch: fetchPrograms, isLoading: programsLoading, isFetching: programsFetching } = useDaisyconPrograms();

  // Wooniezie
  const wooniezieImport = useRunWooniezieImport();
  const { data: wooniezieStats } = useWooniezieStats();
  const [wooniezieIncludeKoop, setWooniezieIncludeKoop] = useState(false);

  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showEditFeed, setShowEditFeed] = useState(false);
  const [editingFeed, setEditingFeed] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", feed_url: "" });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
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

  const handleAddFromProgram = async (sub: any, mediaId: number) => {
    const programName = sub.program?.name || sub.name || `Program ${sub.program_id}`;
    const programId = sub.program_id || sub.program?.id || sub.id;
    try {
      await addFeed.mutateAsync({
        name: programName,
        program_id: programId,
        media_id: mediaId,
      });
      toast.success(`Feed "${programName}" toegevoegd`);
    } catch (e) {
      toast.error("Feed toevoegen mislukt: " + (e instanceof Error ? e.message : "onbekend"));
    }
  };

  const handleOpenAddFeed = async () => {
    setShowAddFeed(true);
    if (status?.connected && !programsData) {
      fetchPrograms();
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

  const handleOpenEdit = (feed: any) => {
    setEditingFeed(feed);
    setEditForm({ name: feed.name, feed_url: feed.feed_url || "" });
    setLogoPreview(feed.logo_url || null);
    setShowEditFeed(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingFeed) return;
    try {
      const url = await uploadLogo.mutateAsync({ feedId: editingFeed.id, file });
      setLogoPreview(url);
      await updateFeed.mutateAsync({ id: editingFeed.id, logo_url: url });
      toast.success("Logo geüpload");
    } catch (err) {
      toast.error("Logo uploaden mislukt");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingFeed) return;
    try {
      await updateFeed.mutateAsync({
        id: editingFeed.id,
        name: editForm.name,
        feed_url: editForm.feed_url || null,
      });
      toast.success("Feed bijgewerkt");
      setShowEditFeed(false);
    } catch (err) {
      toast.error("Bijwerken mislukt");
    }
  };

  // Get already-added program IDs
  const existingProgramIds = new Set((feeds || []).map((f: any) => f.program_id));

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
              <Button onClick={handleOpenAddFeed} size="sm" className="gap-2">
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
                    <div className="flex items-center gap-3 flex-1">
                      {feed.logo_url ? (
                        <img src={feed.logo_url} alt={feed.name} className="h-10 w-10 rounded-md object-contain border bg-white" />
                      ) : (
                        <div className="h-10 w-10 rounded-md border bg-muted flex items-center justify-center">
                          <Image className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
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
                        onClick={() => handleOpenEdit(feed)}
                        title="Bewerken"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Feed toevoegen</DialogTitle>
              <DialogDescription>
                Selecteer een programma uit je Daisycon account of voer handmatig een feed in
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Auto-discover section */}
              {status?.connected && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Beschikbare programma's</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPrograms()}
                      disabled={programsFetching}
                      className="gap-1"
                    >
                      {programsFetching ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Search className="h-3 w-3" />
                      )}
                      {programsFetching ? "Laden..." : "Vernieuw"}
                    </Button>
                  </div>

                  {programsFetching && !programsData && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Programma's ophalen...</span>
                    </div>
                  )}

                  {programsData && (
                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border p-2">
                      {programsData.subscriptions && programsData.subscriptions.length > 0 ? (
                        programsData.subscriptions.flatMap((sub: any, idx: number) => {
                          const programIds: number[] = sub.program_ids || (sub.program_id ? [sub.program_id] : [sub.id]);
                          const defaultMediaId = sub.media_id || programsData.media?.[0]?.id;
                          const names = programsData.program_names || {};
                          const availability = programsData.feed_availability || {};

                          return programIds.map((pid: number) => {
                            const programName = names[pid] || `Program ${pid}`;
                            const hasFeed = availability[pid] ?? null;

                            return (
                              <div
                                key={`${idx}-${pid}`}
                                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{programName}</span>
                                    {hasFeed === true && (
                                      <Badge variant="default" className="text-xs gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Feed beschikbaar
                                      </Badge>
                                    )}
                                    {hasFeed === false && (
                                      <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                                        <XCircle className="h-3 w-3" />
                                        Geen feed
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Program ID: {pid} · Status: {sub.status || 'onbekend'}
                                  </div>
                                </div>
                                {existingProgramIds.has(pid) ? (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Toegevoegd
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAddFromProgram({ program_id: pid, name: programName }, defaultMediaId || 0)}
                                    disabled={addFeed.isPending || hasFeed === false}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Toevoegen
                                  </Button>
                                )}
                              </div>
                            );
                          });
                        })
                      ) : (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          Geen programma's gevonden. Controleer je Daisycon subscripties.
                        </div>
                      )}
                    </div>
                  )}

                  {programsData?.media && programsData.media.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Media: {programsData.media.map((m: any) => `${m.name || m.id} (${m.id})`).join(", ")}
                    </div>
                  )}

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">of handmatig</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual entry */}
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFeed(false)}>
                Annuleren
              </Button>
              <Button onClick={handleAddFeed} disabled={addFeed.isPending}>
                {addFeed.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Handmatig toevoegen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Feed Dialog */}
        <Dialog open={showEditFeed} onOpenChange={setShowEditFeed}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Feed bewerken</DialogTitle>
              <DialogDescription>
                Pas de naam, feed URL en het logo van deze campagne aan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Logo</Label>
                <div className="mt-2 flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg object-contain border bg-white" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                        <Upload className="h-4 w-4" />
                        Logo uploaden
                      </div>
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    {uploadLogo.isPending && (
                      <p className="text-xs text-muted-foreground mt-1">Uploaden...</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-name">Naam</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-feed-url">Feed URL (optioneel)</Label>
                <Input
                  id="edit-feed-url"
                  value={editForm.feed_url}
                  onChange={(e) => setEditForm({ ...editForm, feed_url: e.target.value })}
                  placeholder="https://daisycon.io/datafeed/?..."
                />
              </div>
              {editingFeed && (
                <div className="text-xs text-muted-foreground">
                  Program ID: {editingFeed.program_id} · Media ID: {editingFeed.media_id}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditFeed(false)}>
                Annuleren
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateFeed.isPending}>
                {updateFeed.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Opslaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDaisycon;
