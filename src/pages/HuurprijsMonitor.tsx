import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Home, Euro, Ruler, Bed, ArrowRight } from "lucide-react";
import { cityPath, citySlugToName } from "@/lib/cities";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const formatEuro = (price: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(price);

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartementen",
  huis: "Huizen",
  studio: "Studio's",
  kamer: "Kamers",
};

const HuurprijsMonitor = () => {
  const { city: citySlug } = useParams<{ city: string }>();
  const cityName = citySlug ? citySlugToName(citySlug) : "";

  const { data: properties, isLoading } = useQuery({
    queryKey: ["huurprijs-monitor", citySlug],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("price, listing_type, property_type, surface_area, bedrooms, created_at")
        .eq("status", "actief")
        .ilike("city", `%${cityName}%`);
      return data || [];
    },
    enabled: !!cityName,
  });

  const stats = useMemo(() => {
    if (!properties?.length) return null;
    const huur = properties.filter(p => p.listing_type === "huur");
    const koop = properties.filter(p => p.listing_type === "koop");

    const avgHuur = huur.length ? Math.round(huur.reduce((s, p) => s + p.price, 0) / huur.length) : 0;
    const avgKoop = koop.length ? Math.round(koop.reduce((s, p) => s + p.price, 0) / koop.length) : 0;
    const medianHuur = huur.length ? huur.map(p => p.price).sort((a, b) => a - b)[Math.floor(huur.length / 2)] : 0;
    const minHuur = huur.length ? Math.min(...huur.map(p => p.price)) : 0;
    const maxHuur = huur.length ? Math.max(...huur.map(p => p.price)) : 0;

    const withSurface = properties.filter(p => p.surface_area);
    const avgSurface = withSurface.length ? Math.round(withSurface.reduce((s, p) => s + (p.surface_area || 0), 0) / withSurface.length) : 0;

    // Price per type
    const typeStats = Object.entries(
      huur.reduce((acc, p) => {
        if (!acc[p.property_type]) acc[p.property_type] = { total: 0, count: 0 };
        acc[p.property_type].total += p.price;
        acc[p.property_type].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>)
    ).map(([type, { total, count }]) => ({
      name: TYPE_LABELS[type] || type,
      prijs: Math.round(total / count),
      aantal: count,
    })).sort((a, b) => b.aantal - a.aantal);

    return {
      total: properties.length,
      huurCount: huur.length,
      koopCount: koop.length,
      avgHuur,
      avgKoop,
      medianHuur,
      minHuur,
      maxHuur,
      avgSurface,
      typeStats,
    };
  }, [properties]);

  const currentMonth = new Date().toLocaleString("nl-NL", { month: "long" });
  const currentYear = new Date().getFullYear();

  const pageTitle = `Gemiddelde huurprijs ${cityName} ${currentMonth} ${currentYear}: actueel overzicht | WoonPeek`;
  const pageDescription = `De gemiddelde huurprijs in ${cityName} is ${stats ? formatEuro(stats.avgHuur) : "..."} per maand (${currentMonth} ${currentYear}). Bekijk huurprijzen per woningtype en vergelijk.`;

  const faqItems = [
    {
      question: `Wat is de gemiddelde huurprijs in ${cityName}?`,
      answer: stats ? `De gemiddelde huurprijs in ${cityName} is ${formatEuro(stats.avgHuur)} per maand (${currentMonth} ${currentYear}). De mediaan huurprijs is ${formatEuro(stats.medianHuur)}.` : "Data wordt geladen...",
    },
    {
      question: `Wat is de goedkoopste huurwoning in ${cityName}?`,
      answer: stats ? `De goedkoopste huurwoning in ${cityName} begint vanaf ${formatEuro(stats.minHuur)} per maand.` : "Data wordt geladen...",
    },
    {
      question: `Hoeveel huurwoningen zijn er in ${cityName}?`,
      answer: stats ? `Er zijn momenteel ${stats.huurCount} huurwoningen beschikbaar in ${cityName}.` : "Data wordt geladen...",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(f => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={pageTitle} description={pageDescription} canonical={`https://www.woonpeek.nl/huurprijzen/${citySlug}`} />
      <Header />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container">
            <Breadcrumbs items={[
              { label: "Home", href: "/" },
              { label: cityName, href: cityPath(cityName) },
              { label: "Huurprijzen" },
            ]} />
            <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Gemiddelde huurprijs {cityName} ({currentMonth} {currentYear})
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-2xl">
              Actueel overzicht van huurprijzen in {cityName}. Data op basis van {stats?.huurCount || "..."} beschikbare huurwoningen, dagelijks bijgewerkt.
            </p>
          </div>
        </section>

        {isLoading || !stats ? (
          <div className="container py-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : (
          <>
            {/* Key Stats */}
            <section className="container py-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Gem. huurprijs", value: formatEuro(stats.avgHuur), icon: Euro, sub: "per maand" },
                  { label: "Mediaan huurprijs", value: formatEuro(stats.medianHuur), icon: TrendingUp, sub: "per maand" },
                  { label: "Gem. oppervlakte", value: `${stats.avgSurface} m²`, icon: Ruler, sub: `${stats.total} woningen` },
                  { label: "Beschikbaar", value: `${stats.huurCount} huur / ${stats.koopCount} koop`, icon: Home, sub: `totaal ${stats.total}` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border bg-card p-5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <stat.icon className="h-4 w-4" />
                      <span className="text-sm">{stat.label}</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Chart per type */}
            {stats.typeStats.length > 0 && (
              <section className="container pb-8">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  Huurprijs per woningtype in {cityName}
                </h2>
                <div className="rounded-xl border bg-card p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.typeStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `€${v}`} />
                      <Tooltip formatter={(v: number) => formatEuro(v)} />
                      <Bar dataKey="prijs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Price range table */}
            <section className="container pb-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Huurprijzen per woningtype</h2>
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="grid grid-cols-3 gap-4 border-b bg-muted/50 px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                  <span>Woningtype</span>
                  <span className="text-center">Gem. huurprijs</span>
                  <span className="text-center">Aantal</span>
                </div>
                {stats.typeStats.map((t) => (
                  <div key={t.name} className="grid grid-cols-3 gap-4 border-b last:border-0 px-6 py-4">
                    <span className="text-sm font-medium text-foreground">{t.name}</span>
                    <span className="text-center text-sm font-semibold text-primary">{formatEuro(t.prijs)}</span>
                    <span className="text-center text-sm text-muted-foreground">{t.aantal}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* SEO Content */}
            <section className="border-t bg-muted/30 py-12">
              <div className="container max-w-4xl space-y-4 text-sm leading-relaxed text-muted-foreground">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Huurprijzen in {cityName}: wat kost huren?
                </h2>
                <p>
                  De woningmarkt in {cityName} laat in {currentMonth} {currentYear} een gemiddelde huurprijs zien van <strong>{formatEuro(stats.avgHuur)}</strong> per maand.
                  De goedkoopste huurwoning begint vanaf {formatEuro(stats.minHuur)}, terwijl de duurste optie {formatEuro(stats.maxHuur)} per maand kost.
                </p>
                <p>
                  Het aanbod in {cityName} bestaat uit {stats.typeStats.map(t => `${t.aantal} ${t.name.toLowerCase()}`).join(", ")}.
                  Met een gemiddelde woonoppervlakte van {stats.avgSurface} m² biedt {cityName} mogelijkheden voor diverse woningzoekers.
                </p>
                <p>
                  Bekijk alle{" "}
                  <Link to={`/huurwoningen/${citySlug}`} className="text-primary underline hover:no-underline">huurwoningen in {cityName}</Link>
                  {" "}of stel een{" "}
                  <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">gratis dagelijkse alert</Link>
                  {" "}in om als eerste het nieuwste aanbod te ontvangen.
                </p>
              </div>
            </section>

            {/* FAQ */}
            <section className="border-t py-12">
              <div className="container max-w-3xl">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">Veelgestelde vragen</h2>
                {faqItems.map((faq, i) => (
                  <details key={i} className="group rounded-xl border bg-card mb-3">
                    <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-foreground list-none flex items-center justify-between gap-4">
                      {faq.question}
                    </summary>
                    <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.answer}</div>
                  </details>
                ))}
              </div>
            </section>

            {/* Links */}
            <section className="border-t py-12">
              <div className="container max-w-4xl">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Meer over {cityName}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link to={cityPath(cityName)} className="group flex items-center justify-between rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
                    <span className="font-medium text-foreground">Alle woningen in {cityName}</span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  </Link>
                  <Link to={`/huurwoningen/${citySlug}`} className="group flex items-center justify-between rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
                    <span className="font-medium text-foreground">Huurwoningen in {cityName}</span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default HuurprijsMonitor;
