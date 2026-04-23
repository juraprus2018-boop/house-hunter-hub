import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, RefreshCw, Star } from "lucide-react";

const palettes = [
  { bg: "bg-sky-soft", icon: "text-sky", iconBg: "bg-sky/15" },
  { bg: "bg-surface-mint", icon: "text-primary", iconBg: "bg-primary/15" },
  { bg: "bg-terracotta-soft", icon: "text-terracotta", iconBg: "bg-terracotta/15" },
  { bg: "bg-amber-soft", icon: "text-amber", iconBg: "bg-amber/20" },
];

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
    <section className="border-y bg-gradient-to-br from-surface-cream via-background to-surface-sky py-8">
      <div className="container">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((item, i) => {
            const p = palettes[i % palettes.length];
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-2xl border ${p.bg} p-4 shadow-sm transition-transform hover:-translate-y-0.5`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${p.iconBg}`}>
                  <item.icon className={`h-5 w-5 ${p.icon}`} />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none text-foreground">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustStats;
