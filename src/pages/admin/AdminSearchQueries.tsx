import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Loader2, Search, TrendingUp, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cityToSlug } from "@/lib/cities";
import { useState } from "react";

// Maps a search query row to the best matching landing page URL (if one exists)
const getLandingPageUrl = (q: any): string | null => {
  const city = q.city?.trim();
  const listingType = q.listing_type?.trim();
  const propertyType = q.property_type?.trim();
  const maxPrice = q.max_price;
  const minBedrooms = q.min_bedrooms;

  if (!city) return null;

  const citySlug = cityToSlug(city);

  // Most specific first: price/bedroom filter pages
  if (maxPrice && maxPrice > 0) {
    return `/woningen/${citySlug}/onder-${Math.round(maxPrice)}`;
  }
  if (minBedrooms && minBedrooms > 0) {
    return `/woningen/${citySlug}/${minBedrooms}-kamers`;
  }

  // Property type + city pages
  if (propertyType) {
    const typeMap: Record<string, string> = {
      appartement: "appartementen",
      huis: "huizen",
      studio: "studios",
      kamer: "kamers",
    };
    const typePath = typeMap[propertyType.toLowerCase()];
    if (typePath) {
      return `/${typePath}/${citySlug}`;
    }
  }

  // Listing type + city pages
  if (listingType) {
    const ltMap: Record<string, string> = {
      huur: "huurwoningen",
      koop: "koopwoningen",
    };
    const ltPath = ltMap[listingType.toLowerCase()];
    if (ltPath) {
      return `/${ltPath}/${citySlug}`;
    }
  }

  // Generic city page
  return `/woningen-${citySlug}`;
};

type FilterType = "all" | "has-page" | "no-page";

const AdminSearchQueries = () => {
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: queries = [], isLoading } = useQuery({
    queryKey: ["admin-search-queries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_queries")
        .select("*")
        .order("count", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const enriched = queries.map((q: any) => ({
    ...q,
    landingUrl: getLandingPageUrl(q),
  }));

  const filtered = enriched.filter((q) => {
    if (filter === "has-page") return q.landingUrl !== null;
    if (filter === "no-page") return q.landingUrl === null;
    return true;
  });

  const stats = {
    total: enriched.length,
    withPage: enriched.filter((q) => q.landingUrl !== null).length,
    withoutPage: enriched.filter((q) => q.landingUrl === null).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Populaire Zoekopdrachten</h1>
          <p className="text-sm text-muted-foreground">
            Bekijk wat bezoekers zoeken en ontdek SEO-kansen voor nieuwe landingspagina's
          </p>
        </div>

        {/* Stats cards */}
        {!isLoading && queries.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl border p-4 text-left transition-colors ${filter === "all" ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"}`}
            >
              <p className="text-sm text-muted-foreground">Totaal</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </button>
            <button
              onClick={() => setFilter("has-page")}
              className={`rounded-xl border p-4 text-left transition-colors ${filter === "has-page" ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"}`}
            >
              <p className="text-sm text-muted-foreground">Met landingspagina</p>
              <p className="text-2xl font-bold text-green-600">{stats.withPage}</p>
            </button>
            <button
              onClick={() => setFilter("no-page")}
              className={`rounded-xl border p-4 text-left transition-colors ${filter === "no-page" ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"}`}
            >
              <p className="text-sm text-muted-foreground">Zonder pagina (kansen!)</p>
              <p className="text-2xl font-bold text-orange-500">{stats.withoutPage}</p>
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : queries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Nog geen zoekdata</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Zoekgegevens worden automatisch verzameld wanneer bezoekers de zoekfunctie gebruiken.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-5 py-3 text-xs font-medium text-muted-foreground uppercase">
              <span>Zoekopdracht</span>
              <span>Aantal</span>
              <span>Filters</span>
              <span>Landingspagina</span>
            </div>
            {filtered.map((q: any) => (
              <div
                key={q.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center border-b last:border-0 px-5 py-3"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {q.query || q.city || "Leeg"}
                  </span>
                </div>
                <Badge variant="secondary">{q.count}×</Badge>
                <div className="flex gap-1 flex-wrap">
                  {q.city && <Badge variant="outline" className="text-xs">{q.city}</Badge>}
                  {q.listing_type && <Badge variant="outline" className="text-xs">{q.listing_type}</Badge>}
                  {q.property_type && <Badge variant="outline" className="text-xs">{q.property_type}</Badge>}
                  {q.max_price && <Badge variant="outline" className="text-xs">≤€{q.max_price}</Badge>}
                  {q.min_bedrooms && <Badge variant="outline" className="text-xs">{q.min_bedrooms}+ kamers</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {q.landingUrl ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      <a
                        href={q.landingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate max-w-[200px] inline-flex items-center gap-1"
                      >
                        {q.landingUrl}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-orange-400 shrink-0" />
                      <span className="text-xs text-muted-foreground">Geen match</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSearchQueries;
