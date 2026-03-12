import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import SearchFilters, { type SearchFilterValues } from "@/components/search/SearchFilters";
import RelatedCities from "@/components/city/RelatedCities";
import SimilarProperties from "@/components/city/SimilarProperties";
import { useProperties, useFilterFacets } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowRight, ChevronRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { cityPath, citySlugToName } from "@/lib/cities";
import type { Database } from "@/integrations/supabase/types";

type PropertyType = Database["public"]["Enums"]["property_type"];

interface PropertyTypeCityPageProps {
  propertyType: PropertyType;
}

const TYPE_LABELS: Record<PropertyType, { singular: string; plural: string; slug: string }> = {
  appartement: { singular: "appartement", plural: "Appartementen", slug: "appartementen" },
  huis: { singular: "huis", plural: "Huizen", slug: "huizen" },
  studio: { singular: "studio", plural: "Studio's", slug: "studios" },
  kamer: { singular: "kamer", plural: "Kamers", slug: "kamers" },
};

const EMPTY_FILTERS: SearchFilterValues = {
  city: "",
  propertyType: "",
  listingType: "",
  maxPrice: undefined,
  minBedrooms: undefined,
  minSurface: undefined,
  includeInactive: false,
};

const PropertyCardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border bg-card">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="space-y-3 p-4">
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

const PropertyTypeCityPage = ({ propertyType }: PropertyTypeCityPageProps) => {
  const { city: citySlug } = useParams<{ city: string }>();
  const cityName = citySlug ? citySlugToName(citySlug) : undefined;
  const label = TYPE_LABELS[propertyType];
  const locationLabel = cityName || "Nederland";

  const [filters, setFilters] = useState<SearchFilterValues>(EMPTY_FILTERS);

  const { data: facets } = useFilterFacets({
    city: cityName,
    propertyType,
    listingType: filters.listingType || undefined,
    includeInactive: false,
  });

  const { data, isLoading } = useProperties({
    city: cityName,
    propertyType,
    listingType: (filters.listingType as Database["public"]["Enums"]["listing_type"]) || undefined,
    maxPrice: filters.maxPrice,
    minBedrooms: filters.minBedrooms,
    minSurface: filters.minSurface,
    disablePagination: true,
  });

  const properties = data?.properties || [];
  const totalCount = data?.totalCount || 0;

  const hasActiveFilters = Boolean(
    filters.listingType || filters.maxPrice || filters.minBedrooms || filters.minSurface
  );

  // SEO
  const pageTitle = `${label.plural} in ${locationLabel} – beschikbare woningen | WoonPeek`;
  const pageDescription = `Ben je op zoek naar een ${label.singular} in ${locationLabel}? Bekijk ${totalCount} beschikbare ${label.plural.toLowerCase()} in ${locationLabel}. Vergelijk prijzen, foto's en details.`;
  const canonical = citySlug
    ? `https://www.woonpeek.nl/${label.slug}/${citySlug}`
    : `https://www.woonpeek.nl/${label.slug}`;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(cityName
      ? [
          { label: cityName, href: cityPath(cityName) },
          { label: label.plural },
        ]
      : [{ label: label.plural }]),
  ];

  // JSON-LD
  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${label.plural} in ${locationLabel}`,
        description: pageDescription,
        url: canonical,
        isPartOf: { "@type": "WebSite", name: "WoonPeek", url: "https://www.woonpeek.nl" },
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${label.plural} in ${locationLabel}`,
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
    [label.plural, locationLabel, pageDescription, canonical, totalCount, properties]
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
                {label.plural} in {locationLabel}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Ben je op zoek naar een {label.singular} in {locationLabel}? Op deze pagina vind je het actuele
                aanbod van beschikbare {label.plural.toLowerCase()} in {locationLabel}. Bekijk prijzen, foto's en
                details en ontdek welke woning bij je past.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                  {totalCount} {label.plural.toLowerCase()} beschikbaar
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main content with filters */}
        <section className="container py-8">
          <div className="flex gap-6">
            {/* Sidebar filters */}
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-24 rounded-2xl border bg-card p-6">
                <h2 className="mb-4 font-display text-lg font-semibold">Filters</h2>
                <SearchFilters
                  filters={{ ...filters, propertyType: propertyType }}
                  onChange={(f) => setFilters({ ...f, propertyType: propertyType })}
                  onClear={() => setFilters(EMPTY_FILTERS)}
                  hideLocation
                  facets={facets}
                />
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {/* Results header */}
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {label.plural} in {locationLabel}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "Aanbod laden..." : `${totalCount} ${label.plural.toLowerCase()} gevonden`}
                  </p>
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2 lg:hidden">
                      <SlidersHorizontal className="h-4 w-4" /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>Verfijn het aanbod van {label.plural.toLowerCase()} in {locationLabel}.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <SearchFilters
                        filters={{ ...filters, propertyType: propertyType }}
                        onChange={(f) => setFilters({ ...f, propertyType: propertyType })}
                        onClear={() => setFilters(EMPTY_FILTERS)}
                        hideLocation
                        
                        facets={facets}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Property grid */}
              {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              ) : properties.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Geen {label.plural.toLowerCase()} gevonden in {locationLabel}
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Pas de filters aan of bekijk het volledige aanbod van {locationLabel}.
                  </p>
                  {cityName && (
                    <Button asChild variant="outline" className="mt-4">
                      <Link to={cityPath(cityName)}>Alle woningen in {cityName}</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SEO text: [Woningtype] huren in [stad] */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {label.plural} huren in {locationLabel}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Op WoonPeek vind je het meest actuele aanbod van <strong>{label.plural.toLowerCase()} in {locationLabel}</strong>.
                Of je nu een <strong>{label.singular} huren in {locationLabel}</strong> zoekt of een{" "}
                <strong>{label.singular} kopen in {locationLabel}</strong> — wij verzamelen dagelijks nieuw aanbod uit
                meerdere bronnen zodat jij niets mist.
              </p>
              <p>
                Momenteel staan er {totalCount} {label.plural.toLowerCase()} in {locationLabel} op WoonPeek.
                Gebruik de filters om direct te filteren op prijs, aantal kamers en oppervlakte.
                Stel een{" "}
                <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">
                  dagelijkse alert
                </Link>{" "}
                in om als eerste op de hoogte te zijn van nieuwe {label.plural.toLowerCase()} in {locationLabel}.
              </p>
            </div>
          </div>
        </section>

        {/* Internal links: Andere woningen in [stad] */}
        {cityName && (
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
                    Woningen in {cityName}
                  </span>
                </Link>
                {(["appartement", "huis", "studio", "kamer"] as PropertyType[])
                  .filter((t) => t !== propertyType)
                  .map((t) => (
                    <Link
                      key={t}
                      to={`/${TYPE_LABELS[t].slug}/${citySlug}`}
                      className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                    >
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {TYPE_LABELS[t].plural} in {cityName}
                      </span>
                    </Link>
                  ))}
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
                  to={`/koopwoningen/${citySlug}`}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Koopwoningen in {cityName}
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Meer woningen in [stad] */}
        {cityName && (
          <SimilarProperties
            cityName={cityName}
            excludeIds={properties.map((p) => p.id)}
          />
        )}

        {/* Andere steden */}
        {cityName && <RelatedCities currentCity={cityName} />}
      </main>
      <Footer />
    </div>
  );
};

export default PropertyTypeCityPage;
