import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    location: "",
    type: "",
    maxPrice: "",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchParams.location) params.set("locatie", searchParams.location);
    if (searchParams.type) params.set("type", searchParams.type);
    if (searchParams.maxPrice) params.set("maxPrijs", searchParams.maxPrice);
    navigate(`/zoeken?${params.toString()}`);
  };

  return (
    <section className="relative py-24 md:py-32 lg:py-40">
      {/* Subtle warm gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-background to-background" />
      
      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Jouw volgende thuis begint hier
          </p>
          <h1 className="mt-6 font-display text-5xl font-semibold text-foreground md:text-6xl lg:text-7xl">
            Vind jouw
            <br />
            <span className="italic text-accent">droomwoning</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base text-muted-foreground leading-relaxed">
            Zoek tussen duizenden woningen of plaats je eigen woning gratis op WoonPeek.
            Direct contact met aanbieders.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-12">
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-lg md:flex-row md:items-center md:gap-2 md:p-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Stad, buurt of postcode"
                  className="h-11 border-0 bg-transparent pl-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                />
              </div>
              
              <div className="hidden h-6 w-px bg-border md:block" />

              <Select
                value={searchParams.type}
                onValueChange={(value) => setSearchParams({ ...searchParams, type: value })}
              >
                <SelectTrigger className="h-11 w-full border-0 bg-transparent md:w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="huis">Huis</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="kamer">Kamer</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden h-6 w-px bg-border md:block" />

              <Select
                value={searchParams.maxPrice}
                onValueChange={(value) => setSearchParams({ ...searchParams, maxPrice: value })}
              >
                <SelectTrigger className="h-11 w-full border-0 bg-transparent md:w-36">
                  <SelectValue placeholder="Max prijs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">€ 500</SelectItem>
                  <SelectItem value="750">€ 750</SelectItem>
                  <SelectItem value="1000">€ 1.000</SelectItem>
                  <SelectItem value="1250">€ 1.250</SelectItem>
                  <SelectItem value="1500">€ 1.500</SelectItem>
                  <SelectItem value="2000">€ 2.000</SelectItem>
                  <SelectItem value="2500">€ 2.500+</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                type="submit" 
                size="lg" 
                className="h-11 px-6"
              >
                <Search className="mr-2 h-4 w-4" />
                Zoeken
              </Button>
            </div>
          </form>

          {/* Quick stats */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-12 text-sm text-muted-foreground">
            <div className="text-center">
              <span className="block font-display text-3xl font-semibold text-foreground">-</span>
              <span className="mt-1 block text-xs uppercase tracking-widest">woningen</span>
            </div>
            <div className="text-center">
              <span className="block font-display text-3xl font-semibold text-foreground">-</span>
              <span className="mt-1 block text-xs uppercase tracking-widest">gebruikers</span>
            </div>
            <div className="text-center">
              <span className="block font-display text-3xl font-semibold text-foreground">-</span>
              <span className="mt-1 block text-xs uppercase tracking-widest">steden</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
