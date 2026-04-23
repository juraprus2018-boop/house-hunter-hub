import { useMemo } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import FAQSchema, { type FAQItem } from "@/components/seo/FAQSchema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getValidCityName } from "@/lib/dutchCities";
import { cityPath } from "@/lib/cities";
import { ArrowRight, Trophy, MapPin, TrendingDown, Maximize2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

export type BestOfVariant = "goedkoopste-huur" | "grootste-huur" | "beste-buurten";

interface BestOfCityPageProps {
  variant: BestOfVariant;
}

const formatEuro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(n);

const VARIANT_CONFIG: Record<BestOfVariant, {
  pathPrefix: string;
  h1: (city: string) => string;
  intro: (city: string) => string;
  metaTitle: (city: string, count: number) => string;
  metaDesc: (city: string, count: number) => string;
  icon: typeof Trophy;
  breadcrumb: string;
}> = {
  "goedkoopste-huur": {
    pathPrefix: "goedkoopste-huurwoningen",
    h1: (city) => `De 10 goedkoopste huurwoningen in ${city}`,
    intro: (city) =>
      `Op zoek naar een betaalbare huurwoning in ${city}? Deze top 10 van goedkoopste huurwoningen wordt dagelijks bijgewerkt en toont het meest voordelige actuele aanbod. Reageer snel: betaalbare woningen in ${city} zijn vaak binnen enkele dagen weg.`,
    metaTitle: (city, count) => `Top 10 goedkoopste huurwoningen ${city} (${new Date().getFullYear()}) | WoonPeek`,
    metaDesc: (city, count) =>
      `${count > 0 ? `Bekijk de ${Math.min(10, count)} goedkoopste huurwoningen in ${city}` : `De goedkoopste huurwoningen in ${city}`}. Dagelijks bijgewerkt aanbod, direct reageren bij verhuurder.`,
    icon: TrendingDown,
    breadcrumb: "Goedkoopste huurwoningen",
  },
  "grootste-huur": {
    pathPrefix: "grootste-huurwoningen",
    h1: (city) => `De 10 grootste huurwoningen in ${city}`,
    intro: (city) =>
      `Veel ruimte nodig in ${city}? Deze top 10 van grootste huurwoningen toont het ruimste aanbod op WoonPeek. Ideaal voor gezinnen, woongroepen of wie thuis wil werken zonder concessies.`,
    metaTitle: (city, count) => `Top 10 grootste huurwoningen ${city} (${new Date().getFullYear()}) | WoonPeek`,
    metaDesc: (city, count) =>
      `${count > 0 ? `Bekijk de ${Math.min(10, count)} ruimste huurwoningen in ${city}` : `De grootste huurwoningen in ${city}`} qua oppervlakte. Dagelijks bijgewerkt.`,
    icon: Maximize2,
    breadcrumb: "Grootste huurwoningen",
  },
  "beste-buurten": {
    pathPrefix: "beste-buurten",
    h1: (city) => `De 10 beste buurten van ${city} om te wonen`,
    intro: (city) =>
      `Welke wijk past bij jou in ${city}? Deze top 10 buurten is samengesteld op basis van het actieve woningaanbod, gemiddelde huur- en koopprijzen en variatie in woningtypes. Vergelijk de wijken en vind jouw perfecte plek.`,
    metaTitle: (city, count) => `Top 10 beste buurten van ${city} om te wonen (${new Date().getFullYear()}) | WoonPeek`,
    metaDesc: (city, count) =>
      `Vergelijk de ${count > 0 ? Math.min(10, count) : "beste"} buurten in ${city}: gemiddelde prijs, aantal woningen en woningtypes. Vind de wijk die bij jou past.`,
    icon: Trophy,
    breadcrumb: "Beste buurten",
  },
};

const BestOfCityPage = ({ variant }: BestOfCityPageProps) => {
  const { city: citySlug = "" } = useParams<{ city: string }>();
  const validCityName = getValidCityName(citySlug);
  const config = VARIANT_CONFIG[variant];

  // Properties query for huur variants
  const propertiesQuery = useQuery({
    queryKey: ["best-of-properties", variant, validCityName],
    queryFn: async () => {
      if (!validCityName || variant === "beste-buurten") return [];
      const orderColumn = variant === "goedkoopste-huur" ? "price" : "surface_area";
      const ascending = variant === "goedkoopste-huur";
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "actief")
        .eq("listing_type", "huur")
        .ilike("city", `%${validCityName}%`)
        .not(orderColumn, "is", null)
        .gt(orderColumn, 0)
        .order(orderColumn, { ascending })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Property[];
    },
    enabled: !!validCityName && variant !== "beste-buurten",
    staleTime: 60_000,
  });

  // Neighborhoods query for "beste-buurten" variant
  const neighborhoodsQuery = useQuery({
    queryKey: ["best-of-neighborhoods", validCityName],
    queryFn: async () => {
      if (!validCityName) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("neighborhood, price, listing_type, property_type")
        .eq("status", "actief")
        .ilike("city", `%${validCityName}%`)
        .not("neighborhood", "is", null)
        .limit(5000);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const groups: Record<string, {
        prices: number[];
        huur: number;
        koop: number;
        types: Set<string>;
      }> = {};

      for (const row of data) {
        const nb = (row.neighborhood || "").trim();
        if (!nb || nb.length < 2) continue;
        if (!groups[nb]) groups[nb] = { prices: [], huur: 0, koop: 0, types: new Set() };
        groups[nb].prices.push(Number(row.price));
        groups[nb].types.add(row.property_type);
        if (row.listing_type === "huur") groups[nb].huur++;
        else groups[nb].koop++;
      }

      return Object.entries(groups)
        .filter(([, g]) => g.prices.length >= 2)
        .map(([name, g]) => ({
          name,
          total: g.prices.length,
          huur: g.huur,
          koop: g.koop,
          avgPrice: Math.round(g.prices.reduce((s, v) => s + v, 0) / g.prices.length),
          variety: g.types.size,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    },
    enabled: !!validCityName && variant === "beste-buurten",
    staleTime: 60_000,
  });

  const properties = propertiesQuery.data ?? [];
  const neighborhoods = neighborhoodsQuery.data ?? [];
  const isLoading = propertiesQuery.isLoading || neighborhoodsQuery.isLoading;
  const count = variant === "beste-buurten" ? neighborhoods.length : properties.length;

  const faqItems: FAQItem[] = useMemo(() => {
    if (!validCityName) return [];
    if (variant === "goedkoopste-huur") {
      const cheapest = properties[0];
      return [
        {
          question: `Wat is de goedkoopste huurwoning in ${validCityName}?`,
          answer: cheapest
            ? `Op dit moment is de goedkoopste huurwoning in ${validCityName} ${formatEuro(Number(cheapest.price))} per maand. Het aanbod wordt dagelijks bijgewerkt, dus deze prijs kan veranderen.`
            : `Er zijn momenteel geen actieve huurwoningen in ${validCityName} op WoonPeek. Stel een gratis alert in om direct bericht te krijgen zodra een betaalbare woning beschikbaar komt.`,
        },
        {
          question: `Hoe vind ik een betaalbare huurwoning in ${validCityName}?`,
          answer: `Reageer snel op nieuw aanbod. WoonPeek bundelt dagelijks woningen uit tientallen bronnen. Stel een dagelijkse e-mailalert in zodat je nooit een goedkope huurwoning in ${validCityName} mist.`,
        },
        {
          question: `Worden goedkope huurwoningen snel verhuurd?`,
          answer: `Ja, betaalbare woningen in ${validCityName} zijn vaak binnen 24 tot 72 uur verhuurd. Reageer daarom direct na publicatie en zorg dat je documenten (loonstrook, ID, werkgeversverklaring) klaar liggen.`,
        },
      ];
    }
    if (variant === "grootste-huur") {
      const largest = properties[0];
      return [
        {
          question: `Wat is de grootste huurwoning in ${validCityName}?`,
          answer: largest && largest.surface_area
            ? `De grootste actieve huurwoning in ${validCityName} is ${largest.surface_area} m². Het aanbod wordt dagelijks bijgewerkt.`
            : `Er is op dit moment geen ruim aanbod aanwezig in ${validCityName}. Stel een alert in om bericht te krijgen zodra grote huurwoningen beschikbaar komen.`,
        },
        {
          question: `Wat kost een ruime huurwoning in ${validCityName}?`,
          answer: `Grote huurwoningen in ${validCityName} zijn meestal duurder per maand maar voordeliger per m². Bekijk de top 10 hieronder voor de actuele prijzen.`,
        },
      ];
    }
    return [
      {
        question: `Wat is de beste buurt om te wonen in ${validCityName}?`,
        answer: neighborhoods[0]
          ? `Op basis van het huidige aanbod en variatie staat ${neighborhoods[0].name} bovenaan in ${validCityName}. Bekijk de volledige top 10 hieronder met gemiddelde prijzen.`
          : `Er zijn nog te weinig actieve woningen om buurten te ranken. Stel een alert in om bericht te krijgen wanneer aanbod beschikbaar komt.`,
      },
      {
        question: `Hoe wordt deze buurtenranking bepaald?`,
        answer: `De ranking is gebaseerd op het aantal actieve woningen, variatie in woningtypes en de balans tussen huur- en koopwoningen. Een buurt met veel divers aanbod biedt meer keuze voor verschillende woonbehoeften.`,
      },
      {
        question: `Wat is de gemiddelde prijs per buurt in ${validCityName}?`,
        answer: `Gemiddelde prijzen verschillen sterk per buurt. Bekijk per wijk de actuele gemiddelde prijs in de tabel hieronder.`,
      },
    ];
  }, [variant, validCityName, properties, neighborhoods]);

  if (!validCityName) {
    return <Navigate to="/niet-gevonden" replace />;
  }

  const cityName = validCityName;
  const Icon = config.icon;
  const canonical = `https://www.woonpeek.nl/${config.pathPrefix}/${citySlug}`;

  // ItemList JSON-LD for SEO
  const itemListJsonLd = useMemo(() => {
    const items =
      variant === "beste-buurten"
        ? neighborhoods.map((n, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${n.name}, ${cityName}`,
          }))
        : properties.slice(0, 10).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://www.woonpeek.nl/woning/${p.slug || p.id}`,
            name: p.title,
          }));

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: config.h1(cityName),
      numberOfItems: items.length,
      itemListElement: items,
    };
  }, [variant, neighborhoods, properties, cityName, config]);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={config.metaTitle(cityName, count)}
        description={config.metaDesc(cityName, count)}
        canonical={canonical}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-10">
          <div className="container">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: cityName, href: cityPath(cityName) },
                { label: config.breadcrumb },
              ]}
            />
            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                  {config.h1(cityName)}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
                  {config.intro(cityName)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container py-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : variant === "beste-buurten" ? (
            neighborhoods.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {neighborhoods.map((n, i) => (
                  <Card key={n.name} className="relative overflow-hidden">
                    <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      #{i + 1}
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h2 className="font-display text-lg font-semibold text-foreground">{n.name}</h2>
                      </div>
                      <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <dt>Aantal woningen</dt>
                          <dd className="font-medium text-foreground">{n.total}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Gem. prijs</dt>
                          <dd className="font-medium text-foreground">{formatEuro(n.avgPrice)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Huur / Koop</dt>
                          <dd className="font-medium text-foreground">{n.huur} / {n.koop}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState cityName={cityName} />
            )
          ) : properties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property, i) => (
                <div key={property.id} className="relative">
                  <span className="absolute left-3 top-3 z-10 flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground shadow-md">
                    #{i + 1}
                  </span>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState cityName={cityName} />
          )}
        </section>

        {/* Cross-links */}
        <section className="border-t bg-muted/20 py-10">
          <div className="container">
            <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
              Meer overzichten voor {cityName}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {(["goedkoopste-huur", "grootste-huur", "beste-buurten"] as BestOfVariant[])
                .filter((v) => v !== variant)
                .map((v) => (
                  <Link
                    key={v}
                    to={`/${VARIANT_CONFIG[v].pathPrefix}/${citySlug}`}
                    className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary">
                      {VARIANT_CONFIG[v].h1(cityName)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </Link>
                ))}
              <Link
                to={cityPath(cityName)}
                className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <span className="font-medium text-foreground group-hover:text-primary">
                  Alle woningen in {cityName}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t">
          <div className="container">
            <FAQSchema items={faqItems} title={`Veelgestelde vragen over ${config.breadcrumb.toLowerCase()} in ${cityName}`} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const EmptyState = ({ cityName }: { cityName: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
    <h3 className="font-display text-lg font-semibold text-foreground">
      Nog geen ranking beschikbaar voor {cityName}
    </h3>
    <p className="mt-2 max-w-md text-sm text-muted-foreground">
      Er is op dit moment te weinig actief aanbod om een top 10 samen te stellen. Stel een gratis alert in om bericht te krijgen wanneer nieuwe woningen beschikbaar komen.
    </p>
    <Button asChild className="mt-4">
      <Link to="/dagelijkse-alert">Alert aanmaken</Link>
    </Button>
  </div>
);

export default BestOfCityPage;