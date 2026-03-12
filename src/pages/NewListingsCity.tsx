import { useMemo, useState } from "react";
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
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
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

const NewListingsCity = () => {
  const { city: citySlug } = useParams<{ city: string }>();
  const cityName = citySlug ? citySlugToName(citySlug) : "Nederland";
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  const { startIso, endIso, dateLabel } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      dateLabel: new Intl.DateTimeFormat("nl-NL", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      }).format(start),
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["new-listings-city", citySlug, startIso, endIso, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("properties")
        .select("*", { count: "exact" })
        .eq("status", "actief")
        .gte("created_at", startIso)
        .lt("created_at", endIso)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (citySlug) {
        query = query.ilike("city", `%${cityName}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { properties: (data ?? []) as Property[], totalCount: count ?? 0 };
    },
    staleTime: 5 * 60 * 1000,
  });

  const properties = data?.properties ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

  const h1 = `Nieuw aanbod in ${cityName} vandaag`;
  const pageTitle = `Nieuw aanbod in ${cityName} vandaag – nieuwe woningen | WoonPeek`;
  const pageDescription = `Bekijk ${totalCount} nieuwe woningen in ${cityName} van vandaag (${dateLabel}). Ontdek de nieuwste huurwoningen en koopwoningen als eerste op WoonPeek.`;
  const canonical = `https://www.woonpeek.nl/nieuw-aanbod/${citySlug}`;

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
  ], [h1, pageDescription, canonical, totalCount, properties]);

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
                { label: "Nieuw aanbod" },
              ]} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">{h1}</h1>
                <p className="text-muted-foreground">
                  {isLoading ? "Laden..." : `${totalCount} nieuwe woningen op ${dateLabel}`}
                </p>
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
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Vorige</Button>
                  <span className="text-sm text-muted-foreground">Pagina {currentPage} van {totalPages}</span>
                  <Button variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Volgende</Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <h2 className="font-display text-xl font-semibold">Nog geen nieuw aanbod vandaag in {cityName}</h2>
              <p className="mt-2 text-muted-foreground">Er zijn vandaag nog geen nieuwe woningen in {cityName} geplaatst. Kom later nog eens terug.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to={cityPath(cityName)}>Alle woningen in {cityName}</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Internal links */}
        <section className="border-t py-12">
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Meer zoeken in {cityName}
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
              <Link to={`/woningen/${citySlug}/onder-1000`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">Woningen onder €1.000</span>
              </Link>
              <Link to={`/kamers/${citySlug}`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">Kamers in {cityName}</span>
              </Link>
              <Link to="/dagelijkse-alert" className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">Dagelijkse alert instellen</span>
              </Link>
            </div>
          </div>
        </section>

        {/* SEO text */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container max-w-3xl">
            <h2 className="mb-4 font-display text-2xl font-bold">Dagelijks nieuw woningaanbod in {cityName}</h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Op deze pagina vind je uitsluitend het nieuwe woningaanbod dat vandaag is toegevoegd in {cityName}.
                Zo zie je direct welke <strong>huurwoningen in {cityName}</strong> en <strong>koopwoningen in {cityName}</strong> als eerste online zijn gekomen.
              </p>
              <p>
                WoonPeek scant dagelijks meerdere woningplatforms in heel Nederland. Nieuwe woningen in {cityName} worden
                automatisch verwerkt en verschijnen op deze pagina zodra ze beschikbaar zijn.
              </p>
              <p>
                Wil je geen dag missen? Stel een gratis{" "}
                <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">dagelijkse alert</Link>{" "}
                in en ontvang elke dag een e-mail met nieuw aanbod.
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

export default NewListingsCity;
