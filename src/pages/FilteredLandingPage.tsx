import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import SimilarProperties from "@/components/city/SimilarProperties";
import RelatedCities from "@/components/city/RelatedCities";
import { useProperties } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { cityPath, citySlugToName } from "@/lib/cities";
import type { Database } from "@/integrations/supabase/types";

type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

const TYPE_LABELS: Record<string, { singular: string; plural: string; slug: string }> = {
  appartement: { singular: "appartement", plural: "Appartementen", slug: "appartementen" },
  huis: { singular: "huis", plural: "Huizen", slug: "huizen" },
  studio: { singular: "studio", plural: "Studio's", slug: "studios" },
  kamer: { singular: "kamer", plural: "Kamers", slug: "kamers" },
};

const PRICE_THRESHOLDS = [750, 1000, 1250, 1500, 2000];
const BEDROOM_OPTIONS = [1, 2, 3, 4];

const formatEuro = (price: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(price);

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

/**
 * Renders SEO landing pages for filter combinations.
 * URL patterns:
 *   /woningen/:city/onder-:price        → max price filter
 *   /woningen/:city/:bedrooms-kamers    → bedroom filter
 */
const FilteredLandingPage = () => {
  const { city: citySlug, filter } = useParams<{ city: string; filter: string }>();
  const cityName = citySlug ? citySlugToName(citySlug) : "Nederland";

  // Parse filter from URL
  const parsed = useMemo(() => {
    if (!filter) return { maxPrice: undefined, minBedrooms: undefined, label: "" };

    const priceMatch = filter.match(/^onder-(\d+)$/);
    if (priceMatch) {
      const price = parseInt(priceMatch[1], 10);
      return { maxPrice: price, minBedrooms: undefined, label: `onder ${formatEuro(price)}` };
    }

    const bedroomMatch = filter.match(/^(\d+)-kamers$/);
    if (bedroomMatch) {
      const beds = parseInt(bedroomMatch[1], 10);
      return { maxPrice: undefined, minBedrooms: beds, label: `met ${beds} kamers` };
    }

    return { maxPrice: undefined, minBedrooms: undefined, label: "" };
  }, [filter]);

  const { data, isLoading } = useProperties({
    city: citySlug ? citySlugToName(citySlug) : undefined,
    maxPrice: parsed.maxPrice,
    minBedrooms: parsed.minBedrooms,
    disablePagination: true,
  });

  const properties = data?.properties || [];
  const totalCount = data?.totalCount || 0;

  // SEO content
  const filterLabel = parsed.label;
  const h1 = `Woningen in ${cityName} ${filterLabel}`;
  const pageTitle = `Woningen in ${cityName} ${filterLabel} – beschikbaar aanbod | WoonPeek`;
  const pageDescription = `Bekijk ${totalCount} woningen in ${cityName} ${filterLabel}. Vergelijk huurwoningen, appartementen en huizen. Dagelijks bijgewerkt op WoonPeek.`;
  const canonical = `https://www.woonpeek.nl/woningen/${citySlug}/${filter}`;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: cityName, href: cityPath(cityName) },
    { label: `Woningen ${filterLabel}` },
  ];

  const jsonLd = useMemo(
    () => [
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
          ...(p.images?.length ? { image: p.images[0] } : {}),
        })),
      },
    ],
    [h1, pageDescription, canonical, totalCount, properties]
  );

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
              <Breadcrumbs items={breadcrumbs} />
            </div>
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                {h1}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Op zoek naar een woning in {cityName} {filterLabel}? Hier vind je het actuele aanbod van
                beschikbare woningen. Gebruik de filters om snel een woning te vinden die bij jouw wensen past.
              </p>
              <div className="mt-4 rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-sm inline-block">
                {totalCount} woningen gevonden
              </div>
            </div>
          </div>
        </section>

        {/* Property grid */}
        <section className="container py-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="font-display text-lg font-semibold text-foreground">
                Geen woningen gevonden in {cityName} {filterLabel}
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Bekijk het volledige aanbod van {cityName} of pas je zoekcriteria aan.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to={cityPath(cityName)}>Alle woningen in {cityName}</Link>
              </Button>
            </div>
          )}
        </section>

        {/* SEO text */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Wonen in {cityName}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                {cityName} biedt een divers woningaanbod voor elke woningzoeker. Of je nu zoekt naar een
                <strong> betaalbare huurwoning in {cityName}</strong>, een <strong>appartement in {cityName}</strong> of
                een <strong>ruim huis</strong> — op WoonPeek vind je dagelijks nieuw aanbod uit meerdere bronnen.
              </p>
              <p>
                Op dit moment zijn er {totalCount} woningen beschikbaar in {cityName} {filterLabel}.
                Stel een{" "}
                <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">
                  dagelijkse alert
                </Link>{" "}
                in om als eerste op de hoogte te zijn van nieuwe woningen in {cityName}.
              </p>
            </div>
          </div>
        </section>

        {/* Internal links */}
        <section className="border-t py-12">
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Andere woningen in {cityName}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <Link
                to={cityPath(cityName)}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Alle woningen in {cityName}
                </span>
              </Link>
              <Link
                to={`/huurwoningen/${citySlug}`}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Huurwoningen in {cityName}
                </span>
              </Link>
              <Link
                to={`/appartementen/${citySlug}`}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Appartementen in {cityName}
                </span>
              </Link>
              {/* Price-based links */}
              {PRICE_THRESHOLDS.filter((p) => p !== parsed.maxPrice).slice(0, 3).map((price) => (
                <Link
                  key={`price-${price}`}
                  to={`/woningen/${citySlug}/onder-${price}`}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Woningen onder {formatEuro(price)}
                  </span>
                </Link>
              ))}
              {/* Bedroom-based links */}
              {BEDROOM_OPTIONS.filter((b) => b !== parsed.minBedrooms).slice(0, 3).map((beds) => (
                <Link
                  key={`beds-${beds}`}
                  to={`/woningen/${citySlug}/${beds}-kamers`}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Woningen met {beds} kamers
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Nieuwste woningen */}
        {citySlug && (
          <SimilarProperties
            cityName={cityName}
            excludeIds={properties.map((p) => p.id)}
          />
        )}

        {/* Andere steden */}
        {citySlug && <RelatedCities currentCity={cityName} />}
      </main>
      <Footer />
    </div>
  );
};

export default FilteredLandingPage;
