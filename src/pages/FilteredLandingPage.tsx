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
import { ArrowRight, ChevronRight, MapPin, Search } from "lucide-react";
import { cityPath, citySlugToName } from "@/lib/cities";
import type { Database } from "@/integrations/supabase/types";

type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

interface FilteredLandingPageProps {
  propertyType?: PropertyType;
  listingType?: ListingType;
}

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
const FilteredLandingPage = ({ propertyType, listingType }: FilteredLandingPageProps = {}) => {
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
    propertyType: propertyType || undefined,
    listingType: listingType || undefined,
    disablePagination: true,
  });

  const properties = data?.properties || [];
  const totalCount = data?.totalCount || 0;

  const typeLabel = propertyType ? TYPE_LABELS[propertyType] : null;
  const listingLabel = listingType === "huur" ? "huur" : listingType === "koop" ? "koop" : null;
  const typePrefix = typeLabel ? typeLabel.plural : listingLabel === "huur" ? "Huurwoningen" : listingLabel === "koop" ? "Koopwoningen" : "Woningen";
  const typePrefixLower = typePrefix.toLowerCase();

  const currentMonth = new Date().toLocaleString("nl-NL", { month: "long" });
  const currentYear = new Date().getFullYear();

  // Calculate data-driven stats
  const avgPrice = properties.length > 0
    ? Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length)
    : 0;
  const avgSurface = properties.length > 0
    ? Math.round(properties.filter(p => p.surface_area).reduce((sum, p) => sum + (p.surface_area || 0), 0) / properties.filter(p => p.surface_area).length) || 0
    : 0;
  const huurCount = properties.filter(p => p.listing_type === "huur").length;
  const koopCount = properties.filter(p => p.listing_type === "koop").length;
  const typeBreakdown = Object.entries(
    properties.reduce((acc, p) => { acc[p.property_type] = (acc[p.property_type] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  // Unique SEO content based on filter type
  const filterLabel = parsed.label;
  const isPriceFilter = !!parsed.maxPrice;
  const isBedroomFilter = !!parsed.minBedrooms;

  const h1 = isPriceFilter
    ? `${typePrefix} in ${cityName} onder ${formatEuro(parsed.maxPrice!)}`
    : isBedroomFilter
    ? `${parsed.minBedrooms}-kamer ${typePrefixLower} in ${cityName}`
    : `${typePrefix} in ${cityName} ${filterLabel}`;

  const pageTitle = isPriceFilter
    ? `${typePrefix} ${cityName} onder ${formatEuro(parsed.maxPrice!)}: ${totalCount} beschikbaar (${currentMonth} ${currentYear}) | WoonPeek`
    : isBedroomFilter
    ? `${parsed.minBedrooms}-kamer ${typePrefixLower} ${cityName}: ${totalCount} beschikbaar (${currentMonth} ${currentYear}) | WoonPeek`
    : `${typePrefix} ${cityName} ${filterLabel}: ${totalCount} beschikbaar (${currentMonth} ${currentYear}) | WoonPeek`;

  const pageDescription = isPriceFilter
    ? `${totalCount} ${typePrefixLower} in ${cityName} onder ${formatEuro(parsed.maxPrice!)}. Gemiddelde prijs: ${formatEuro(avgPrice)}. ✓ Dagelijks bijgewerkt ✓ ${currentMonth} ${currentYear}`
    : isBedroomFilter
    ? `${totalCount} ${typePrefixLower} met ${parsed.minBedrooms}+ kamers in ${cityName}. ${huurCount} huurwoningen, ${koopCount} koopwoningen. ✓ Dagelijks bijgewerkt ✓ ${currentMonth} ${currentYear}`
    : `${totalCount} ${typePrefixLower} in ${cityName} ${filterLabel}. ✓ Dagelijks bijgewerkt ✓ Gratis alerts ✓ ${currentMonth} ${currentYear}`;

  // Build canonical based on route type
  const canonicalBase = typeLabel
    ? `https://www.woonpeek.nl/${typeLabel.slug}/${citySlug}/${filter}`
    : listingLabel === "huur"
    ? `https://www.woonpeek.nl/huurwoningen/${citySlug}/${filter}`
    : listingLabel === "koop"
    ? `https://www.woonpeek.nl/koopwoningen/${citySlug}/${filter}`
    : `https://www.woonpeek.nl/woningen/${citySlug}/${filter}`;
  const canonical = canonicalBase;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: cityName, href: cityPath(cityName) },
    { label: isPriceFilter ? `Onder ${formatEuro(parsed.maxPrice!)}` : isBedroomFilter ? `${parsed.minBedrooms} kamers` : `Woningen ${filterLabel}` },
  ];

  // FAQ items
  const faqItems = useMemo(() => {
    if (isPriceFilter) return [
      {
        question: `Hoeveel woningen in ${cityName} zijn er onder ${formatEuro(parsed.maxPrice!)}?`,
        answer: `Op dit moment zijn er ${totalCount} woningen beschikbaar in ${cityName} onder ${formatEuro(parsed.maxPrice!)}. Hiervan zijn ${huurCount} huurwoningen en ${koopCount} koopwoningen. De gemiddelde prijs is ${formatEuro(avgPrice)}.`,
      },
      {
        question: `Welke woningtypes zijn beschikbaar in ${cityName} onder ${formatEuro(parsed.maxPrice!)}?`,
        answer: `Het aanbod bestaat uit ${typeBreakdown.map(([type, count]) => `${count} ${TYPE_LABELS[type]?.plural?.toLowerCase() || type}`).join(", ")}. ${avgSurface > 0 ? `De gemiddelde oppervlakte is ${avgSurface} m².` : ""}`,
      },
      {
        question: `Hoe kan ik een betaalbare woning vinden in ${cityName}?`,
        answer: `Stel een gratis dagelijkse alert in op WoonPeek. Je ontvangt dan elke dag een overzicht van nieuwe woningen in ${cityName} onder ${formatEuro(parsed.maxPrice!)} zodra ze online komen.`,
      },
    ];
    if (isBedroomFilter) return [
      {
        question: `Hoeveel ${parsed.minBedrooms}-kamer woningen zijn er in ${cityName}?`,
        answer: `Er zijn momenteel ${totalCount} woningen met ${parsed.minBedrooms} of meer kamers in ${cityName}. ${huurCount > 0 ? `${huurCount} zijn huurwoningen` : ""}${huurCount > 0 && koopCount > 0 ? " en " : ""}${koopCount > 0 ? `${koopCount} zijn koopwoningen` : ""}.`,
      },
      {
        question: `Wat is de gemiddelde prijs van een ${parsed.minBedrooms}-kamer woning in ${cityName}?`,
        answer: `De gemiddelde vraagprijs voor woningen met ${parsed.minBedrooms}+ kamers in ${cityName} is ${formatEuro(avgPrice)}. ${avgSurface > 0 ? `De gemiddelde oppervlakte is ${avgSurface} m².` : ""}`,
      },
      {
        question: `Welke ${parsed.minBedrooms}-kamer woningtypes zijn beschikbaar in ${cityName}?`,
        answer: `Het aanbod bestaat uit ${typeBreakdown.map(([type, count]) => `${count} ${TYPE_LABELS[type]?.plural?.toLowerCase() || type}`).join(", ")}. Bekijk de woningen op deze pagina voor het actuele aanbod.`,
      },
    ];
    return [
      {
        question: `Hoeveel woningen zijn er in ${cityName} ${filterLabel}?`,
        answer: `Op dit moment zijn er ${totalCount} woningen beschikbaar in ${cityName} ${filterLabel}. Het aanbod wordt dagelijks bijgewerkt op WoonPeek.`,
      },
      {
        question: `Hoe vind ik snel een woning in ${cityName} ${filterLabel}?`,
        answer: `Gebruik de filters op deze pagina om te zoeken op woningtype, prijs en oppervlakte. Je kunt ook een dagelijkse alert instellen om als eerste op de hoogte te zijn van nieuwe woningen in ${cityName}.`,
      },
      {
        question: `Wat voor soort woningen zijn er in ${cityName} ${filterLabel}?`,
        answer: `In ${cityName} vind je appartementen, huizen, studio's en kamers. Filter op woningtype om direct het juiste aanbod te bekijken.`,
      },
    ];
  }, [cityName, filterLabel, totalCount, parsed, huurCount, koopCount, avgPrice, avgSurface, typeBreakdown, isPriceFilter, isBedroomFilter]);

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
    [h1, pageDescription, canonical, totalCount, properties, faqItems]
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
                {isPriceFilter ? (
                  <>Bekijk {totalCount} betaalbare woningen in {cityName} onder {formatEuro(parsed.maxPrice!)}. De gemiddelde vraagprijs is {formatEuro(avgPrice)}{avgSurface > 0 ? ` met een gemiddelde oppervlakte van ${avgSurface} m²` : ""}. Het aanbod bestaat uit {huurCount} huurwoningen en {koopCount} koopwoningen.</>
                ) : isBedroomFilter ? (
                  <>Vind {totalCount} ruime woningen met {parsed.minBedrooms} of meer kamers in {cityName}. Gemiddelde prijs: {formatEuro(avgPrice)}{avgSurface > 0 ? `, gemiddelde oppervlakte: ${avgSurface} m²` : ""}. Ideaal voor {parsed.minBedrooms! >= 3 ? "gezinnen" : "stellen en alleenstaanden"}.</>
                ) : (
                  <>Op zoek naar een woning in {cityName} {filterLabel}? Hier vind je het actuele aanbod. Gebruik de filters om snel een woning te vinden die bij jouw wensen past.</>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                  {totalCount} woningen gevonden
                </span>
                {avgPrice > 0 && (
                  <span className="rounded-full bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                    Gem. prijs: {formatEuro(avgPrice)}
                  </span>
                )}
                {avgSurface > 0 && (
                  <span className="rounded-full bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                    Gem. oppervlakte: {avgSurface} m²
                  </span>
                )}
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
              {isPriceFilter
                ? `Betaalbaar wonen in ${cityName} onder ${formatEuro(parsed.maxPrice!)}`
                : isBedroomFilter
                ? `${parsed.minBedrooms}-kamer woningen vinden in ${cityName}`
                : `Wonen in ${cityName}`}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              {isPriceFilter ? (
                <>
                  <p>
                    De woningmarkt in {cityName} is competitief, maar met een budget onder {formatEuro(parsed.maxPrice!)} zijn er nog steeds {totalCount} opties.
                    {typeBreakdown.length > 0 && <> Het aanbod bestaat voornamelijk uit <strong>{typeBreakdown[0][1]} {TYPE_LABELS[typeBreakdown[0][0]]?.plural?.toLowerCase() || typeBreakdown[0][0]}</strong>{typeBreakdown.length > 1 ? <> en <strong>{typeBreakdown[1][1]} {TYPE_LABELS[typeBreakdown[1][0]]?.plural?.toLowerCase() || typeBreakdown[1][0]}</strong></> : ""}.</>}
                  </p>
                  <p>
                    Tip: stel een{" "}
                    <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">gratis dagelijkse alert</Link>{" "}
                    in voor woningen in {cityName} onder {formatEuro(parsed.maxPrice!)}. Zo ben je altijd als eerste op de hoogte van betaalbaar nieuw aanbod.
                  </p>
                </>
              ) : isBedroomFilter ? (
                <>
                  <p>
                    Zoek je een ruime woning met minimaal {parsed.minBedrooms} slaapkamers in {cityName}? Op dit moment zijn er {totalCount} woningen beschikbaar die aan deze eis voldoen.
                    {avgSurface > 0 && <> De gemiddelde oppervlakte is <strong>{avgSurface} m²</strong>, met prijzen vanaf <strong>{formatEuro(Math.min(...properties.map(p => p.price)))}</strong>.</>}
                  </p>
                  <p>
                    Bekijk ook{" "}
                    <Link to={`/huurwoningen/${citySlug}`} className="text-primary underline hover:no-underline">alle huurwoningen in {cityName}</Link>{" "}
                    of ga naar de{" "}
                    <Link to={cityPath(cityName)} className="text-primary underline hover:no-underline">stadspagina van {cityName}</Link>{" "}
                    voor het volledige overzicht.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    {cityName} biedt een divers woningaanbod voor elke woningzoeker. Of je nu zoekt naar een
                    <strong> betaalbare huurwoning in {cityName}</strong>, een <strong>appartement in {cityName}</strong> of
                    een <strong>ruim huis</strong>: op WoonPeek vind je dagelijks nieuw aanbod uit meerdere bronnen.
                  </p>
                  <p>
                    Stel een{" "}
                    <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">dagelijkse alert</Link>{" "}
                    in om als eerste op de hoogte te zijn van nieuwe woningen in {cityName}.
                  </p>
                </>
              )}
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

        {/* FAQ */}
        <section className="border-t py-12">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Veelgestelde vragen over woningen in {cityName} {filterLabel}
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, i) => (
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

        {/* Andere steden */}
        {citySlug && <RelatedCities currentCity={cityName} />}
      </main>
      <Footer />
    </div>
  );
};

export default FilteredLandingPage;
