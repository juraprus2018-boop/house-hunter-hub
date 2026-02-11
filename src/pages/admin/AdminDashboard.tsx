import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrapers, useAllProperties, useScrapedProperties, useScraperLogs } from "@/hooks/useAdmin";
import { Home, Activity, Users, Loader2, ClipboardCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const AdminDashboard = () => {
  const { data: scrapers, isLoading: scrapersLoading } = useScrapers();
  const { data: properties, isLoading: propertiesLoading } = useAllProperties();
  const { data: scrapedProperties } = useScrapedProperties("pending");
  const { data: allLogs } = useScraperLogs();

  const activeScrapers = scrapers?.filter((s) => s.is_active).length || 0;
  const totalProperties = properties?.length || 0;
  const activeProperties = properties?.filter((p) => p.status === "actief").length || 0;
  const pendingReviews = scrapedProperties?.length || 0;

  // Last scrape run info
  const lastLog = allLogs?.[0];
  const lastSuccessLog = allLogs?.find((l) => l.status === "success");
  const totalScrapedToday = allLogs
    ?.filter((l) => {
      const logDate = new Date(l.created_at);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    })
    .reduce((sum, l) => sum + (l.properties_scraped || 0), 0) || 0;
  const recentLogs = allLogs?.slice(0, 8) || [];

  const stats = [
    {
      title: "Totaal Woningen",
      value: totalProperties,
      icon: Home,
      description: `${activeProperties} actief`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Actieve Scrapers",
      value: activeScrapers,
      icon: Activity,
      description: `van ${scrapers?.length || 0} totaal`,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Bezoekers Vandaag",
      value: "-",
      icon: Users,
      description: "Binnenkort beschikbaar",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Review Queue",
      value: pendingReviews,
      icon: ClipboardCheck,
      description: pendingReviews > 0 ? `${pendingReviews} wachten op review` : "Geen openstaande reviews",
      color: pendingReviews > 0 ? "text-amber-600" : "text-green-600",
      bgColor: pendingReviews > 0 ? "bg-amber-100" : "bg-green-100",
      link: "/admin/review",
    },
  ];

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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welkom bij het admin dashboard. Beheer woningen en scrapers.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const cardContent = (
              <Card key={stat.title} className={stat.link ? "cursor-pointer transition-shadow hover:shadow-md" : ""}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
            return stat.link ? (
              <Link key={stat.title} to={stat.link}>{cardContent}</Link>
            ) : (
              <div key={stat.title}>{cardContent}</div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Properties */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recente Woningen</CardTitle>
              <Link to="/admin/woningen">
                <Button variant="ghost" size="sm">
                  Bekijk alle
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {properties && properties.length > 0 ? (
                <div className="space-y-3">
                  {properties.slice(0, 5).map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{property.title}</p>
                        <p className="text-sm text-muted-foreground">{property.city}</p>
                      </div>
                      <Badge variant={property.status === "actief" ? "default" : "secondary"}>
                        {property.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nog geen woningen
                </p>
              )}
            </CardContent>
          </Card>

          {/* Scrapers Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Scraper Status</CardTitle>
              <Link to="/admin/scrapers">
                <Button variant="ghost" size="sm">
                  Beheer scrapers
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {scrapers && scrapers.length > 0 ? (
                <div className="space-y-3">
                  {scrapers.slice(0, 5).map((scraper) => (
                    <div
                      key={scraper.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{scraper.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {scraper.website_url}
                        </p>
                      </div>
                      <Badge variant={scraper.is_active ? "default" : "secondary"}>
                        {scraper.is_active ? "Actief" : "Inactief"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Geen scrapers gevonden
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Last Scrape Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Laatste Automatische Scrape
            </CardTitle>
            {lastLog && (
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(lastLog.created_at), { addSuffix: true, locale: nl })}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {lastLog ? (
              <div className="space-y-4">
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{totalScrapedToday}</p>
                    <p className="text-xs text-muted-foreground">Gescraped vandaag</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{properties?.filter(p => p.status === "actief").length || 0}</p>
                    <p className="text-xs text-muted-foreground">Actieve woningen</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{properties?.filter(p => p.status === "inactief").length || 0}</p>
                    <p className="text-xs text-muted-foreground">Gedeactiveerd</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">
                      {lastSuccessLog
                        ? format(new Date(lastSuccessLog.created_at), "HH:mm", { locale: nl })
                        : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Laatste succesvolle run</p>
                  </div>
                </div>

                {/* Recent log entries */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Recente runs</h4>
                  <div className="space-y-2">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          {log.status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">{log.message || log.status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {log.properties_scraped ? (
                            <Badge variant="secondary">{log.properties_scraped} woningen</Badge>
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "dd MMM HH:mm", { locale: nl })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                Nog geen scrape-runs uitgevoerd
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
