import { Search, MapPin, Bell, ChevronDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHomeStats } from "@/hooks/useHomeStats";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import heroBg from "@/assets/hero-bg.webp";

const HeroSection = () => {
  const navigate = useNavigate();
  const { data: stats } = useHomeStats();
  const { data: activePropertiesCount } = useQuery({
    queryKey: ["home-active-properties-count"],
    queryFn: async () => {
      const { count, error } = await supabase.
      from("properties").
      select("id", { count: "exact", head: true }).
      eq("status", "actief");
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [listingType, setListingType] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minBedrooms, setMinBedrooms] = useState<string>("");
  const [grossIncome, setGrossIncome] = useState<string>("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("locatie", searchQuery.trim());
    if (listingType) params.set("aanbod", listingType);
    if (maxPrice) params.set("max_prijs", maxPrice);
    if (minBedrooms) params.set("min_kamers", minBedrooms);
    if (grossIncome && listingType !== "koop") params.set("inkomen", grossIncome);
    navigate(`/zoeken?${params.toString()}`);
  };

  const totalProperties = activePropertiesCount ?? stats?.properties_count ?? 0;
  const totalCities = stats?.cities_count ?? 0;

  return (
    <section className="relative overflow-hidden">
      {/* Background - <img> instead of CSS bg so we can set fetchpriority="high" for LCP */}
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary/90" />

      <div className="container relative py-16 md:py-28 lg:py-36">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
            <MapPin className="h-4 w-4" />
            <span>
              <strong>{totalProperties.toLocaleString("nl-NL")}</strong> woningen in{" "}
              <strong>{totalCities}</strong> steden
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Elke dag het nieuwste <span style={{ color: '#288a51' }}>woningaanbod!</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-white/80 sm:text-lg md:text-xl">
            WoonPeek helpt je nieuwe woningen te ontdekken zodra ze beschikbaar komen. Huurwoningen, koopwoningen en meer dagelijks bijgewerkt.
          
          </p>

          {/* Search Bar - Extended */}
          <form onSubmit={handleSearch} className="mt-10">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
              {/* Main search input */}
              <div className="flex items-center border-b border-border/50 px-4">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Zoek op stad of postcode..."
                  className="h-14 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} />
                
              </div>

              {/* Filter row */}
              <div className="grid grid-cols-3 divide-x divide-border/50">
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger className="h-12 rounded-none border-0 bg-transparent text-sm shadow-none focus:ring-0">
                    <SelectValue placeholder="Koop of huur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="huur">Huur</SelectItem>
                    <SelectItem value="koop">Koop</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={maxPrice} onValueChange={setMaxPrice}>
                  <SelectTrigger className="h-12 rounded-none border-0 bg-transparent text-sm shadow-none focus:ring-0">
                    <SelectValue placeholder="Max. prijs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="750">Tot €750</SelectItem>
                    <SelectItem value="1000">Tot €1.000</SelectItem>
                    <SelectItem value="1250">Tot €1.250</SelectItem>
                    <SelectItem value="1500">Tot €1.500</SelectItem>
                    <SelectItem value="2000">Tot €2.000</SelectItem>
                    <SelectItem value="250000">Tot €250.000</SelectItem>
                    <SelectItem value="350000">Tot €350.000</SelectItem>
                    <SelectItem value="500000">Tot €500.000</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={minBedrooms} onValueChange={setMinBedrooms}>
                  <SelectTrigger className="h-12 rounded-none border-0 bg-transparent text-sm shadow-none focus:ring-0">
                    <SelectValue placeholder="Kamers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1+ kamer</SelectItem>
                    <SelectItem value="2">2+ kamers</SelectItem>
                    <SelectItem value="3">3+ kamers</SelectItem>
                    <SelectItem value="4">4+ kamers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Income check (only for huur) */}
              {listingType === "huur" && (
                <div className="flex items-center gap-2 border-t border-border/50 bg-primary/5 px-4 py-2.5">
                  <Wallet className="h-4 w-4 shrink-0 text-primary" />
                  <label htmlFor="hero-income" className="shrink-0 text-xs font-medium text-foreground sm:text-sm">
                    Bruto inkomen p/m
                  </label>
                  <Input
                    id="hero-income"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    placeholder="bijv. 3500"
                    className="h-9 flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                    value={grossIncome}
                    onChange={(e) => setGrossIncome(e.target.value)}
                  />
                  {grossIncome && Number(grossIncome) > 0 && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary sm:text-xs">
                      Max huur €{Math.floor(Number(grossIncome) / 3).toLocaleString("nl-NL")}
                    </span>
                  )}
                </div>
              )}

              {/* Search button */}
              <div className="p-3">
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full gap-2 rounded-xl bg-accent text-base font-semibold text-accent-foreground shadow-md hover:bg-accent/90">
                  
                  <Search className="h-5 w-5" />
                  Zoek woningen
                </Button>
              </div>
            </div>
          </form>

          {/* CTA buttons */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/dagelijkse-alert">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white">
                
                <Bell className="h-4 w-4" />
                Ontvang woningalerts
              </Button>
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/60">Populair:</span>
            {["Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven"].map((city) =>
            <button
              key={city}
              onClick={() => navigate(`/woningen-${city.toLowerCase().replace(/\s+/g, "-")}`)}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20">
              
                {city}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L1440 60L1440 30C1440 30 1200 0 720 0C240 0 0 30 0 30L0 60Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>);

};

export default HeroSection;