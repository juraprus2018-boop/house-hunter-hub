import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { useProperties } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowRight } from "lucide-react";

const CITY_MAP: Record<string, string> = {
  "amsterdam": "Amsterdam",
  "rotterdam": "Rotterdam",
  "eindhoven": "Eindhoven",
  "utrecht": "Utrecht",
  "groningen": "Groningen",
  "den-haag": "Den Haag",
  "arnhem": "Arnhem",
  "nijmegen": "Nijmegen",
  "tilburg": "Tilburg",
  "breda": "Breda",
  "almere": "Almere",
  "helmond": "Helmond",
  "veldhoven": "Veldhoven",
  "zoetermeer": "Zoetermeer",
  "enschede": "Enschede",
  "purmerend": "Purmerend",
  "waalre": "Waalre",
  "bergen-op-zoom": "Bergen op Zoom",
  "roermond": "Roermond",
  "best": "Best",
  "deurne": "Deurne",
  "asten": "Asten",
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

const CityPage = () => {
  const { city: citySlug } = useParams<{ city: string }>();
  const cityName = CITY_MAP[citySlug || ""] || (citySlug || "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const { data, isLoading } = useProperties({ city: cityName });
  const properties = data?.properties || [];
  const totalCount = data?.totalCount || 0;

  const huurCount = properties.filter(p => p.listing_type === "huur").length;
  const koopCount = properties.filter(p => p.listing_type === "koop").length;

  useEffect(() => {
    document.title = `Huurwoningen & Koophuizen in ${cityName} | WoonPeek`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `Bekijk ${totalCount} huurwoningen en koophuizen in ${cityName}. Vind jouw droomwoning op WoonPeek.`);
    }
  }, [cityName, totalCount]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Woningen in ${cityName}`,
    "description": `Huurwoningen en koophuizen in ${cityName}`,
    "numberOfItems": totalCount,
    "itemListElement": properties.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `https://woonpeek.nl/woning/${p.slug || p.id}`,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container">
            <div className="mb-4">
              <Breadcrumbs items={[
                { label: "Home", href: "/" },
                { label: cityName },
              ]} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  Woningen in {cityName}
                </h1>
                <p className="text-muted-foreground">
                  {totalCount} {totalCount === 1 ? "woning" : "woningen"} beschikbaar
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {huurCount > 0 && (
                <Link to={`/zoeken?locatie=${encodeURIComponent(cityName)}&aanbod=huur`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    Huurwoningen {cityName}
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{huurCount}</span>
                  </Button>
                </Link>
              )}
              {koopCount > 0 && (
                <Link to={`/zoeken?locatie=${encodeURIComponent(cityName)}&aanbod=koop`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    Koophuizen {cityName}
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{koopCount}</span>
                  </Button>
                </Link>
              )}
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
                <Link to={`/zoeken?locatie=${encodeURIComponent(cityName)}`}>
                  <Button variant="outline" className="gap-2">
                    Bekijk alle woningen in {cityName}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="font-display text-xl font-semibold">Geen woningen in {cityName}</h2>
              <p className="mt-2 text-muted-foreground">
                Er zijn momenteel geen actieve woningen in {cityName}. Probeer later opnieuw.
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
              Huurwoningen en koophuizen in {cityName}
            </h2>
            <div className="prose prose-muted text-muted-foreground text-sm space-y-3">
              <p>
                Op WoonPeek vind je het meest actuele aanbod van huurwoningen en koophuizen in {cityName}. 
                Of je nu op zoek bent naar een appartement, huis, studio of kamer – wij verzamelen dagelijks 
                het nieuwste woningaanbod van meerdere bronnen zodat je niets mist.
              </p>
              <p>
                Momenteel zijn er {totalCount} woningen beschikbaar in {cityName}
                {huurCount > 0 && koopCount > 0 
                  ? `, waarvan ${huurCount} huurwoningen en ${koopCount} koophuizen`
                  : huurCount > 0 
                    ? `, waarvan ${huurCount} huurwoningen` 
                    : koopCount > 0 
                      ? `, waarvan ${koopCount} koophuizen` 
                      : ""
                }.
                Gebruik de filters op onze zoekpagina om snel de perfecte woning te vinden.
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
