import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import { useProperties } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ListingType = Database["public"]["Enums"]["listing_type"];

interface ListingTypePageProps {
  listingType: "huur" | "koop";
}

const LABELS: Record<string, { plural: string; singular: string; slug: string }> = {
  huur: { plural: "Huurwoningen", singular: "huurwoning", slug: "huurwoningen" },
  koop: { plural: "Koopwoningen", singular: "koopwoning", slug: "koopwoningen" },
};

const PropertyCardSkeleton = () => (
  <div className="rounded-lg border bg-card overflow-hidden">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-1/3" />
    </div>
  </div>
);

const ListingTypePage = ({ listingType }: ListingTypePageProps) => {
  const { city: citySlug } = useParams<{ city: string }>();
  const cityName = citySlug
    ? citySlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : undefined;

  const label = LABELS[listingType];

  const { data, isLoading } = useProperties({
    listingType: listingType as ListingType,
    city: cityName,
    pageSize: 50,
  });

  const properties = data?.properties || [];
  const totalCount = data?.totalCount || 0;

  const pageTitle = cityName
    ? `${label.plural} in ${cityName} | WoonPeek`
    : `${label.plural} in Nederland | WoonPeek`;

  const pageDesc = cityName
    ? `Bekijk ${totalCount} ${label.plural.toLowerCase()} in ${cityName}. Vind jouw ${label.singular} op WoonPeek.`
    : `Bekijk ${totalCount} ${label.plural.toLowerCase()} in heel Nederland. Vind jouw ${label.singular} op WoonPeek.`;

  const canonical = cityName
    ? `https://woonpeek.nl/${label.slug}/${citySlug}`
    : `https://woonpeek.nl/${label.slug}`;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(cityName
      ? [
          { label: label.plural, href: `/${label.slug}` },
          { label: cityName },
        ]
      : [{ label: label.plural }]),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    description: pageDesc,
    numberOfItems: totalCount,
    itemListElement: properties.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://woonpeek.nl/woning/${p.slug || p.id}`,
    })),
  };

  const locationLabel = cityName || "Nederland";

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={pageTitle} description={pageDesc} canonical={canonical} />
      <Header />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container">
            <div className="mb-4">
              <Breadcrumbs items={breadcrumbs} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  {label.plural} in {locationLabel}
                </h1>
                <p className="text-muted-foreground">
                  {totalCount} {totalCount === 1 ? label.singular : label.plural.toLowerCase()}{" "}
                  beschikbaar
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Properties */}
        <section className="container py-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : properties.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  to={`/zoeken?aanbod=${listingType}${cityName ? `&locatie=${encodeURIComponent(cityName)}` : ""}`}
                >
                  <Button variant="outline" className="gap-2">
                    Bekijk alle {label.plural.toLowerCase()}
                    {cityName ? ` in ${cityName}` : ""}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="font-display text-xl font-semibold">
                Geen {label.plural.toLowerCase()} in {locationLabel}
              </h2>
              <p className="mt-2 text-muted-foreground">
                Er zijn momenteel geen {label.plural.toLowerCase()} beschikbaar
                {cityName ? ` in ${cityName}` : ""}. Probeer later opnieuw.
              </p>
              <Link to="/zoeken">
                <Button className="mt-4">Alle woningen bekijken</Button>
              </Link>
            </div>
          )}
        </section>

        {/* SEO Text */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl font-bold mb-4">
              {label.plural} {cityName ? `in ${cityName}` : "in Nederland"}
            </h2>
            <div className="prose prose-muted text-muted-foreground text-sm space-y-3">
              <p>
                Op WoonPeek vind je het meest actuele aanbod van{" "}
                {label.plural.toLowerCase()}{" "}
                {cityName ? `in ${cityName}` : "door heel Nederland"}. We
                verzamelen dagelijks het nieuwste woningaanbod van meerdere
                bronnen zodat je niets mist.
              </p>
              <p>
                Momenteel zijn er {totalCount}{" "}
                {label.plural.toLowerCase()} beschikbaar
                {cityName ? ` in ${cityName}` : ""}. Gebruik de filters op onze
                zoekpagina om snel de perfecte {label.singular} te vinden.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ListingTypePage;
