import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, TrendingUp, Home, Building2 } from "lucide-react";
import { cityPath, citySlugToName } from "@/lib/cities";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const formatEuro = (price: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(price);

const CityComparePage = () => {
  const { city1: slug1, city2: slug2 } = useParams<{ city1: string; city2: string }>();
  const cityName1 = slug1 ? citySlugToName(slug1) : "";
  const cityName2 = slug2 ? citySlugToName(slug2) : "";

  const { data: stats1, isLoading: loading1 } = useQuery({
    queryKey: ["city-compare", slug1],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("price, listing_type, property_type, surface_area, bedrooms")
        .eq("status", "actief")
        .ilike("city", `%${cityName1}%`);
      return data || [];
    },
    enabled: !!cityName1,
  });

  const { data: stats2, isLoading: loading2 } = useQuery({
    queryKey: ["city-compare", slug2],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("price, listing_type, property_type, surface_area, bedrooms")
        .eq("status", "actief")
        .ilike("city", `%${cityName2}%`);
      return data || [];
    },
    enabled: !!cityName2,
  });

  const isLoading = loading1 || loading2;

  const calcStats = (data: any[]) => {
    if (!data?.length) return { total: 0, avgPrice: 0, avgHuur: 0, avgKoop: 0, avgSurface: 0, avgBedrooms: 0 };
    const huur = data.filter(d => d.listing_type === "huur");
    const koop = data.filter(d => d.listing_type === "koop");
    const withSurface = data.filter(d => d.surface_area);
    const withBedrooms = data.filter(d => d.bedrooms);
    return {
      total: data.length,
      avgPrice: Math.round(data.reduce((s, d) => s + d.price, 0) / data.length),
      avgHuur: huur.length ? Math.round(huur.reduce((s, d) => s + d.price, 0) / huur.length) : 0,
      avgKoop: koop.length ? Math.round(koop.reduce((s, d) => s + d.price, 0) / koop.length) : 0,
      avgSurface: withSurface.length ? Math.round(withSurface.reduce((s, d) => s + d.surface_area, 0) / withSurface.length) : 0,
      avgBedrooms: withBedrooms.length ? (withBedrooms.reduce((s, d) => s + d.bedrooms, 0) / withBedrooms.length).toFixed(1) : "0",
      huurCount: huur.length,
      koopCount: koop.length,
    };
  };

  const s1 = useMemo(() => calcStats(stats1 || []), [stats1]);
  const s2 = useMemo(() => calcStats(stats2 || []), [stats2]);

  const currentMonth = new Date().toLocaleString("nl-NL", { month: "long" });
  const currentYear = new Date().getFullYear();

  const pageTitle = `Huurprijzen ${cityName1} vs ${cityName2}: vergelijking woningmarkt (${currentMonth} ${currentYear}) | WoonPeek`;
  const pageDescription = `Vergelijk huurprijzen en woningaanbod in ${cityName1} en ${cityName2}. ${s1.total} woningen in ${cityName1}, ${s2.total} in ${cityName2}. Actuele data ${currentMonth} ${currentYear}.`;

  const chartData = [
    { name: "Gem. huurprijs", [cityName1]: s1.avgHuur, [cityName2]: s2.avgHuur },
    { name: "Gem. koopprijs", [cityName1]: s1.avgKoop, [cityName2]: s2.avgKoop },
  ];

  const comparisonRows = [
    { label: "Totaal woningen", v1: s1.total, v2: s2.total, format: (v: any) => v },
    { label: "Gemiddelde huurprijs", v1: s1.avgHuur, v2: s2.avgHuur, format: formatEuro },
    { label: "Gemiddelde koopprijs", v1: s1.avgKoop, v2: s2.avgKoop, format: formatEuro },
    { label: "Gemiddelde oppervlakte", v1: s1.avgSurface, v2: s2.avgSurface, format: (v: any) => `${v} m²` },
    { label: "Gem. kamers", v1: s1.avgBedrooms, v2: s2.avgBedrooms, format: (v: any) => v },
  ];

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Steden", href: "/steden" },
    { label: `${cityName1} vs ${cityName2}` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Wat is het verschil in huurprijzen tussen ${cityName1} en ${cityName2}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `De gemiddelde huurprijs in ${cityName1} is ${formatEuro(s1.avgHuur)} per maand, terwijl deze in ${cityName2} ${formatEuro(s2.avgHuur)} bedraagt. ${s1.avgHuur > s2.avgHuur ? `${cityName1} is hiermee ${formatEuro(s1.avgHuur - s2.avgHuur)} duurder.` : `${cityName2} is ${formatEuro(s2.avgHuur - s1.avgHuur)} duurder.`}`,
        },
      },
      {
        "@type": "Question",
        name: `Waar is meer woningaanbod: ${cityName1} of ${cityName2}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${cityName1} heeft momenteel ${s1.total} woningen beschikbaar, ${cityName2} heeft ${s2.total} woningen. ${s1.total > s2.total ? `${cityName1} heeft dus meer aanbod.` : `${cityName2} heeft meer aanbod.`}`,
        },
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={pageTitle} description={pageDescription} canonical={`https://www.woonpeek.nl/vergelijk/${slug1}-vs-${slug2}`} />
      <Header />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container">
            <Breadcrumbs items={breadcrumbs} />
            <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Huurprijzen {cityName1} vs {cityName2}
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-2xl">
              Vergelijk het woningaanbod en de huurprijzen in {cityName1} en {cityName2}. Actuele data van {currentMonth} {currentYear}, dagelijks bijgewerkt.
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="container py-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <>
            {/* Comparison table */}
            <section className="container py-8">
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="grid grid-cols-3 gap-4 border-b bg-muted/50 px-6 py-4">
                  <span className="text-sm font-medium text-muted-foreground"></span>
                  <span className="text-center font-display font-bold text-foreground">{cityName1}</span>
                  <span className="text-center font-display font-bold text-foreground">{cityName2}</span>
                </div>
                {comparisonRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-3 gap-4 border-b last:border-0 px-6 py-4">
                    <span className="text-sm font-medium text-muted-foreground">{row.label}</span>
                    <span className="text-center text-sm font-semibold text-foreground">{row.format(row.v1)}</span>
                    <span className="text-center text-sm font-semibold text-foreground">{row.format(row.v2)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Chart */}
            {(s1.avgHuur > 0 || s2.avgHuur > 0) && (
              <section className="container pb-8">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Prijsvergelijking</h2>
                <div className="rounded-xl border bg-card p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.filter(d => d[cityName1] > 0 || d[cityName2] > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatEuro(v)} />
                      <Bar dataKey={cityName1} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={cityName2} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* SEO text */}
            <section className="border-t bg-muted/30 py-12">
              <div className="container max-w-4xl space-y-4 text-sm leading-relaxed text-muted-foreground">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Woningmarkt {cityName1} vs {cityName2}: wat zijn de verschillen?
                </h2>
                <p>
                  Overweeg je een verhuizing naar {cityName1} of {cityName2}? Beide steden hebben een uniek woningaanbod.
                  In {cityName1} zijn momenteel <strong>{s1.total} woningen</strong> beschikbaar met een gemiddelde huurprijs van <strong>{formatEuro(s1.avgHuur)}</strong>.
                  In {cityName2} zijn er <strong>{s2.total} woningen</strong> met een gemiddelde huurprijs van <strong>{formatEuro(s2.avgHuur)}</strong>.
                </p>
                {Number(s1.avgSurface) > 0 && Number(s2.avgSurface) > 0 && (
                  <p>
                    Qua woonoppervlakte biedt {Number(s1.avgSurface) > Number(s2.avgSurface) ? cityName1 : cityName2} gemiddeld meer ruimte
                    ({Math.max(Number(s1.avgSurface), Number(s2.avgSurface))} m² vs {Math.min(Number(s1.avgSurface), Number(s2.avgSurface))} m²).
                  </p>
                )}
                <p>
                  Bekijk alle woningen in{" "}
                  <Link to={cityPath(cityName1)} className="text-primary underline hover:no-underline">{cityName1}</Link>
                  {" "}of{" "}
                  <Link to={cityPath(cityName2)} className="text-primary underline hover:no-underline">{cityName2}</Link>.
                  Stel een{" "}
                  <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">gratis dagelijkse alert</Link>
                  {" "}in om als eerste het nieuwste aanbod te ontvangen.
                </p>
              </div>
            </section>

            {/* Links */}
            <section className="border-t py-12">
              <div className="container max-w-4xl">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Bekijk woningen</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    to={cityPath(cityName1)}
                    className="group flex items-center justify-between rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <Home className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">Woningen in {cityName1}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                  <Link
                    to={cityPath(cityName2)}
                    className="group flex items-center justify-between rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">Woningen in {cityName2}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
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

export default CityComparePage;
