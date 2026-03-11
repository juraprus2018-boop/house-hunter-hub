import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHomeStats } from "@/hooks/useHomeStats";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const { data: stats } = useHomeStats();
  const { data: activePropertiesCount } = useQuery({
    queryKey: ["home-active-properties-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "actief");
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("locatie", searchQuery.trim());
    navigate(`/zoeken?${params.toString()}`);
  };

  const totalProperties = activePropertiesCount ?? stats?.properties_count ?? 0;
  const totalCities = stats?.cities_count ?? 0;

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/90" />

      <div className="container relative py-20 md:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          {/* Trust badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
            <MapPin className="h-4 w-4" />
            <span>
              <strong>{totalProperties.toLocaleString("nl-NL")}</strong> woningen in{" "}
              <strong>{totalCities}</strong> steden
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Vind woningen in heel{" "}
            <span className="text-accent">Nederland</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80 md:text-xl">
            Bekijk huurwoningen, appartementen, studio's en koopwoningen in verschillende steden
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-10">
            <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:gap-0">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Zoek op stad, plaatsnaam of woningtype..."
                  className="h-14 rounded-xl border-0 bg-white pl-12 pr-4 text-base shadow-xl placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-accent sm:rounded-r-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 rounded-xl bg-accent px-8 text-base font-semibold text-accent-foreground shadow-xl hover:bg-accent/90 sm:rounded-l-none"
              >
                <Search className="mr-2 h-5 w-5" />
                Bekijk woningen
              </Button>
            </div>
          </form>

          {/* Quick links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/60">Populair:</span>
            {["Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven"].map((city) => (
              <button
                key={city}
                onClick={() => navigate(`/woningen-${city.toLowerCase().replace(/\s+/g, "-")}`)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L1440 60L1440 30C1440 30 1200 0 720 0C240 0 0 30 0 30L0 60Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
