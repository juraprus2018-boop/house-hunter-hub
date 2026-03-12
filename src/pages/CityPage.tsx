import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const cityName = citySlugToName(citySlug);
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

  const pageTitle = `Woningen in ${cityName} | WoonPeek`;
  const pageDescription = `Bekijk ${totalCount} woningen in ${cityName}, filter direct op type en prijs en ontdek het complete aanbod op WoonPeek.`;
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
                Woningen in {cityName}
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Bekijk alle woningen van {cityName}, gebruik filters om sneller te zoeken en ontdek direct het actuele aanbod.
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
                Wonen in {cityName}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Op deze stadspagina vind je het complete woningaanbod van {cityName}. Je ziet hier appartementen,
                  huizen, studio&apos;s en kamers die nu actief beschikbaar zijn op WoonPeek.
                </p>
                <p>
                  We combineren aanbod uit meerdere bronnen en tonen op dit moment {totalCount} woningen in {cityName}.
                  Daarvan zijn {huurCount} woningen te huur en {koopCount} woningen te koop.
                </p>
                <p>
                  Gebruik de filters hieronder om het aanbod van {cityName} direct te verfijnen op woningtype,
                  aanbod, prijs, slaapkamers en oppervlakte.
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
                    Woningen van {cityName}
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

        {/* Similar Properties */}
        <SimilarProperties
          cityName={cityName}
          excludeIds={filteredProperties.map((p) => p.id)}
        />

        {/* Related Cities */}
        <RelatedCities currentCity={cityName} />

        {/* SEO Text */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Alles over woningen in {cityName}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Ben je op zoek naar een <strong>huurwoning {cityName}</strong>? Op WoonPeek vind je het meest actuele overzicht
                van huur- en koopwoningen in {cityName}. Of je nu een <strong>appartement {cityName}</strong> zoekt of liever
                een ruim <strong>huis huren {cityName}</strong>, wij verzamelen dagelijks nieuw aanbod uit tientallen bronnen
                zodat jij niets mist.
              </p>
              <p>
                Het aanbod op deze pagina bevat alle woningtypes: appartementen, eengezinswoningen, studio&apos;s en kamers.
                Zoek je specifiek een <strong>woning huren {cityName}</strong>? Gebruik dan de filters hierboven om direct
                te filteren op huur of koop, woningtype, prijs en oppervlakte. Momenteel staan er {totalCount} woningen
                in {cityName} op WoonPeek, waarvan {huurCount} huurwoningen en {koopCount} koopwoningen.
              </p>
              <p>
                <strong>Appartement huren {cityName}</strong> is populair bij starters en young professionals. Zoek je juist
                een <strong>kamer huren {cityName}</strong>? Ook daarvoor bieden we uitgebreid aanbod. Daarnaast vind je hier
                ook <strong>huizen te koop {cityName}</strong> als je liever wilt kopen dan huren.
              </p>
              <p>
                Op zoek naar een <strong>goedkope huurwoning {cityName}</strong>? Sorteer op prijs en vind snel betaalbare
                opties. Wil je een <strong>appartement huren {cityName} centrum</strong>? Filter op wijk of gebruik de
                zoekpagina met kaartweergave. We tonen ook aanbod van particuliere verhuurders — ideaal als je een{" "}
                <strong>huurwoning {cityName} particulier</strong> zoekt.
              </p>
              <p>
                Veel woningzoekers vragen zich af of het mogelijk is een <strong>woning huren {cityName} zonder inschrijving</strong>.
                Op WoonPeek tonen we aanbod van verschillende bronnen, waaronder particuliere aanbieders die soms geen
                inschrijving vereisen. Zoek je een <strong>huis te koop {cityName} met tuin</strong>? Bekijk het koopwoningenaanbod
                en filter op jouw wensen.
              </p>
              <p>
                Bekijk ook de aparte overzichtspagina&apos;s
                voor <Link to={`/huurwoningen/${citySlug}`} className="text-primary underline hover:no-underline">huurwoningen in {cityName}</Link> en{" "}
                <Link to={`/koopwoningen/${citySlug}`} className="text-primary underline hover:no-underline">koopwoningen in {cityName}</Link>.
                Het aanbod verandert doorlopend — stel een{" "}
                <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">dagelijkse alert</Link>{" "}
                in en mis geen enkel nieuw aanbod in {cityName}.
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
