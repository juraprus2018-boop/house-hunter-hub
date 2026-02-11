import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScrapers, useAllProperties, useScrapedProperties } from "@/hooks/useAdmin";
import { Home, Activity, Users, TrendingUp, Loader2, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const { data: scrapers, isLoading: scrapersLoading } = useScrapers();
  const { data: properties, isLoading: propertiesLoading } = useAllProperties();
  const { data: scrapedProperties } = useScrapedProperties("pending");

  const activeScrapers = scrapers?.filter((s) => s.is_active).length || 0;
  const totalProperties = properties?.length || 0;
  const activeProperties = properties?.filter((p) => p.status === "actief").length || 0;
  const pendingReviews = scrapedProperties?.length || 0;

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
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
