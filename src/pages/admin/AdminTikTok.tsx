import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Music2,
  Download,
  Copy,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Search as SearchIcon,
  ImageIcon,
  Link2,
  Zap,
  AlertTriangle,
} from "lucide-react";
import {
  generateSlides,
  downloadSlidesZip,
  buildTikTokCaption,
  type SlideProperty,
} from "@/lib/tiktokSlides";

const PAGE_SIZE = 30;

const AdminTikTok = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [previews, setPreviews] = useState<Record<string, string[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [autoPosting, setAutoPosting] = useState(false);

  // ── TikTok account status ──
  const { data: account, refetch: refetchAccount } = useQuery({
    queryKey: ["tiktok-account"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("tiktok_oauth_tokens")
        .select("open_id,display_name,avatar_url,expires_at,refresh_expires_at,updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as
        | {
            open_id: string;
            display_name: string | null;
            avatar_url: string | null;
            expires_at: string;
            refresh_expires_at: string | null;
            updated_at: string;
          }
        | null;
    },
  });

  // ── Detect ?connected=1 / ?error=... after OAuth callback ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      toast.success("TikTok account verbonden");
      refetchAccount();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("error")) {
      toast.error("TikTok koppeling mislukt", { description: params.get("error") ?? "" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetchAccount]);

  const handleConnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("tiktok-oauth-start");
      if (error) throw error;
      const url = (data as { url?: string } | null)?.url;
      if (!url) throw new Error("Geen URL ontvangen");
      window.location.href = url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Onbekende fout";
      toast.error("Kon TikTok-koppeling niet starten", { description: msg });
    }
  };

  const handleAutoPost = async (propertyId?: string) => {
    setAutoPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke("tiktok-post-property", {
        body: propertyId ? { property_id: propertyId } : {},
      });
      if (error) throw error;
      const res = data as { success: boolean; message?: string; error?: string };
      if (!res.success) throw new Error(res.error || "Onbekende fout");
      toast.success("Video staat in je TikTok inbox", {
        description: res.message ?? "Open de TikTok app en tap 'Post'.",
      });
      qc.invalidateQueries({ queryKey: ["admin-tiktok-properties"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Onbekende fout";
      toast.error("Auto-post mislukt", { description: msg });
    } finally {
      setAutoPosting(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tiktok-properties"],
    queryFn: async () => {
      const [propsRes, postedRes] = await Promise.all([
        supabase
          .from("properties")
          .select(
            "id,title,city,price,listing_type,property_type,surface_area,bedrooms,bathrooms,energy_label,street,house_number,images,slug,created_at"
          )
          .eq("status", "actief")
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE),
        (supabase as any).from("tiktok_posts").select("property_id,posted_at"),
      ]);
      if (propsRes.error) throw propsRes.error;
      const postedMap = new Map<string, string>(
        ((postedRes.data as any[]) || []).map((r) => [r.property_id, r.posted_at])
      );
      return { props: propsRes.data || [], posted: postedMap };
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return data.props;
    return data.props.filter(
      (p: any) =>
        p.city?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q)
    );
  }, [data, filter]);

  const handlePreview = async (p: any) => {
    setBusyId(p.id);
    try {
      const slides = await generateSlides(p as SlideProperty);
      const urls = slides.map((b) => URL.createObjectURL(b));
      setPreviews((prev) => {
        // revoke old
        prev[p.id]?.forEach((u) => URL.revokeObjectURL(u));
        return { ...prev, [p.id]: urls };
      });
    } catch (e: any) {
      toast.error("Kon previews niet maken", { description: e?.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (p: any) => {
    setBusyId(p.id);
    try {
      await downloadSlidesZip(p as SlideProperty);
      toast.success("ZIP met 5 slides gedownload");
    } catch (e: any) {
      toast.error("Download mislukt", { description: e?.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyCaption = async (p: any) => {
    const caption = buildTikTokCaption(p as SlideProperty);
    try {
      await navigator.clipboard.writeText(caption);
      toast.success("Caption gekopieerd naar klembord");
    } catch {
      toast.error("Kon niet kopiëren");
    }
  };

  const handleMarkPosted = async (p: any) => {
    try {
      const caption = buildTikTokCaption(p as SlideProperty);
      const { error } = await (supabase as any).from("tiktok_posts").upsert(
        {
          property_id: p.id,
          caption,
          posted_by: user?.id ?? null,
        },
        { onConflict: "property_id" }
      );
      if (error) throw error;
      toast.success("Gemarkeerd als gepost");
      qc.invalidateQueries({ queryKey: ["admin-tiktok-properties"] });
    } catch (e: any) {
      toast.error("Kon niet markeren", { description: e?.message });
    }
  };

  const handleOpenTikTok = () => {
    window.open("https://www.tiktok.com/upload?lang=nl", "_blank", "noopener,noreferrer");
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              <Music2 className="mr-2 inline h-7 w-7 text-primary" />
              TikTok automatisch
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Volledig automatisch: dagelijks wordt een nieuwe woning omgezet naar een 9:16 video en in jouw TikTok inbox geplaatst. Open TikTok en tap 1× 'Post'.
            </p>
          </div>
          <Button onClick={handleOpenTikTok} variant="default" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Open TikTok Upload
          </Button>
        </div>

        {/* ── Account status / connect ── */}
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {account?.avatar_url ? (
                <img
                  src={account.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full border object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Music2 className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                {account ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{account.display_name || "TikTok"}</span>
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verbonden
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Token verloopt {new Date(account.expires_at).toLocaleString("nl-NL")} (auto-vernieuwd)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Geen TikTok-account verbonden</span>
                      <Badge variant="outline" className="gap-1 text-amber-700">
                        <AlertTriangle className="h-3 w-3" /> Vereist
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Verbind je TikTok account zodat dagelijks automatisch een woning naar je inbox wordt geplaatst.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleConnect} variant={account ? "outline" : "default"} className="gap-2">
                <Link2 className="h-4 w-4" />
                {account ? "Opnieuw verbinden" : "Verbind TikTok"}
              </Button>
              {account && (
                <Button onClick={() => handleAutoPost()} disabled={autoPosting} className="gap-2">
                  {autoPosting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Post nieuwste woning nu
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Werkwijze */}
        <Card className="bg-muted/40 p-5">
          <h2 className="mb-3 font-display text-base font-semibold">Werkwijze (≈ 30 sec per post)</h2>
          <ol className="space-y-1.5 text-sm text-muted-foreground">
            <li><strong>1.</strong> Klik <em>Genereer slides</em> bij een woning → preview verschijnt.</li>
            <li><strong>2.</strong> Klik <em>Download ZIP</em> → 5 jpg's verschijnen in je downloads.</li>
            <li><strong>3.</strong> Klik <em>Kopieer caption</em> → tekst staat klaar op klembord.</li>
            <li><strong>4.</strong> Klik <em>Open TikTok Upload</em>, kies <em>Foto's</em>, sleep de 5 jpg's erin op volgorde.</li>
            <li><strong>5.</strong> Plak caption (Cmd/Ctrl+V), publiceer, klik tot slot <em>Markeer als gepost</em>.</li>
          </ol>
        </Card>

        {/* Filter */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter op stad of titel"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lijst */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p: any) => {
              const postedAt = data?.posted.get(p.id);
              const preview = previews[p.id];
              return (
                <Card key={p.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Thumb */}
                    <div className="h-32 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-32">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info + actions */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-1 font-display font-semibold text-foreground">
                            {p.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {p.city} · €{Number(p.price).toLocaleString("nl-NL")}
                            {p.listing_type === "huur" ? "/mnd" : ""}
                            {p.surface_area ? ` · ${p.surface_area} m²` : ""}
                          </p>
                        </div>
                        {postedAt && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Gepost {new Date(postedAt).toLocaleDateString("nl-NL")}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {account && (
                          <Button
                            size="sm"
                            onClick={() => handleAutoPost(p.id)}
                            disabled={autoPosting}
                            className="gap-1"
                          >
                            {autoPosting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                            Auto-post naar TikTok
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(p)}
                          disabled={busyId === p.id}
                        >
                          {busyId === p.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <ImageIcon className="mr-1 h-4 w-4" />
                          )}
                          Genereer slides
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(p)}
                          disabled={busyId === p.id}
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Download ZIP
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCopyCaption(p)}>
                          <Copy className="mr-1 h-4 w-4" />
                          Kopieer caption
                        </Button>
                        <Button
                          size="sm"
                          variant={postedAt ? "ghost" : "default"}
                          onClick={() => handleMarkPosted(p)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          {postedAt ? "Opnieuw markeren" : "Markeer als gepost"}
                        </Button>
                      </div>

                      {preview && (
                        <div className="mt-2 grid grid-cols-5 gap-2">
                          {preview.map((url, i) => (
                            <div
                              key={i}
                              className="aspect-[9/16] overflow-hidden rounded-md border bg-muted"
                            >
                              <img src={url} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Geen woningen gevonden.
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTikTok;