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

  const ITEMS_PER_PAGE = 12;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
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
  const visibleProperties = properties.slice(0, visibleCount);
  const handleLoadMore = () => setVisibleCount((c) => c + ITEMS_PER_PAGE);

  const hasActiveFilters = Boolean(
    filters.listingType || filters.maxPrice || filters.minBedrooms || filters.minSurface
  );

  const currentMonth = new Date().toLocaleString("nl-NL", { month: "long" });
  const currentYear = new Date().getFullYear();

  // SEO
  const pageTitle = cityName
    ? `${label.plural} ${cityName}: ${totalCount} ${label.plural.toLowerCase()} te huur & koop (${currentMonth} ${currentYear}) | WoonPeek`
    : `${label.plural} Nederland: huur en koop aanbod | WoonPeek`;
  const pageDescription = cityName
    ? `${totalCount} ${label.plural.toLowerCase()} in ${cityName}. Bekijk huurprijzen, foto's en details. ✓ Dagelijks bijgewerkt ✓ Gratis alerts ✓ ${currentMonth} ${currentYear}`
    : `Op zoek naar een ${label.singular}? Bekijk het actuele aanbod van ${label.plural.toLowerCase()} in heel Nederland op WoonPeek.`;
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

  // FAQ items
  const faqItems = useMemo(() => [
    {
      question: `Hoeveel ${label.plural.toLowerCase()} zijn er beschikbaar in ${locationLabel}?`,
      answer: `Op dit moment staan er ${totalCount} ${label.plural.toLowerCase()} in ${locationLabel} op WoonPeek. Het aanbod wordt dagelijks bijgewerkt.`,
    },
    {
      question: `Wat kost een ${label.singular} in ${locationLabel}?`,
      answer: `De prijzen van ${label.plural.toLowerCase()} in ${locationLabel} variëren per locatie en grootte. Gebruik de filters op deze pagina om te zoeken op jouw maximale budget.`,
    },
    {
      question: `Hoe vind ik snel een ${label.singular} in ${locationLabel}?`,
      answer: `WoonPeek verzamelt dagelijks nieuw woningaanbod. Stel een dagelijkse alert in om als eerste te reageren op nieuwe ${label.plural.toLowerCase()} in ${locationLabel}.`,
    },
    {
      question: `Kan ik een alert instellen voor ${label.plural.toLowerCase()} in ${locationLabel}?`,
      answer: `Ja, je kunt een gratis dagelijkse alert instellen. Zodra er nieuwe ${label.plural.toLowerCase()} beschikbaar komen in ${locationLabel} ontvang je een e-mail.`,
    },
  ], [label, locationLabel, totalCount]);

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
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
    [label.plural, locationLabel, pageDescription, canonical, totalCount, properties, faqItems]
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
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                {label.plural} in {locationLabel}: te huur en te koop
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Zoek je een <strong>{label.singular} in {locationLabel}</strong>? Bekijk {totalCount} beschikbare{" "}
                {label.plural.toLowerCase()} met prijzen, foto's en details. Of je nu een{" "}
                <strong>{label.singular} wilt huren</strong> of <strong>kopen in {locationLabel}</strong>, WoonPeek
                bundelt dagelijks het nieuwste aanbod uit tientallen bronnen.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                  {totalCount} {label.plural.toLowerCase()} beschikbaar
                </div>
                {cityName && (
                  <Link to="/dagelijkse-alert" className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                    Dagelijkse alert instellen
                  </Link>
                )}
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
                  {visibleProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                {visibleCount < properties.length && (
                  <div className="mt-8 text-center">
                    <Button variant="outline" className="gap-2" onClick={handleLoadMore}>
                      Meer woningen laden ({properties.length - visibleCount} resterend)
                    </Button>
                  </div>
                )}
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

        {/* SEO text: [Woningtype] in [stad] */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {label.singular.charAt(0).toUpperCase() + label.singular.slice(1)} zoeken in {locationLabel}
            </h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                Op WoonPeek vind je het meest actuele aanbod van <strong>{label.plural.toLowerCase()} in {locationLabel}</strong>.
                Of je nu een <strong>{label.singular} huren in {locationLabel}</strong> zoekt of een{" "}
                <strong>{label.singular} kopen in {locationLabel}</strong>, wij verzamelen dagelijks nieuw aanbod uit
                meerdere bronnen zodat jij niets mist. Zo vind je sneller een woning dan op andere platforms.
              </p>
              <p>
                Momenteel staan er <strong>{totalCount} {label.plural.toLowerCase()}</strong> in {locationLabel} op WoonPeek.
                Gebruik de filters om direct te filteren op prijs, aantal kamers en oppervlakte.
                {cityName && (
                  <> De woningmarkt in {cityName} is vaak krap, waardoor het belangrijk is om snel te reageren op
                  nieuw aanbod. </>
                )}
                Stel een{" "}
                <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">
                  dagelijkse alert
                </Link>{" "}
                in om als eerste op de hoogte te zijn van nieuwe {label.plural.toLowerCase()} in {locationLabel}.
              </p>
              {cityName && (
                <p>
                  Naast {label.plural.toLowerCase()} vind je op WoonPeek ook{" "}
                  {(["appartement", "huis", "studio", "kamer"] as PropertyType[])
                    .filter((t) => t !== propertyType)
                    .slice(0, 3)
                    .map((t, i, arr) => (
                      <span key={t}>
                        <Link to={`/${TYPE_LABELS[t].slug}/${citySlug}`} className="text-primary underline hover:no-underline">
                          {TYPE_LABELS[t].plural.toLowerCase()} in {cityName}
                        </Link>
                        {i < arr.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  . Vergelijk het volledige aanbod en vind de woning die bij jou past.
                </p>
              )}
            </div>

            {/* Extra SEO-blok */}
            <h3 className="mt-10 font-display text-xl font-semibold text-foreground">
              Tips voor het vinden van een {label.singular} in {locationLabel}
            </h3>
            <div className="mt-3 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                De vraag naar <strong>{label.plural.toLowerCase()} in {locationLabel}</strong> is groot. Het is daarom
                verstandig om meerdere kanalen te gebruiken. WoonPeek bundelt het aanbod van verschillende websites,
                zodat je geen enkele woning mist. Hieronder een paar tips:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Reageer snel</strong>: Nieuwe {label.plural.toLowerCase()} in {locationLabel} zijn vaak
                  binnen een paar dagen verhuurd. Stel een{" "}
                  <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">
                    dagelijkse alert
                  </Link>{" "}
                  in om als eerste op de hoogte te zijn.
                </li>
                <li>
                  <strong>Gebruik filters</strong>: Filter op maximale prijs, aantal kamers of oppervlakte om
                  alleen relevante {label.plural.toLowerCase()} te zien.
                </li>
                <li>
                  <strong>Bekijk ook andere woningtypes</strong>: Naast {label.plural.toLowerCase()} kun je ook
                  zoeken op andere categorieën. Verbreed je zoekopdracht om meer kans te maken.
                </li>
                <li>
                  <strong>Vergelijk prijzen</strong>: Bekijk de prijzen van vergelijkbare{" "}
                  {label.plural.toLowerCase()} in {locationLabel} om een realistisch beeld te krijgen van de markt.
                </li>
              </ul>
              <p>
                Op{" "}
                <Link to="/" className="text-primary underline hover:no-underline">
                  WoonPeek
                </Link>{" "}
                kun je volledig gratis zoeken naar {label.plural.toLowerCase()} in {locationLabel} en door heel Nederland.
                Begin vandaag nog met zoeken en vind jouw ideale {label.singular}.
              </p>
            </div>
          </div>
        </section>

        {/* Internal links: Andere woningen in [stad] */}
        {cityName && (
          <section className="border-t py-12">
            <div className="container">
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                Andere woningen in {cityName}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                <Link to={cityPath(cityName)} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                  Alle woningen in {cityName}
                </Link>
                {(["appartement", "huis", "studio", "kamer"] as PropertyType[])
                  .filter((t) => t !== propertyType)
                  .map((t) => (
                    <Link key={t} to={`/${TYPE_LABELS[t].slug}/${citySlug}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                      {TYPE_LABELS[t].plural} in {cityName}
                    </Link>
                  ))}
                <Link to={`/huurwoningen/${citySlug}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                  Huurwoningen in {cityName}
                </Link>
                <Link to={`/koopwoningen/${citySlug}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                  Koopwoningen in {cityName}
                </Link>
                {[750, 1000, 1500].map((price) => (
                  <Link key={price} to={`/woningen/${citySlug}/onder-${price}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                    Woningen onder €{price.toLocaleString("nl-NL")}
                  </Link>
                ))}
                {[2, 3].map((beds) => (
                  <Link key={beds} to={`/woningen/${citySlug}/${beds}-kamers`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                    {beds} kamers in {cityName}
                  </Link>
                ))}
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

        {/* FAQ */}
        {cityName && (
          <section className="border-t py-12">
            <div className="container">
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                Veelgestelde vragen over {label.plural.toLowerCase()} in {cityName}
              </h2>
              <div className="space-y-4">
                {faqItems.map((faq, i) => (
                  <details key={i} className="group rounded-xl border bg-card">
                    <summary className="cursor-pointer px-6 py-4 text-base font-semibold text-foreground list-none flex items-center justify-between gap-4">
                      {faq.question}
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-5 text-base leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Andere steden */}
        {cityName && <RelatedCities currentCity={cityName} />}
      </main>
      <Footer />
    </div>
  );
};

export default PropertyTypeCityPage;
