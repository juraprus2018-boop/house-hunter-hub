import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import {
  Search, TrendingUp, TrendingDown, Minus, Globe, RefreshCw, BarChart3,
  MousePointerClick, Eye, Target, ArrowLeft, ExternalLink, Award, Percent,
  Users, Activity, Zap, Clock, MapPin
} from "lucide-react";
import { format, subHours, subMinutes } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import L from "leaflet";

type ViewMode = "overview" | "top-pages" | "all-clicks" | "impressions" | "indexed" | "detail";
type MainTab = "ranking" | "live";

const COLORS = [
  "hsl(var(--primary))", "hsl(142, 76%, 36%)", "hsl(217, 91%, 60%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(280, 68%, 60%)",
  "hsl(190, 80%, 42%)", "hsl(330, 70%, 50%)",
];

const AdminGoogleRanking = () => {
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [fetchingConsole, setFetchingConsole] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [mainTab, setMainTab] = useState<MainTab>("ranking");

  // Live stats: page views last 5 min
  const { data: liveVisitors } = useQuery({
    queryKey: ["live-visitors"],
    queryFn: async () => {
      const fiveMinAgo = subMinutes(new Date(), 5).toISOString();
      const { data, error } = await supabase
        .from("page_views")
        .select("session_id, page_url, created_at")
        .gte("created_at", fiveMinAgo)
        .order("created_at", { ascending: false }) as any;
      if (error) throw error;
      // Filter out admin/preview pages
      const filtered = (data || []).filter((pv: any) =>
        !pv.page_url.startsWith("/admin") && !pv.page_url.includes("forceHideBadge")
      );
      const sessions: Record<string, { pages: string[]; lastSeen: string }> = {};
      for (const pv of filtered) {
        if (!sessions[pv.session_id]) sessions[pv.session_id] = { pages: [], lastSeen: pv.created_at };
        sessions[pv.session_id].pages.push(pv.page_url);
      }
      return { count: Object.keys(sessions).length, sessions };
    },
    refetchInterval: 15000,
  });

  // 24h stats
  const { data: stats24h } = useQuery({
    queryKey: ["stats-24h"],
    queryFn: async () => {
      const dayAgo = subHours(new Date(), 24).toISOString();
      const [pvRes, clickRes] = await Promise.all([
        supabase.from("page_views").select("session_id, page_url, created_at").gte("created_at", dayAgo).order("created_at", { ascending: false }).limit(5000) as any,
        supabase.from("daisycon_clicks").select("*").gte("created_at", dayAgo).order("created_at", { ascending: false }).limit(1000) as any,
      ]);
      if (pvRes.error) throw pvRes.error;
      if (clickRes.error) throw clickRes.error;

      const pageViews = (pvRes.data || []).filter((pv: any) =>
        !pv.page_url.startsWith("/admin") && !pv.page_url.includes("forceHideBadge")
      );
      const clicks = clickRes.data || [];
      const uniqueSessions = new Set(pageViews.map((p: any) => p.session_id)).size;

      // Top pages
      const pageCounts: Record<string, number> = {};
      for (const pv of pageViews) {
        pageCounts[pv.page_url] = (pageCounts[pv.page_url] || 0) + 1;
      }
      const topPages24h = Object.entries(pageCounts)
        .map(([url, views]) => ({ url, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 20);

      // Hourly chart
      const hourly: Record<string, { views: number; clicks: number }> = {};
      for (let i = 23; i >= 0; i--) {
        const h = format(subHours(new Date(), i), "HH:00");
        hourly[h] = { views: 0, clicks: 0 };
      }
      for (const pv of pageViews) {
        const h = format(new Date(pv.created_at), "HH:00");
        if (hourly[h]) hourly[h].views++;
      }
      for (const c of clicks) {
        const h = format(new Date(c.created_at), "HH:00");
        if (hourly[h]) hourly[h].clicks++;
      }
      const hourlyChart = Object.entries(hourly).map(([hour, d]) => ({ hour, ...d }));

      // Click sources
      const sourceCounts: Record<string, number> = {};
      for (const c of clicks) {
        const src = c.source_site || "Onbekend";
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      }

      return {
        totalViews: pageViews.length,
        uniqueSessions,
        totalClicks: clicks.length,
        topPages: topPages24h,
        hourlyChart,
        clicks,
        sourceCounts: Object.entries(sourceCounts).map(([name, value]) => ({ name, value })),
      };
    },
    refetchInterval: 30000,
  });

  // Active pages (last 5 min)
  const activePages = useMemo(() => {
    if (!liveVisitors?.sessions) return [];
    const counts: Record<string, number> = {};
    for (const s of Object.values(liveVisitors.sessions)) {
      const latestPage = s.pages[0];
      counts[latestPage] = (counts[latestPage] || 0) + 1;
    }
    return Object.entries(counts).map(([url, count]) => ({ url, count })).sort((a, b) => b.count - a.count);
  }, [liveVisitors]);

  // Fetch indexing log
  const { data: indexingLog, isLoading: logLoading } = useQuery({
    queryKey: ["google-indexing-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_indexing_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  // Fetch rank tracking data
  const { data: rankData, isLoading: rankLoading, refetch: refetchRank } = useQuery({
    queryKey: ["google-rank-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_rank_tracking")
        .select("*")
        .order("tracked_date", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data;
    },
  });

  // Compute URL summaries
  const urlSummary = useMemo(() => {
    if (!rankData) return [];
    const acc: Record<string, {
      url: string; keywords: Set<string>; latestPosition: number;
      latestDate: string; clicks: number; impressions: number; ctr: number; entries: number;
    }> = {};

    for (const row of rankData) {
      if (!acc[row.tracked_url]) {
        acc[row.tracked_url] = {
          url: row.tracked_url, keywords: new Set(), latestPosition: row.position || 0,
          latestDate: row.tracked_date, clicks: 0, impressions: 0, ctr: 0, entries: 0,
        };
      }
      const item = acc[row.tracked_url];
      item.keywords.add(row.keyword);
      item.clicks += row.clicks || 0;
      item.impressions += row.impressions || 0;
      item.ctr += row.ctr || 0;
      item.entries++;
      if (row.tracked_date > item.latestDate) {
        item.latestPosition = row.position || 0;
        item.latestDate = row.tracked_date;
      }
    }

    return Object.values(acc)
      .map((item) => ({
        ...item,
        keywords: Array.from(item.keywords),
        keywordCount: item.keywords.size,
        avgCtr: item.entries > 0 ? Math.round((item.ctr / item.entries) * 100) / 100 : 0,
      }))
      .filter((item) =>
        searchFilter
          ? item.url.toLowerCase().includes(searchFilter.toLowerCase()) ||
            item.keywords.some((k: string) => k.toLowerCase().includes(searchFilter.toLowerCase()))
          : true
      );
  }, [rankData, searchFilter]);

  // Derived data
  const topPages = useMemo(() =>
    [...urlSummary].filter(u => u.latestPosition > 0 && u.latestPosition <= 10)
      .sort((a, b) => a.latestPosition - b.latestPosition),
    [urlSummary]
  );

  const allByClicks = useMemo(() =>
    [...urlSummary].sort((a, b) => b.clicks - a.clicks),
    [urlSummary]
  );

  const allByImpressions = useMemo(() =>
    [...urlSummary].sort((a, b) => b.impressions - a.impressions),
    [urlSummary]
  );

  const totalClicks = useMemo(() => urlSummary.reduce((s, u) => s + u.clicks, 0), [urlSummary]);
  const totalImpressions = useMemo(() => urlSummary.reduce((s, u) => s + u.impressions, 0), [urlSummary]);
  const indexedCount = useMemo(() => indexingLog?.filter(l => l.status === "submitted").length || 0, [indexingLog]);

  // Chart data for selected URL
  const chartData = useMemo(() => {
    if (!rankData || !selectedUrl) return [];
    return rankData
      .filter((r) => r.tracked_url === selectedUrl && (!selectedKeyword || r.keyword === selectedKeyword))
      .sort((a, b) => a.tracked_date.localeCompare(b.tracked_date))
      .map((r) => ({
        date: r.tracked_date,
        position: r.position,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
      }));
  }, [rankData, selectedUrl, selectedKeyword]);

  const keywordsForUrl = useMemo(() => {
    if (!rankData || !selectedUrl) return [];
    return [...new Set(rankData.filter(r => r.tracked_url === selectedUrl).map(r => r.keyword))];
  }, [rankData, selectedUrl]);

  // Page type distribution for pie chart
  const pageTypeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    for (const item of urlSummary) {
      let type = "Overig";
      if (item.url.includes("/huurwoningen/")) type = "Huurwoningen";
      else if (item.url.includes("/koopwoningen/")) type = "Koopwoningen";
      else if (item.url.includes("/appartementen/")) type = "Appartementen";
      else if (item.url.includes("/kamers/")) type = "Kamers";
      else if (item.url.includes("/woning/")) type = "Woningdetail";
      else if (item.url.includes("/woningen-")) type = "Stadspagina";
      else if (item.url.includes("/blog/")) type = "Blog";
      types[type] = (types[type] || 0) + 1;
    }
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [urlSummary]);

  // Top keywords bar chart
  const topKeywordsChart = useMemo(() => {
    if (!rankData) return [];
    const kwClicks: Record<string, { clicks: number; impressions: number }> = {};
    for (const row of rankData) {
      if (!kwClicks[row.keyword]) kwClicks[row.keyword] = { clicks: 0, impressions: 0 };
      kwClicks[row.keyword].clicks += row.clicks || 0;
      kwClicks[row.keyword].impressions += row.impressions || 0;
    }
    return Object.entries(kwClicks)
      .map(([keyword, data]) => ({ keyword: keyword.length > 25 ? keyword.slice(0, 25) + "…" : keyword, ...data }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 15);
  }, [rankData]);

  const handleFetchConsole = async () => {
    setFetchingConsole(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-search-console");
      if (error) throw error;
      toast.success(`${data.trackedEntries} posities opgehaald van Search Console`);
      refetchRank();
    } catch (err: any) {
      toast.error("Fout bij ophalen: " + (err.message || "Onbekende fout"));
    } finally {
      setFetchingConsole(false);
    }
  };

  const getPositionBadge = (position: number) => {
    if (position <= 3) return <Badge className="bg-green-500 text-white">#{Math.round(position)}</Badge>;
    if (position <= 10) return <Badge className="bg-blue-500 text-white">#{Math.round(position)}</Badge>;
    if (position <= 20) return <Badge variant="secondary">#{Math.round(position)}</Badge>;
    return <Badge variant="outline">#{Math.round(position)}</Badge>;
  };

  const openDetail = (url: string) => {
    setSelectedUrl(url);
    setSelectedKeyword(null);
    setViewMode("detail");
  };

  const goBack = () => {
    setViewMode("overview");
    setSelectedUrl(null);
    setSelectedKeyword(null);
  };

  const chartConfig = {
    position: { label: "Positie", color: "hsl(var(--primary))" },
    clicks: { label: "Klikken", color: "hsl(142, 76%, 36%)" },
    impressions: { label: "Impressies", color: "hsl(217, 91%, 60%)" },
    ctr: { label: "CTR %", color: "hsl(38, 92%, 50%)" },
  };

  const renderUrlTable = (data: typeof urlSummary, sortLabel: string) => (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{sortLabel}</CardTitle>
            <CardDescription>{data.length} pagina's</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Terug
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4 w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Zoek..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-9" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pagina</TableHead>
                <TableHead className="text-center">Positie</TableHead>
                <TableHead className="text-center">Klikken</TableHead>
                <TableHead className="text-center">Impressies</TableHead>
                <TableHead className="text-center">CTR</TableHead>
                <TableHead className="text-center">Zoekwoorden</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 100).map((item) => (
                <TableRow key={item.url} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(item.url)}>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm font-medium">{item.url.replace("https://www.woonpeek.nl", "")}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.keywords.slice(0, 2).join(", ")}{item.keywordCount > 2 && ` +${item.keywordCount - 2}`}</p>
                  </TableCell>
                  <TableCell className="text-center">{getPositionBadge(item.latestPosition)}</TableCell>
                  <TableCell className="text-center font-medium">{item.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{item.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{item.avgCtr}%</TableCell>
                  <TableCell className="text-center">{item.keywordCount}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm"><BarChart3 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  // Detail view for a specific URL
  const renderDetailView = () => {
    if (!selectedUrl) return null;
    const urlData = urlSummary.find(u => u.url === selectedUrl);
    if (!urlData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="mr-2 h-4 w-4" /> Terug</Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{selectedUrl.replace("https://www.woonpeek.nl", "")}</h2>
            <a href={selectedUrl} target="_blank" rel="noopener" className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Open in browser
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Positie</p>
              <p className="text-2xl font-bold">#{Math.round(urlData.latestPosition)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Klikken</p>
              <p className="text-2xl font-bold">{urlData.clicks.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Impressies</p>
              <p className="text-2xl font-bold">{urlData.impressions.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">CTR</p>
              <p className="text-2xl font-bold">{urlData.avgCtr}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Zoekwoorden</p>
              <p className="text-2xl font-bold">{urlData.keywordCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Keyword filter */}
        <div className="flex gap-2">
          <Select value={selectedKeyword || "all"} onValueChange={(v) => setSelectedKeyword(v === "all" ? null : v)}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Alle zoekwoorden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle zoekwoorden ({keywordsForUrl.length})</SelectItem>
              {keywordsForUrl.map((kw) => (
                <SelectItem key={kw} value={kw}>{kw}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Position chart */}
        {chartData.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Positie verloop</CardTitle>
                <CardDescription>Lager = beter (positie 1 is bovenaan Google)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis reversed domain={[1, "auto"]} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="position" stroke="var(--color-position)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Klikken & Impressies</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CTR %</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="ctr" stroke="var(--color-ctr)" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Keywords table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zoekwoorden voor deze pagina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zoekwoord</TableHead>
                    <TableHead className="text-center">Positie</TableHead>
                    <TableHead className="text-center">Klikken</TableHead>
                    <TableHead className="text-center">Impressies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywordsForUrl.map(kw => {
                    const kwData = rankData?.filter(r => r.tracked_url === selectedUrl && r.keyword === kw) || [];
                    const latest = kwData.sort((a, b) => b.tracked_date.localeCompare(a.tracked_date))[0];
                    const totalClicks = kwData.reduce((s, r) => s + (r.clicks || 0), 0);
                    const totalImpr = kwData.reduce((s, r) => s + (r.impressions || 0), 0);
                    return (
                      <TableRow
                        key={kw}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedKeyword(kw === selectedKeyword ? null : kw)}
                      >
                        <TableCell className="font-medium">
                          {kw}
                          {selectedKeyword === kw && <Badge className="ml-2 bg-primary/10 text-primary">Actief</Badge>}
                        </TableCell>
                        <TableCell className="text-center">{getPositionBadge(latest?.position || 0)}</TableCell>
                        <TableCell className="text-center">{totalClicks}</TableCell>
                        <TableCell className="text-center">{totalImpr}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Indexed URLs view
  const renderIndexedView = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="mr-2 h-4 w-4" /> Terug</Button>
        <div>
          <h2 className="text-lg font-bold">Geïndexeerde URLs</h2>
          <p className="text-sm text-muted-foreground">{indexedCount} URLs naar Google gestuurd</p>
        </div>
      </div>

      {/* Stats by type */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Woningen</p>
            <p className="text-2xl font-bold">{indexingLog?.filter(l => l.url_type === "property" && l.status === "submitted").length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Stadspagina's</p>
            <p className="text-2xl font-bold">{indexingLog?.filter(l => l.url_type === "city" && l.status === "submitted").length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Fouten</p>
            <p className="text-2xl font-bold text-destructive">{indexingLog?.filter(l => l.status === "error").length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Indexering Log</CardTitle></CardHeader>
        <CardContent>
          {logLoading ? (
            <p className="text-muted-foreground">Laden...</p>
          ) : !indexingLog?.length ? (
            <div className="py-8 text-center text-muted-foreground">
              <Globe className="mx-auto mb-2 h-8 w-8" />
              <p>Nog geen URLs naar Google gestuurd.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indexingLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm">{log.url.replace("https://www.woonpeek.nl", "")}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline">{log.url_type}</Badge></TableCell>
                      <TableCell>
                        <Badge className={log.status === "submitted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.response_status || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "dd MMM HH:mm", { locale: nl })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Clickable Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
          onClick={() => setViewMode("indexed")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">URLs Geïndexeerd</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indexedCount}</div>
            <p className="text-xs text-muted-foreground">naar Google gestuurd →</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
          onClick={() => setViewMode("top-pages")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top 10 Pagina's</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPages.length}</div>
            <p className="text-xs text-muted-foreground">in de top 10 →</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
          onClick={() => setViewMode("all-clicks")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totaal Klikken</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">vanuit Google →</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
          onClick={() => setViewMode("impressions")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totaal Impressies</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">gezien in Google →</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Zoekwoorden (klikken)</CardTitle>
          </CardHeader>
          <CardContent>
            {topKeywordsChart.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={topKeywordsChart} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="keyword" type="category" width={140} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="clicks" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nog geen data</p>
            )}
          </CardContent>
        </Card>

        {/* Page Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verdeling pagina-types</CardTitle>
          </CardHeader>
          <CardContent>
            {pageTypeDistribution.length > 0 ? (
              <div className="flex items-center gap-4">
                <ChartContainer config={chartConfig} className="h-[250px] w-[250px]">
                  <PieChart>
                    <Pie data={pageTypeDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {pageTypeDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2">
                  {pageTypeDistribution.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nog geen data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick table: Top movers */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Alle Getrackte Pagina's</CardTitle>
              <CardDescription>{urlSummary.length} pagina's met positiedata</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Zoek op URL of zoekwoord..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rankLoading ? (
            <p className="text-muted-foreground">Laden...</p>
          ) : urlSummary.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <BarChart3 className="mx-auto mb-2 h-8 w-8" />
              <p>Nog geen rankingdata. Klik op "Search Console ophalen".</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pagina</TableHead>
                    <TableHead className="text-center">Positie</TableHead>
                    <TableHead className="text-center">Klikken</TableHead>
                    <TableHead className="text-center">Impressies</TableHead>
                    <TableHead className="text-center">CTR</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...urlSummary].sort((a, b) => b.impressions - a.impressions).slice(0, 50).map((item) => (
                    <TableRow key={item.url} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(item.url)}>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm font-medium">{item.url.replace("https://www.woonpeek.nl", "")}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.keywords.slice(0, 2).join(", ")}</p>
                      </TableCell>
                      <TableCell className="text-center">{getPositionBadge(item.latestPosition)}</TableCell>
                      <TableCell className="text-center font-medium">{item.clicks}</TableCell>
                      <TableCell className="text-center">{item.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{item.avgCtr}%</TableCell>
                      <TableCell><Button variant="ghost" size="sm"><BarChart3 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const liveChartConfig = {
    views: { label: "Pageviews", color: "hsl(217, 91%, 60%)" },
    clicks: { label: "Affiliate klikken", color: "hsl(142, 76%, 36%)" },
  };

  const renderLiveView = () => (
    <div className="space-y-6">
      {/* Live stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nu Online</CardTitle>
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{liveVisitors?.count || 0}</div>
            <p className="text-xs text-muted-foreground">bezoekers (laatste 5 min)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pageviews 24u</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats24h?.totalViews?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">{stats24h?.uniqueSessions || 0} unieke sessies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Klikken 24u</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats24h?.totalClicks || 0}</div>
            <p className="text-xs text-muted-foreground">doorkliks naar aanbieders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversieratio</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats24h?.totalViews && stats24h.totalClicks
                ? ((stats24h.totalClicks / stats24h.totalViews) * 100).toFixed(2) + "%"
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">klikken / pageviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Active pages */}
      {activePages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              Live Actieve Pagina's
            </CardTitle>
            <CardDescription>{liveVisitors?.count || 0} bezoekers op {activePages.length} pagina's</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activePages.slice(0, 15).map((p) => (
                <div key={p.url} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm truncate max-w-md">{p.url}</span>
                  <Badge variant="secondary">{p.count} {p.count === 1 ? "bezoeker" : "bezoekers"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hourly chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Traffic per uur (24u)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats24h?.hourlyChart?.length ? (
            <ChartContainer config={liveChartConfig} className="h-[280px] w-full">
              <AreaChart data={stats24h.hourlyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="views" stroke="var(--color-views)" fill="var(--color-views)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="clicks" stroke="var(--color-clicks)" fill="var(--color-clicks)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="py-8 text-center text-muted-foreground">Nog geen data beschikbaar</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top pages 24h */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meest Bezochte Pagina's (24u)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats24h?.topPages?.length ? (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pagina</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats24h.topPages.map((p) => (
                      <TableRow key={p.url}>
                        <TableCell className="max-w-xs truncate text-sm">{p.url}</TableCell>
                        <TableCell className="text-right font-medium">{p.views}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">Nog geen data</p>
            )}
          </CardContent>
        </Card>

        {/* Daisycon clicks by source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Affiliate Klikken per Bron (24u)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats24h?.sourceCounts?.length ? (
              <div className="space-y-3">
                {stats24h.sourceCounts.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm">{s.name}</span>
                    </div>
                    <span className="font-medium">{s.value} klikken</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">Nog geen affiliate klikken</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent clicks table */}
      {stats24h?.clicks?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recente Affiliate Klikken</CardTitle>
            <CardDescription>Laatste 24 uur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bron</TableHead>
                    <TableHead>Pagina</TableHead>
                    <TableHead>Tijd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats24h.clicks.slice(0, 50).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell><Badge variant="outline">{c.source_site || "Onbekend"}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{c.page_url}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(c.created_at), "HH:mm", { locale: nl })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Google Ranking & Traffic</h1>
            <p className="text-muted-foreground">Volg je posities, bezoekers en affiliate klikken</p>
          </div>
          <div className="flex gap-2">
            {mainTab === "ranking" && (
              <Button onClick={handleFetchConsole} disabled={fetchingConsole}>
                <RefreshCw className={`mr-2 h-4 w-4 ${fetchingConsole ? "animate-spin" : ""}`} />
                Search Console ophalen
              </Button>
            )}
          </div>
        </div>

        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
          <TabsList>
            <TabsTrigger value="ranking" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Ranking
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-2">
              <Activity className="h-4 w-4" /> Live & Traffic
              {(liveVisitors?.count || 0) > 0 && (
                <Badge className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0">{liveVisitors?.count}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="mt-4">
            {viewMode === "overview" && renderOverview()}
            {viewMode === "top-pages" && renderUrlTable(topPages, "Top 10 Pagina's in Google")}
            {viewMode === "all-clicks" && renderUrlTable(allByClicks, "Pagina's gesorteerd op Klikken")}
            {viewMode === "impressions" && renderUrlTable(allByImpressions, "Pagina's gesorteerd op Impressies")}
            {viewMode === "indexed" && renderIndexedView()}
            {viewMode === "detail" && renderDetailView()}
          </TabsContent>

          <TabsContent value="live" className="mt-4">
            {renderLiveView()}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminGoogleRanking;
