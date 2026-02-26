import { useState, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Loader2, ChevronLeft, ChevronRight, Plus, Minus, ExternalLink, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const DAYS_TO_SHOW = 7;

const AdminDailyActivity = () => {
  const [offset, setOffset] = useState(0); // 0 = today, 1 = yesterday, etc.

  // Fetch properties created in the selected range
  const rangeStart = startOfDay(subDays(new Date(), offset + DAYS_TO_SHOW - 1));
  const rangeEnd = endOfDay(subDays(new Date(), offset));

  const { data: addedProperties, isLoading: addedLoading } = useQuery({
    queryKey: ["daily-added", rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, city, source_site, created_at, status, slug, price, property_type")
        .gte("created_at", rangeStart.toISOString())
        .lte("created_at", rangeEnd.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: deactivatedProperties, isLoading: deactivatedLoading } = useQuery({
    queryKey: ["daily-deactivated", rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, city, source_site, updated_at, status, slug, price, property_type")
        .in("status", ["inactief", "verhuurd", "verkocht"])
        .gte("updated_at", rangeStart.toISOString())
        .lte("updated_at", rangeEnd.toISOString())
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Group by day
  const days = useMemo(() => {
    const result: {
      date: Date;
      dateStr: string;
      added: typeof addedProperties;
      deactivated: typeof deactivatedProperties;
    }[] = [];

    for (let i = offset; i < offset + DAYS_TO_SHOW; i++) {
      const day = subDays(new Date(), i);
      const dayStr = format(day, "yyyy-MM-dd");

      const dayAdded = addedProperties?.filter(
        (p) => format(new Date(p.created_at), "yyyy-MM-dd") === dayStr
      ) || [];

      const dayDeactivated = deactivatedProperties?.filter(
        (p) => format(new Date(p.updated_at), "yyyy-MM-dd") === dayStr
      ) || [];

      result.push({
        date: day,
        dateStr: dayStr,
        added: dayAdded,
        deactivated: dayDeactivated,
      });
    }

    return result;
  }, [addedProperties, deactivatedProperties, offset]);

  const isLoading = addedLoading || deactivatedLoading;

  // Group properties by source
  const groupBySource = (properties: { source_site: string | null }[]) => {
    const map = new Map<string, typeof properties>();
    properties.forEach((p) => {
      const src = p.source_site || "Handmatig";
      if (!map.has(src)) map.set(src, []);
      map.get(src)!.push(p);
    });
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Dagoverzicht
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dagelijks overzicht van bijgekomen en inactief geworden woningen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOffset((o) => o + DAYS_TO_SHOW)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(0)}
              disabled={offset === 0}
              className="gap-1"
            >
              <Calendar className="h-3.5 w-3.5" />
              Vandaag
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOffset((o) => Math.max(0, o - DAYS_TO_SHOW))}
              disabled={offset === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((day) => {
              const addedCount = day.added?.length || 0;
              const deactivatedCount = day.deactivated?.length || 0;
              const isToday = day.dateStr === format(new Date(), "yyyy-MM-dd");

              if (addedCount === 0 && deactivatedCount === 0) {
                return (
                  <Card key={day.dateStr} className="opacity-60">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-base">
                        <span className="font-display">
                          {isToday
                            ? "Vandaag"
                            : format(day.date, "EEEE d MMMM", { locale: nl })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Geen activiteit
                        </span>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                );
              }

              const addedBySource = groupBySource(day.added || []);
              const deactivatedBySource = groupBySource(day.deactivated || []);

              return (
                <Card key={day.dateStr}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <span className="font-display capitalize">
                        {isToday
                          ? "Vandaag"
                          : format(day.date, "EEEE d MMMM", { locale: nl })}
                      </span>
                      <div className="flex gap-2">
                        {addedCount > 0 && (
                          <Badge variant="default" className="gap-1">
                            <Plus className="h-3 w-3" />
                            {addedCount}
                          </Badge>
                        )}
                        {deactivatedCount > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <Minus className="h-3 w-3" />
                            {deactivatedCount}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Added */}
                    {addedCount > 0 && (
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                          <Plus className="h-4 w-4" />
                          Bijgekomen ({addedCount})
                        </h3>
                        <div className="space-y-3">
                          {addedBySource.map(([source, props]) => (
                            <SourceGroup
                              key={source}
                              source={source}
                              properties={props as PropertyItem[]}
                              variant="added"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deactivated */}
                    {deactivatedCount > 0 && (
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                          <Minus className="h-4 w-4" />
                          Inactief geworden ({deactivatedCount})
                        </h3>
                        <div className="space-y-3">
                          {deactivatedBySource.map(([source, props]) => (
                            <SourceGroup
                              key={source}
                              source={source}
                              properties={props as PropertyItem[]}
                              variant="deactivated"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

interface PropertyItem {
  id: string;
  title: string;
  city: string;
  source_site: string | null;
  slug: string | null;
  price: number;
  status: string;
  property_type: string;
  created_at?: string;
  updated_at?: string;
}

const SourceGroup = ({
  source,
  properties,
  variant,
}: {
  source: string;
  properties: PropertyItem[];
  variant: "added" | "deactivated";
}) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? properties : properties.slice(0, 3);
  const hasMore = properties.length > 3;

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium capitalize">{source}</span>
        <Badge variant="outline" className="text-xs">
          {properties.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {shown.map((p) => (
          <Link
            key={p.id}
            to={`/woning/${p.slug || p.id}`}
            className={cn(
              "flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted",
              variant === "deactivated" && "opacity-75"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{p.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{p.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                €{p.price?.toLocaleString("nl-NL")}
              </span>
              {variant === "deactivated" && (
                <Badge variant="secondary" className="text-[10px]">
                  {p.status}
                </Badge>
              )}
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 w-full text-xs"
        >
          {expanded ? "Minder tonen" : `+${properties.length - 3} meer tonen`}
        </Button>
      )}
    </div>
  );
};

export default AdminDailyActivity;
