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
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Vind jouw{" "}
            <span className="text-primary">droomwoning</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Zoek tussen duizenden woningen of plaats je eigen woning gratis op WoonPeek.
            Direct contact met aanbieders, geen tussenpartijen.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-8">
            <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-lg md:flex-row md:items-center md:gap-2 md:p-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Stad, buurt of postcode"
                  className="h-12 border-0 bg-muted/50 pl-10 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                />
              </div>
              
              <Select
                value={searchParams.type}
                onValueChange={(value) => setSearchParams({ ...searchParams, type: value })}
              >
                <SelectTrigger className="h-12 w-full border-0 bg-muted/50 md:w-40">
                  <SelectValue placeholder="Type woning" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="huis">Huis</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="kamer">Kamer</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={searchParams.maxPrice}
                onValueChange={(value) => setSearchParams({ ...searchParams, maxPrice: value })}
              >
                <SelectTrigger className="h-12 w-full border-0 bg-muted/50 md:w-40">
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
                className="h-12 bg-accent px-8 text-accent-foreground hover:bg-accent/90"
              >
                <Search className="mr-2 h-5 w-5" />
                Zoeken
              </Button>
            </div>
          </form>

          {/* Quick stats - will be dynamic later */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold text-foreground">-</span>
              <span>woningen</span>
            </div>
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold text-foreground">-</span>
              <span>gebruikers</span>
            </div>
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-bold text-foreground">-</span>
              <span>steden</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
