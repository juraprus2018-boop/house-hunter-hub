import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import RelatedCities from "@/components/city/RelatedCities";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, MapPin, Search } from "lucide-react";
import { cityPath, citySlugToName } from "@/lib/cities";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

const PropertyCardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border bg-card">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-4"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /></div>
      <Skeleton className="h-6 w-1/3" />
    </div>
  </div>
);

const slugToName = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const NeighborhoodPage = () => {
  const { city: citySlug, neighborhood: neighborhoodSlug } = useParams<{ city: string; neighborhood: string }>();
  const cityName = citySlug ? citySlugToName(citySlug) : "";
  const neighborhoodName = neighborhoodSlug ? slugToName(neighborhoodSlug) : "";

  const { data, isLoading } = useQuery({
    queryKey: ["neighborhood-properties", citySlug, neighborhoodSlug],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("properties")
        .select("*", { count: "exact" })
        .eq("status", "actief")
        .ilike("city", `%${cityName}%`)
        .ilike("neighborhood", `%${neighborhoodName}%`)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return { properties: (data ?? []) as Property[], totalCount: count ?? 0 };
    },
    enabled: !!citySlug && !!neighborhoodSlug,
  });

  // Fetch other neighborhoods in this city
  const { data: neighborhoods } = useQuery({
    queryKey: ["city-neighborhoods", citySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("neighborhood")
        .eq("status", "actief")
        .ilike("city", `%${cityName}%`)
        .not("neighborhood", "is", null)
        .limit(5000);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        if (row.neighborhood) {
          counts[row.neighborhood] = (counts[row.neighborhood] || 0) + 1;
        }
      }
      return Object.entries(counts)
        .filter(([name]) => name.toLowerCase() !== neighborhoodName.toLowerCase())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([name, count]) => ({ name, count, slug: name.trim().toLowerCase().replace(/\s+/g, "-") }));
    },
    enabled: !!citySlug,
  });

  const properties = data?.properties ?? [];
  const totalCount = data?.totalCount ?? 0;

  const h1 = `Woningen in ${neighborhoodName}, ${cityName}`;
  const pageTitle = `Woningen in ${neighborhoodName}, ${cityName} – beschikbaar aanbod | WoonPeek`;
  const pageDescription = `Bekijk ${totalCount} woningen in de wijk ${neighborhoodName} in ${cityName}. Vergelijk huurwoningen, appartementen en huizen in ${neighborhoodName}.`;
  const canonical = `https://www.woonpeek.nl/wijk/${citySlug}/${neighborhoodSlug}`;

  const faqItems = useMemo(() => [
    {
      question: `Hoeveel woningen zijn er in ${neighborhoodName}, ${cityName}?`,
      answer: `Op dit moment zijn er ${totalCount} woningen beschikbaar in ${neighborhoodName}, ${cityName}. Het aanbod wordt dagelijks bijgewerkt.`,
    },
    {
      question: `Wat voor woningen zijn er in ${neighborhoodName}?`,
      answer: `In ${neighborhoodName} vind je diverse woningtypes waaronder appartementen, huizen, studio's en kamers. Gebruik de stadspagina om te filteren op woningtype.`,
    },
  ], [neighborhoodName, cityName, totalCount]);

  const jsonLd = useMemo(() => [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: h1,
      description: pageDescription,
      url: canonical,
      isPartOf: { "@type": "WebSite", name: "WoonPeek", url: "https://www.woonpeek.nl" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: h1,
      numberOfItems: totalCount,
      itemListElement: properties.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.woonpeek.nl/woning/${p.slug || p.id}`,
        name: p.title,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ], [h1, pageDescription, canonical, totalCount, properties, faqItems]);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={pageTitle} description={pageDescription} canonical={canonical} />
      <Header />
      <main className="flex-1">
        {jsonLd.map((schema, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ))}

        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container">
            <div className="mb-4">
              <Breadcrumbs items={[
                { label: "Home", href: "/" },
                { label: cityName, href: cityPath(cityName) },
                { label: neighborhoodName },
              ]} />
            </div>
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{h1}</h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Op zoek naar een woning in de wijk {neighborhoodName} in {cityName}? Hier vind je het actuele aanbod van beschikbare woningen. Bekijk prijzen, foto's en details.
              </p>
              <div className="mt-4 rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-sm inline-block">
                {totalCount} woningen gevonden
              </div>
            </div>
          </div>
        </section>

        {/* Properties */}
        <section className="container py-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="font-display text-lg font-semibold">Geen woningen gevonden in {neighborhoodName}</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">Bekijk het volledige aanbod van {cityName}.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to={cityPath(cityName)}>Alle woningen in {cityName}</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Other neighborhoods */}
        {neighborhoods && neighborhoods.length > 0 && (
          <section className="border-t py-12">
            <div className="container max-w-4xl">
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                Andere wijken in {cityName}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {neighborhoods.map((n) => (
                  <Link key={n.slug} to={`/wijk/${citySlug}/${n.slug}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary flex items-center justify-between">
                    <span>{n.name}</span>
                    <span className="text-xs text-muted-foreground">{n.count} woningen</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Internal links */}
        <section className="border-t py-12">
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Meer woningen in {cityName}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <Link to={cityPath(cityName)} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">Alle woningen in {cityName}</span>
              </Link>
              <Link to={`/huurwoningen/${citySlug}`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">Huurwoningen in {cityName}</span>
              </Link>
              <Link to={`/appartementen/${citySlug}`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">Appartementen in {cityName}</span>
              </Link>
              <Link to={`/nieuw-aanbod/${citySlug}`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">Nieuw aanbod in {cityName}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t py-12">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Veelgestelde vragen over {neighborhoodName}
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <details key={i} className="group rounded-xl border bg-card">
                  <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-foreground list-none flex items-center justify-between gap-4">
                    {faq.question}
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* SEO text */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container max-w-3xl">
            <h2 className="mb-4 font-display text-2xl font-bold">Wonen in {neighborhoodName}, {cityName}</h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                {neighborhoodName} is een populaire wijk in {cityName}. Op WoonPeek vind je het meest actuele aanbod van
                <strong> woningen in {neighborhoodName}</strong>. Of je nu zoekt naar een appartement, huis of kamer —
                het aanbod wordt dagelijks bijgewerkt.
              </p>
              <p>
                Bekijk ook het volledige aanbod van{" "}
                <Link to={cityPath(cityName)} className="text-primary underline hover:no-underline">woningen in {cityName}</Link>{" "}
                of stel een{" "}
                <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">dagelijkse alert</Link>{" "}
                in om als eerste op de hoogte te zijn van nieuwe woningen.
              </p>
            </div>
          </div>
        </section>

        <RelatedCities currentCity={cityName} />
      </main>
      <Footer />
    </div>
  );
};

export default NeighborhoodPage;
