import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, RefreshCw, Star } from "lucide-react";

const TrustStats = () => {
  const { data } = useQuery({
    queryKey: ["trust-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [activeRes, citiesRes, todayRes] = await Promise.all([
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", "actief"),
        supabase
          .from("properties")
          .select("city")
          .eq("status", "actief")
          .not("city", "is", null),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today.toISOString()),
      ]);

      const uniqueCities = new Set(
        (citiesRes.data ?? [])
          .map((r) => r.city?.trim())
          .filter((c): c is string => Boolean(c))
      );

      return {
        active: activeRes.count ?? 0,
        cities: uniqueCities.size,
        today: todayRes.count ?? 0,
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const items = [
    {
      icon: Building2,
      value: data ? `${data.active.toLocaleString("nl-NL")}+` : "...",
      label: "Actieve woningen",
    },
    {
      icon: MapPin,
      value: data ? `${data.cities}` : "...",
      label: "Steden in Nederland",
    },
    {
      icon: RefreshCw,
      value: data ? `${data.today}` : "...",
      label: "Nieuw vandaag",
    },
    {
      icon: Star,
      value: "4.7/5",
      label: "Door zoekers beoordeeld",
    },
  ];

  return (
    <section className="border-y bg-surface-cream py-10">
      <div className="container">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none text-foreground">{item.value}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStats;
