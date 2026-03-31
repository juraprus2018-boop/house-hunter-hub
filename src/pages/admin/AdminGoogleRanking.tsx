import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Search, TrendingUp, TrendingDown, Minus, Globe, RefreshCw, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

const AdminGoogleRanking = () => {
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [fetchingConsole, setFetchingConsole] = useState(false);

  // Fetch indexing log
  const { data: indexingLog, isLoading: logLoading } = useQuery({
    queryKey: ["google-indexing-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_indexing_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
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

  // Get unique tracked URLs with their latest position
  const urlSummary = rankData
    ? Object.values(
        rankData.reduce((acc: Record<string, { url: string; keywords: Set<string>; latestPosition: number; latestDate: string; clicks: number; impressions: number }>, row) => {
          if (!acc[row.tracked_url]) {
            acc[row.tracked_url] = {
              url: row.tracked_url,
              keywords: new Set(),
              latestPosition: row.position || 0,
              latestDate: row.tracked_date,
              clicks: 0,
              impressions: 0,
            };
          }
          acc[row.tracked_url].keywords.add(row.keyword);
          acc[row.tracked_url].clicks += row.clicks || 0;
          acc[row.tracked_url].impressions += row.impressions || 0;
          if (row.tracked_date > acc[row.tracked_url].latestDate) {
            acc[row.tracked_url].latestPosition = row.position || 0;
            acc[row.tracked_url].latestDate = row.tracked_date;
          }
          return acc;
        }, {})
      )
        .map((item) => ({
          ...item,
          keywords: Array.from(item.keywords),
          keywordCount: item.keywords.size,
        }))
        .filter((item) =>
          searchFilter
            ? item.url.toLowerCase().includes(searchFilter.toLowerCase()) ||
              item.keywords.some((k: string) => k.toLowerCase().includes(searchFilter.toLowerCase()))
            : true
        )
        .sort((a, b) => b.impressions - a.impressions)
    : [];

  // Get chart data for selected URL + keyword
  const chartData = rankData && selectedUrl
    ? rankData
        .filter((r) => r.tracked_url === selectedUrl && (!selectedKeyword || r.keyword === selectedKeyword))
        .sort((a, b) => a.tracked_date.localeCompare(b.tracked_date))
        .map((r) => ({
          date: r.tracked_date,
          position: r.position,
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
        }))
    : [];

  // Keywords for selected URL
  const keywordsForUrl = rankData && selectedUrl
    ? [...new Set(rankData.filter((r) => r.tracked_url === selectedUrl).map((r) => r.keyword))]
    : [];

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

  const getTrendIcon = (data: typeof chartData) => {
    if (data.length < 2) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const latest = data[data.length - 1].position || 0;
    const previous = data[data.length - 2].position || 0;
    if (latest < previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (latest > previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const chartConfig = {
    position: { label: "Positie", color: "hsl(var(--primary))" },
    clicks: { label: "Klikken", color: "hsl(142, 76%, 36%)" },
    impressions: { label: "Impressies", color: "hsl(217, 91%, 60%)" },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Google Ranking & Indexering</h1>
            <p className="text-muted-foreground">Volg je Google-posities en indexeringsstatus</p>
          </div>
          <Button onClick={handleFetchConsole} disabled={fetchingConsole}>
            <RefreshCw className={`mr-2 h-4 w-4 ${fetchingConsole ? "animate-spin" : ""}`} />
            Search Console ophalen
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">URLs Geïndexeerd</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {indexingLog?.filter((l) => l.status === "submitted").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">naar Google gestuurd</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Getrackte Pagina's</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urlSummary.length}</div>
              <p className="text-xs text-muted-foreground">met positiedata</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Top 10 Pagina's</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {urlSummary.filter((u) => u.latestPosition > 0 && u.latestPosition <= 10).length}
              </div>
              <p className="text-xs text-muted-foreground">in de top 10</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Totaal Klikken</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {urlSummary.reduce((sum, u) => sum + u.clicks, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">vanuit Google</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ranking" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ranking">Ranking Tracker</TabsTrigger>
            <TabsTrigger value="indexing">Indexering Log</TabsTrigger>
          </TabsList>

          {/* Ranking Tracker Tab */}
          <TabsContent value="ranking" className="space-y-4">
            {/* Chart */}
            {selectedUrl && chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Positie verloop {getTrendIcon(chartData)}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground truncate max-w-lg">
                        {selectedUrl.replace("https://www.woonpeek.nl", "")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Select value={selectedKeyword || "all"} onValueChange={(v) => setSelectedKeyword(v === "all" ? null : v)}>
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Alle zoekwoorden" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle zoekwoorden</SelectItem>
                          {keywordsForUrl.map((kw) => (
                            <SelectItem key={kw} value={kw}>{kw}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedUrl(null); setSelectedKeyword(null); }}>
                        ✕
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis reversed domain={[1, "auto"]} tick={{ fontSize: 11 }} label={{ value: "Positie", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="position" stroke="var(--color-position)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>

                  {/* Secondary chart: clicks & impressions */}
                  <div className="mt-4">
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="impressions" stroke="var(--color-impressions)" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* URL List */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Getrackte Pagina's</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Zoek op URL of zoekwoord..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rankLoading ? (
                  <p className="text-muted-foreground">Laden...</p>
                ) : urlSummary.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <BarChart3 className="mx-auto mb-2 h-8 w-8" />
                    <p>Nog geen rankingdata. Klik op "Search Console ophalen" om te starten.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pagina</TableHead>
                          <TableHead className="text-center">Positie</TableHead>
                          <TableHead className="text-center">Zoekwoorden</TableHead>
                          <TableHead className="text-center">Klikken</TableHead>
                          <TableHead className="text-center">Impressies</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {urlSummary.slice(0, 50).map((item) => (
                          <TableRow
                            key={item.url}
                            className={`cursor-pointer ${selectedUrl === item.url ? "bg-muted" : ""}`}
                            onClick={() => { setSelectedUrl(item.url); setSelectedKeyword(null); }}
                          >
                            <TableCell className="max-w-xs">
                              <p className="truncate text-sm font-medium">
                                {item.url.replace("https://www.woonpeek.nl", "")}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {item.keywords.slice(0, 3).join(", ")}
                                {item.keywordCount > 3 && ` +${item.keywordCount - 3}`}
                              </p>
                            </TableCell>
                            <TableCell className="text-center">
                              {getPositionBadge(item.latestPosition)}
                            </TableCell>
                            <TableCell className="text-center">{item.keywordCount}</TableCell>
                            <TableCell className="text-center">{item.clicks.toLocaleString()}</TableCell>
                            <TableCell className="text-center">{item.impressions.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedUrl(item.url); setSelectedKeyword(null); }}>
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Indexing Log Tab */}
          <TabsContent value="indexing">
            <Card>
              <CardHeader>
                <CardTitle>Indexering Log</CardTitle>
              </CardHeader>
              <CardContent>
                {logLoading ? (
                  <p className="text-muted-foreground">Laden...</p>
                ) : !indexingLog?.length ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Globe className="mx-auto mb-2 h-8 w-8" />
                    <p>Nog geen URLs naar Google gestuurd. De volgende cron-run logt alles automatisch.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
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
                              <p className="truncate text-sm">
                                {log.url.replace("https://www.woonpeek.nl", "")}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.url_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  log.status === "submitted"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminGoogleRanking;
