import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Loader2, Search, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminSearchQueries = () => {
  const { data: queries = [], isLoading } = useQuery({
    queryKey: ["admin-search-queries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_queries" as any)
        .select("*")
        .order("count", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Populaire Zoekopdrachten</h1>
          <p className="text-sm text-muted-foreground">
            Bekijk wat bezoekers zoeken om nieuwe landingspagina's te maken
          </p>
        </div>

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
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b px-5 py-3 text-xs font-medium text-muted-foreground uppercase">
              <span>Zoekopdracht</span>
              <span>Aantal</span>
              <span>Filters</span>
            </div>
            {queries.map((q: any) => (
              <div key={q.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center border-b last:border-0 px-5 py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">{q.query || q.city || "Leeg"}</span>
                </div>
                <Badge variant="secondary">{q.count}×</Badge>
                <div className="flex gap-1 flex-wrap">
                  {q.city && <Badge variant="outline" className="text-xs">{q.city}</Badge>}
                  {q.listing_type && <Badge variant="outline" className="text-xs">{q.listing_type}</Badge>}
                  {q.property_type && <Badge variant="outline" className="text-xs">{q.property_type}</Badge>}
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
