import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { MapPin, Home, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

const useCityCounts = () =>
  useQuery({
    queryKey: ["city-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("city")
        .eq("status", "actief");
      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((p) => {
        const c = p.city.trim();
        counts[c] = (counts[c] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

const Cities = () => {
  const { data: cities, isLoading } = useCityCounts();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Alle steden met woningen | WoonPeek"
        description="Bekijk alle steden waar woningen beschikbaar zijn op WoonPeek, geordend op aantal beschikbare woningen."
        canonical="https://woonpeek.nl/steden"
      />
      <Header />
      <main className="flex-1 container py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Steden" }]} />

        <div className="mt-6 mb-4">
          <h1 className="font-display text-3xl font-bold text-foreground">Alle steden met woningaanbod</h1>
          <p className="mt-2 text-muted-foreground">
            Ontdek woningen in {cities?.length ?? "…"} steden door heel Nederland
          </p>
        </div>
        <div className="mb-8 max-w-3xl space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            WoonPeek verzamelt dagelijks huurwoningen en koopwoningen uit steden door heel Nederland. 
            Van de Randstad tot de provincies — hieronder vind je een overzicht van alle steden waar momenteel 
            actief woningaanbod beschikbaar is. Klik op een stad om het volledige aanbod te bekijken, 
            inclusief appartementen, huizen, studio's en kamers.
          </p>
          <p>
            De populairste steden op WoonPeek zijn Amsterdam, Rotterdam, Utrecht, Eindhoven, Den Haag en 
            Groningen. Maar ook in kleinere gemeenten vind je regelmatig aantrekkelijk woningaanbod. 
            Mis niets en stel een dagelijkse alert in om als eerste op de hoogte te zijn van nieuwe woningen.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cities?.map(({ city, count }) => (
              <Link key={city} to={`/${city.toLowerCase().replace(/\s+/g, "-")}`}>
                <Card className="group border-0 shadow-md transition-shadow hover:shadow-xl">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-base font-semibold text-foreground truncate">
                        {city}
                      </h2>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Home className="h-3.5 w-3.5" />
                        {count} {count === 1 ? "woning" : "woningen"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 max-w-3xl space-y-3 text-sm text-muted-foreground leading-relaxed border-t pt-8">
          <h2 className="font-display text-2xl font-bold text-foreground">Woningen zoeken per stad</h2>
          <p>
            Nederland telt honderden steden en gemeenten, elk met een eigen woningmarkt en karakter. 
            In grote steden als Amsterdam en Rotterdam is het aanbod divers maar de concurrentie groot. 
            In middelgrote steden als Tilburg, Breda en Arnhem vind je vaak meer ruimte voor je budget. 
            En in kleinere plaatsen zijn er verrassend betaalbare opties beschikbaar.
          </p>
          <p>
            WoonPeek helpt je bij het vinden van de perfecte woning, ongeacht de stad. Gebruik onze 
            zoekfunctie om direct te filteren op locatie, prijs en woningtype. Of verken het aanbod 
            via onze interactieve kaart op de verkenningspagina.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cities;
