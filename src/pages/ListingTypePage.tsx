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
import { ArrowRight, ChevronRight, Search } from "lucide-react";
import { cityPath, citySlugToName } from "@/lib/cities";
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
  const cityName = citySlug ? citySlugToName(citySlug) : undefined;
  const label = LABELS[listingType];
  const locationLabel = cityName || "Nederland";

  const { data, isLoading } = useProperties({
    listingType: listingType as ListingType,
    city: cityName,
    pageSize: 50,
  });

  const properties = data?.properties || [];
  const totalCount = data?.totalCount || 0;

  // SEO metadata
  const pageTitle = cityName
    ? `${label.plural} in ${cityName} – ${totalCount} ${label.plural.toLowerCase()} beschikbaar | WoonPeek`
    : `${label.plural} in Nederland – actueel aanbod | WoonPeek`;

  const pageDesc = cityName
    ? `Bekijk ${totalCount} ${label.plural.toLowerCase()} in ${cityName}. Vergelijk prijzen, foto's en details. Dagelijks bijgewerkt op WoonPeek.`
    : `Bekijk ${totalCount} ${label.plural.toLowerCase()} in heel Nederland. Vergelijk prijzen en vind jouw ${label.singular} op WoonPeek.`;

  const canonical = cityName
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

  // FAQ
  const faqItems = useMemo(() => {
    const items = [
      {
        question: `Hoeveel ${label.plural.toLowerCase()} zijn er in ${locationLabel}?`,
        answer: `Op dit moment staan er ${totalCount} ${label.plural.toLowerCase()} in ${locationLabel} op WoonPeek. Het aanbod wordt dagelijks bijgewerkt uit meerdere bronnen.`,
      },
      {
        question: `Wat kost een ${label.singular} in ${locationLabel}?`,
        answer: `De prijzen van ${label.plural.toLowerCase()} in ${locationLabel} variëren per locatie, grootte en woningtype. Gebruik de zoekfilters om te filteren op jouw maximale ${listingType === "huur" ? "huurprijs" : "koopprijs"}.`,
      },
      {
        question: `Hoe vind ik snel een ${label.singular} in ${locationLabel}?`,
        answer: `WoonPeek verzamelt dagelijks nieuw woningaanbod uit meerdere bronnen. Stel een gratis dagelijkse alert in om als eerste te reageren op nieuwe ${label.plural.toLowerCase()} in ${locationLabel}.`,
      },
      {
        question: `Kan ik een alert instellen voor ${label.plural.toLowerCase()} in ${locationLabel}?`,
        answer: `Ja, je kunt gratis een dagelijkse e-mailalert instellen. Zodra er nieuwe ${label.plural.toLowerCase()} beschikbaar komen in ${locationLabel} ontvang je direct een melding.`,
      },
    ];
    if (listingType === "huur") {
      items.push({
        question: `Hoe reageer ik op een ${label.singular} in ${locationLabel}?`,
        answer: `Klik op een woning om de details te bekijken. Via de bronlink kun je direct reageren bij de verhuurder of makelaar. Reageer snel, want populaire ${label.plural.toLowerCase()} in ${locationLabel} zijn vaak binnen enkele dagen verhuurd.`,
      });
    } else {
      items.push({
        question: `Is het een goed moment om een woning te kopen in ${locationLabel}?`,
        answer: `De koopwoningmarkt in ${locationLabel} is dynamisch. Bekijk het actuele aanbod en vergelijk prijzen om een goed beeld te krijgen. WoonPeek toont dagelijks nieuw aanbod zodat je geen kans mist.`,
      });
    }
    return items;
  }, [label, locationLabel, totalCount, listingType]);

  // JSON-LD
  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${label.plural} in ${locationLabel}`,
        description: pageDesc,
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
    [label.plural, locationLabel, pageDesc, canonical, totalCount, properties, faqItems]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title={pageTitle} description={pageDesc} canonical={canonical} />
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
                Vind jouw <span className="text-primary">{label.singular}</span> of <span className="text-primary">appartement</span> in {locationLabel}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Op zoek naar een <strong>{label.singular} in {locationLabel}</strong>? WoonPeek verzamelt dagelijks
                het nieuwste aanbod van {label.plural.toLowerCase()} uit meerdere bronnen. Vergelijk{" "}
                {listingType === "huur" ? "huurprijzen" : "koopprijzen"}, bekijk foto's en vind snel jouw ideale{" "}
                <strong>{label.singular} in {locationLabel}</strong>.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-sm">
                  {totalCount} {label.plural.toLowerCase()} beschikbaar
                </div>
                {cityName && (
                  <Link
                    to="/dagelijkse-alert"
                    className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    Dagelijkse alert instellen
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Properties */}
        <section className="container py-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="font-display text-xl font-semibold">
                Geen {label.plural.toLowerCase()} in {locationLabel}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
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
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {label.singular.charAt(0).toUpperCase() + label.singular.slice(1)} zoeken in {locationLabel}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Op WoonPeek vind je het meest actuele aanbod van <strong>{label.plural.toLowerCase()} in {locationLabel}</strong>.
                We verzamelen dagelijks het nieuwste woningaanbod van meerdere bronnen zodat je niets mist.
                Momenteel zijn er <strong>{totalCount} {label.plural.toLowerCase()}</strong> beschikbaar
                {cityName ? ` in ${cityName}` : ""}.
              </p>
              {listingType === "huur" ? (
                <>
                  <p>
                    De huurwoningmarkt {cityName ? `in ${cityName}` : "in Nederland"} is competitief.
                    Veel <strong>huurwoningen{cityName ? ` in ${cityName}` : ""}</strong> zijn binnen enkele dagen verhuurd.
                    Daarom is het belangrijk om snel te reageren op nieuwe advertenties. Met WoonPeek heb je een
                    voorsprong: onze scrapers doorzoeken dagelijks meerdere woningplatforms en tonen het nieuwste
                    aanbod direct op onze website.
                  </p>
                  <p>
                    Tip: stel een gratis{" "}
                    <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">
                      dagelijkse alert
                    </Link>{" "}
                    in en ontvang elke dag een overzicht van nieuwe huurwoningen
                    {cityName ? ` in ${cityName}` : ""}. Zo mis je nooit meer een kans op jouw ideale huurwoning.
                    Je kunt ook filteren op maximale huurprijs, aantal slaapkamers en woningtype om nog gerichter te zoeken.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    De koopwoningmarkt {cityName ? `in ${cityName}` : "in Nederland"} biedt kansen voor
                    zowel starters als doorstromers. Of je nu op zoek bent naar een betaalbaar <strong>appartement
                    {cityName ? ` in ${cityName}` : ""}</strong> of een ruime gezinswoning — op WoonPeek vind je
                    dagelijks nieuwe koopwoningen uit meerdere bronnen.
                  </p>
                  <p>
                    Vergelijk <strong>koopwoningen{cityName ? ` in ${cityName}` : ""}</strong> op prijs, oppervlakte
                    en locatie. Sla interessante woningen op in je favorieten en ontvang alerts wanneer er nieuwe
                    koopwoningen{cityName ? ` in ${cityName}` : ""} beschikbaar komen. Zo ben je altijd als eerste
                    op de hoogte van het nieuwste aanbod.
                  </p>
                </>
              )}
              {cityName && (
                <p>
                  Naast {label.plural.toLowerCase()} vind je op WoonPeek ook{" "}
                  <Link to={`/appartementen/${citySlug}`} className="text-primary underline hover:no-underline">
                    appartementen in {cityName}
                  </Link>,{" "}
                  <Link to={`/huizen/${citySlug}`} className="text-primary underline hover:no-underline">
                    huizen in {cityName}
                  </Link>{" "}
                  en{" "}
                  <Link to={`/studios/${citySlug}`} className="text-primary underline hover:no-underline">
                    studio's in {cityName}
                  </Link>. Vergelijk het volledige aanbod en vind de woning die bij jou past.
                </p>
              )}
            </div>

            {/* Tips block */}
            <h3 className="mt-10 font-display text-xl font-semibold text-foreground">
              Tips voor het vinden van een {label.singular} in {locationLabel}
            </h3>
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Reageer snel</strong> — Nieuwe {label.plural.toLowerCase()} in {locationLabel} zijn
                  vaak snel weg. Stel een{" "}
                  <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">
                    dagelijkse alert
                  </Link>{" "}
                  in om als eerste op de hoogte te zijn.
                </li>
                <li>
                  <strong>Gebruik filters</strong> — Filter op maximale {listingType === "huur" ? "huurprijs" : "koopprijs"},
                  aantal kamers of oppervlakte om alleen relevante woningen te zien.
                </li>
                <li>
                  <strong>Bekijk ook andere woningtypes</strong> — Verbreed je zoekopdracht naar appartementen, huizen of
                  studio's om meer kans te maken.
                </li>
                <li>
                  <strong>Vergelijk prijzen</strong> — Bekijk de prijzen van vergelijkbare{" "}
                  {label.plural.toLowerCase()} in {locationLabel} om een realistisch beeld te krijgen van de markt.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Internal links */}
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
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Alle woningen in {cityName}
                  </span>
                </Link>
                {listingType !== "huur" && (
                  <Link
                    to={`/huurwoningen/${citySlug}`}
                    className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      Huurwoningen in {cityName}
                    </span>
                  </Link>
                )}
                {listingType !== "koop" && (
                  <Link
                    to={`/koopwoningen/${citySlug}`}
                    className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      Koopwoningen in {cityName}
                    </span>
                  </Link>
                )}
                <Link
                  to={`/appartementen/${citySlug}`}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Appartementen in {cityName}
                  </span>
                </Link>
                <Link
                  to={`/huizen/${citySlug}`}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Huizen in {cityName}
                  </span>
                </Link>
                <Link
                  to={`/nieuw-aanbod/${citySlug}`}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Nieuw aanbod in {cityName}
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Similar properties */}
        {citySlug && cityName && (
          <SimilarProperties
            cityName={cityName}
            excludeIds={properties.map((p) => p.id)}
          />
        )}

        {/* FAQ */}
        <section className="border-t py-12">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Veelgestelde vragen over {label.plural.toLowerCase()} in {locationLabel}
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

        {/* Related cities */}
        {citySlug && cityName && <RelatedCities currentCity={cityName} />}
      </main>
      <Footer />
    </div>
  );
};

export default ListingTypePage;
