import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isValidDutchCity, getValidCityName } from "@/lib/dutchCities";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import SearchFilters, { type SearchFilterValues } from "@/components/search/SearchFilters";
import RelatedCities from "@/components/city/RelatedCities";
import SimilarProperties from "@/components/city/SimilarProperties";
import CityMarketStats, { useCityMarketData } from "@/components/city/CityMarketStats";
import CityNeighborhoods from "@/components/city/CityNeighborhoods";
import CityRentalTips from "@/components/city/CityRentalTips";
import { useProperties, useFilterFacets } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowRight, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { cityPath, citySlugToName } from "@/lib/cities";

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

const CityPage = () => {
  const { city: rawCitySlug = "" } = useParams<{ city: string }>();
  const citySlug = rawCitySlug.startsWith("woningen-")
    ? rawCitySlug.replace(/^woningen-/, "")
    : rawCitySlug;
  const validCityName = getValidCityName(citySlug);
  const isInvalidCity = !validCityName;
  const cityName = validCityName || citySlugToName(citySlug);
  const [filters, setFilters] = useState<SearchFilterValues>(EMPTY_FILTERS);

  const { data: facets } = useFilterFacets({
    city: cityName,
    propertyType: filters.propertyType || undefined,
    listingType: filters.listingType || undefined,
    includeInactive: filters.includeInactive,
  });

  const allPropertiesQuery = useProperties({
    city: cityName,
    disablePagination: true,
  });

  const filteredPropertiesQuery = useProperties({
    city: cityName,
    propertyType: filters.propertyType || undefined,
    listingType: filters.listingType || undefined,
    maxPrice: filters.maxPrice,
    minBedrooms: filters.minBedrooms,
    minSurface: filters.minSurface,
    includeInactive: filters.includeInactive,
    disablePagination: true,
  });

  const allProperties = allPropertiesQuery.data?.properties || [];
  const filteredProperties = filteredPropertiesQuery.data?.properties || [];
  const totalCount = allPropertiesQuery.data?.totalCount || 0;
  const filteredCount = filteredPropertiesQuery.data?.totalCount || 0;
  const isLoading = allPropertiesQuery.isLoading || filteredPropertiesQuery.isLoading;

  // Query counts separately to avoid the row limit issue
  const { data: countData } = useQuery({
    queryKey: ["city-listing-counts", cityName],
    queryFn: async () => {
      const { count: huur } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "actief")
        .ilike("city", `%${cityName}%`)
        .eq("listing_type", "huur");
      const { count: koop } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "actief")
        .ilike("city", `%${cityName}%`)
        .eq("listing_type", "koop");
      return { huur: huur || 0, koop: koop || 0 };
    },
  });
  const huurCount = countData?.huur || 0;
  const koopCount = countData?.koop || 0;


  const hasActiveFilters = Boolean(
    filters.propertyType ||
      filters.listingType ||
      filters.maxPrice ||
      filters.minBedrooms ||
      filters.minSurface ||
      filters.includeInactive
  );

  const currentMonth = new Date().toLocaleString("nl-NL", { month: "long" });
  const currentYear = new Date().getFullYear();

  const pageTitle = `Huurwoningen ${cityName} - ${totalCount} te huur en te koop in ${cityName} | ${currentMonth} ${currentYear}`;
  const pageDescription = `Bekijk ${huurCount} huurwoningen en ${koopCount} koopwoningen in ${cityName}. Appartementen, huizen, studio's en kamers. ✓ Dagelijks bijgewerkt ✓ Gratis alerts ✓ ${currentMonth} ${currentYear}`;
  const canonical = `https://www.woonpeek.nl${cityPath(cityName)}`;

  // ── City FAQ items ──
  const cityFaqItems = useMemo(() => [
    {
      question: `Hoeveel woningen zijn er beschikbaar in ${cityName}?`,
      answer: `Op dit moment staan er ${totalCount} woningen in ${cityName} op WoonPeek, waarvan ${huurCount} huurwoningen en ${koopCount} koopwoningen. Het aanbod wordt dagelijks bijgewerkt.`,
    },
    {
      question: `Wat kost een huurwoning in ${cityName}?`,
      answer: `De huurprijzen in ${cityName} variëren per woningtype en locatie. Gebruik de filters op deze pagina om te zoeken op jouw maximale budget. WoonPeek toont ${huurCount} huurwoningen in ${cityName}.`,
    },
    {
      question: `Kan ik een woningalert instellen voor ${cityName}?`,
      answer: `Ja, je kunt een gratis dagelijkse alert instellen voor ${cityName}. Zodra er nieuwe woningen beschikbaar komen ontvang je een e-mail. Stel je alert in via de alertpagina of gebruik de filters op deze stadspagina.`,
    },
    {
      question: `Welke woningtypes zijn beschikbaar in ${cityName}?`,
      answer: `In ${cityName} vind je appartementen, huizen, studio's en kamers. Filter op woningtype om direct het juiste aanbod te bekijken.`,
    },
    {
      question: `Hoe vind ik snel een woning in ${cityName}?`,
      answer: `WoonPeek verzamelt dagelijks nieuw woningaanbod uit meerdere bronnen. Stel een dagelijkse alert in om als eerste te reageren op nieuwe woningen in ${cityName}. Je kunt ook filteren op prijs, kamers en oppervlakte.`,
    },
  ], [cityName, totalCount, huurCount, koopCount]);

  // ── JSON-LD Schemas ──
  const jsonLd = useMemo(
    () => [
      // CollectionPage
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `Woningen in ${cityName}`,
        description: pageDescription,
        url: canonical,
        isPartOf: {
          "@type": "WebSite",
          name: "WoonPeek",
          url: "https://www.woonpeek.nl",
        },
      },
      // ItemList / Carousel (Google-supported rich result)
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Woningen in ${cityName}`,
        numberOfItems: filteredCount,
        itemListElement: filteredProperties.slice(0, 10).map((property, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `https://www.woonpeek.nl/woning/${property.slug || property.id}`,
          name: property.title,
          ...(property.images?.length ? { image: property.images[0] } : {}),
        })),
      },
      // FAQPage (Google-supported rich result)
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: cityFaqItems.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
    [cityName, filteredCount, filteredProperties, pageDescription, canonical, cityFaqItems]
  );

  // Redirect to 404 if city doesn't exist in our known list
  if (isInvalidCity) {
    return <Navigate to="/niet-gevonden" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={pageTitle} description={pageDescription} canonical={canonical} />
      <Header />
      <main className="flex-1">
        {jsonLd.map((schema, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ))}

        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container">
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Steden", href: "/steden" },
                  { label: cityName },
                ]}
              />
            </div>

            <div className="max-w-3xl">
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Huurwoningen {cityName} - te huur in {cityName}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Zoek je een <strong>huurwoning in {cityName}</strong> of wil je een <strong>huis kopen in {cityName}</strong>? Bekijk {totalCount} woningen: {huurCount} huurwoningen en {koopCount} koopwoningen. Dagelijks bijgewerkt met nieuw aanbod van appartementen, huizen, studio's en kamers in {cityName}.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                  {totalCount} totaal aanbod
                </div>
                <Link to={`/huurwoningen/${citySlug}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    Huurwoningen
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {huurCount}
                    </span>
                  </Button>
                </Link>
                <Link to={`/koopwoningen/${citySlug}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    Koopwoningen
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {koopCount}
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-8">
          <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Huis huren of kopen in {cityName}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  De woningmarkt in {cityName} is dynamisch en het aanbod wisselt snel. Of je nu zoekt naar een{" "}
                  <strong>huurwoning in {cityName}</strong>, een <strong>appartement te huur in {cityName}</strong>,
                  een ruim <strong>huis huren in {cityName}</strong> of een <strong>koopwoning in {cityName}</strong>:
                  WoonPeek bundelt dagelijks het nieuwste aanbod van tientallen bronnen op een plek.
                </p>
                <p>
                  Op dit moment zijn er <strong>{totalCount} woningen in {cityName}</strong> beschikbaar,
                  waarvan <strong>{huurCount} huurwoningen</strong> en <strong>{koopCount} koopwoningen</strong>.
                  Het aanbod omvat appartementen, huizen, studio's en kamers. Het wordt dagelijks ververst
                  zodat je altijd het meest actuele overzicht hebt.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-6">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Snel naar alle resultaten
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Wil je dezelfde stad bekijken in de algemene zoekomgeving of op kaart? Open dan de zoekpagina met {cityName} al voorgeselecteerd.
              </p>
              <Link to={`/zoeken?locatie=${encodeURIComponent(cityName)}`} className="mt-5 inline-flex">
                <Button className="gap-2">
                  Open zoeken voor {cityName}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex gap-6">
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-24 rounded-2xl border bg-card p-6">
                <h2 className="mb-4 font-display text-lg font-semibold">Filters</h2>
                <SearchFilters
                  filters={filters}
                  onChange={setFilters}
                  onClear={() => setFilters(EMPTY_FILTERS)}
                  hideLocation
                  facets={facets}
                />
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Beschikbare woningen in {cityName}
              </h2>
                  <p className="text-sm text-muted-foreground">
                    {isLoading
                      ? "Aanbod laden..."
                      : hasActiveFilters
                        ? `${filteredCount} van ${totalCount} woningen zichtbaar`
                        : `${totalCount} woningen gevonden`}
                  </p>
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2 lg:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters voor {cityName}</SheetTitle>
                      <SheetDescription>Verfijn direct het aanbod van deze stad.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <SearchFilters
                        filters={filters}
                        onChange={setFilters}
                        onClear={() => setFilters(EMPTY_FILTERS)}
                        hideLocation
                        facets={facets}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <PropertyCardSkeleton key={index} />
                  ))}
                </div>
              ) : filteredProperties.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Geen woningen gevonden in {cityName}
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Pas de filters aan of wis ze om weer het volledige aanbod van {cityName} te bekijken.
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" className="mt-4" onClick={() => setFilters(EMPTY_FILTERS)}>
                      Filters wissen
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Price stats */}
        <CityPriceStats cityName={cityName} />

        {/* Nieuwste woningen in [stad] */}
        <SimilarProperties
          cityName={cityName}
          excludeIds={filteredProperties.map((p) => p.id)}
        />

        {/* Andere steden */}
        <RelatedCities currentCity={cityName} />

        {/* FAQ Section */}
        <section className="border-t py-12">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Veelgestelde vragen over woningen in {cityName}
            </h2>
            <div className="space-y-4">
              {cityFaqItems.map((faq, i) => (
                <details key={i} className="group rounded-xl border bg-card">
                  <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-foreground list-none flex items-center justify-between gap-4">
                    {faq.question}
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Internal links hub */}
        <section className="border-t py-12">
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Zoek woningen in {cityName}
            </h2>

            {/* By type */}
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Op woningtype</h3>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 mb-6">
              {[
                { label: "Appartementen", href: `/appartementen/${citySlug}` },
                { label: "Huizen", href: `/huizen/${citySlug}` },
                { label: "Studio's", href: `/studios/${citySlug}` },
                { label: "Kamers", href: `/kamers/${citySlug}` },
              ].map((item) => (
                <Link key={item.href} to={item.href} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                  {item.label} in {cityName}
                </Link>
              ))}
            </div>

            {/* Nieuw aanbod link */}
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Nieuw aanbod</h3>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 mb-6">
              <Link to={`/nieuw-aanbod/${citySlug}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                Nieuw aanbod vandaag in {cityName}
              </Link>
            </div>

            {/* By price */}
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Op maximale prijs</h3>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 mb-6">
              {[750, 1000, 1250, 1500, 2000].map((price) => (
                <Link key={price} to={`/woningen/${citySlug}/onder-${price}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                  Woningen onder €{price.toLocaleString("nl-NL")}
                </Link>
              ))}
            </div>

            {/* By bedrooms */}
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">Op aantal kamers</h3>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 mb-6">
              {[1, 2, 3, 4].map((beds) => (
                <Link key={beds} to={`/woningen/${citySlug}/${beds}-kamers`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                  {beds} {beds === 1 ? "kamer" : "kamers"} in {cityName}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Text */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Huurwoning zoeken in {cityName}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Zoek je een <strong>huurwoning in {cityName}</strong>? De huurwoningmarkt in {cityName} is competitief:
                populaire woningen zijn vaak binnen enkele dagen verhuurd. Daarom is het belangrijk om snel te reageren.
                WoonPeek doorzoekt dagelijks tientallen bronnen en toont het nieuwste aanbod
                van <Link to={`/huurwoningen/${citySlug}`} className="text-primary underline hover:no-underline">huurwoningen in {cityName}</Link> direct
                op deze pagina. Momenteel staan er <strong>{huurCount} huurwoningen in {cityName}</strong> online.
              </p>

              <h3 className="font-display text-lg font-semibold text-foreground pt-2">
                Koopwoningen in {cityName}
              </h3>
              <p>
                Wil je liever een <strong>huis kopen in {cityName}</strong>? Bekijk ons overzicht
                van <Link to={`/koopwoningen/${citySlug}`} className="text-primary underline hover:no-underline">koopwoningen in {cityName}</Link>.
                Op dit moment zijn er <strong>{koopCount} koopwoningen in {cityName}</strong> beschikbaar.
                Vergelijk prijzen, bekijk foto's en reageer direct bij de makelaar.
              </p>

              <h3 className="font-display text-lg font-semibold text-foreground pt-2">
                Zoek op woningtype in {cityName}
              </h3>
              <p>
                Het aanbod in {cityName} omvat alle woningtypes:{" "}
                <Link to={`/appartementen/${citySlug}`} className="text-primary underline hover:no-underline">appartementen in {cityName}</Link>,{" "}
                <Link to={`/huizen/${citySlug}`} className="text-primary underline hover:no-underline">huizen in {cityName}</Link>,{" "}
                <Link to={`/studios/${citySlug}`} className="text-primary underline hover:no-underline">studio's in {cityName}</Link> en{" "}
                <Link to={`/kamers/${citySlug}`} className="text-primary underline hover:no-underline">kamers in {cityName}</Link>.
              </p>

              <h3 className="font-display text-lg font-semibold text-foreground pt-2">
                Zoek op budget in {cityName}
              </h3>
              <p>
                Op zoek naar een <strong>goedkope huurwoning in {cityName}</strong>? Bekijk woningen{" "}
                <Link to={`/woningen/${citySlug}/onder-750`} className="text-primary underline hover:no-underline">onder €750</Link>,{" "}
                <Link to={`/woningen/${citySlug}/onder-1000`} className="text-primary underline hover:no-underline">onder €1.000</Link> of{" "}
                <Link to={`/woningen/${citySlug}/onder-1500`} className="text-primary underline hover:no-underline">onder €1.500</Link>.
                Zoek je meer ruimte? Filter op{" "}
                <Link to={`/woningen/${citySlug}/2-kamers`} className="text-primary underline hover:no-underline">2 kamers</Link>,{" "}
                <Link to={`/woningen/${citySlug}/3-kamers`} className="text-primary underline hover:no-underline">3 kamers</Link> of{" "}
                <Link to={`/woningen/${citySlug}/4-kamers`} className="text-primary underline hover:no-underline">4+ kamers</Link>.
              </p>

              <p>
                Stel een gratis{" "}
                <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">dagelijkse woningalert</Link>{" "}
                in en ontvang elke dag het nieuwste aanbod van {cityName} in je inbox. Zo mis je geen enkele nieuwe woning.
              </p>

              <p>
                Lees ook onze{" "}
                <Link to="/blog" className="text-primary underline hover:no-underline">blog</Link>{" "}
                voor tips over woningen zoeken en de woningmarkt. Of gebruik de{" "}
                <Link to="/budget-tool" className="text-primary underline hover:no-underline">budget tool</Link>{" "}
                om te berekenen hoeveel huur je kunt betalen. Bekijk daarnaast de{" "}
                <Link to="/huurprijsmonitor" className="text-primary underline hover:no-underline">huurprijsmonitor</Link>{" "}
                voor actuele huurprijzen in {cityName} en andere steden.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CityPage;
