import { useMemo } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import AdSlot from "@/components/ads/AdSlot";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MapPin, Home, TrendingUp } from "lucide-react";

const PostcodePage = () => {
  const { postcode = "" } = useParams<{ postcode: string }>();

  const isValidPostcode = /^\d{4}$/.test(postcode);

  const { data: properties, isLoading } = useProperties({
    city: postcode,
    disablePagination: true,
  });

  const stats = useMemo(() => {
    if (!properties || properties.length === 0) return null;
    const prices = properties.map((p) => Number(p.price)).filter((n) => n > 0);
    const surfaces = properties.map((p) => p.surface_area || 0).filter((n) => n > 0);
    const cities = [...new Set(properties.map((p) => p.city).filter(Boolean))];
    return {
      count: properties.length,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      minPrice: prices.length ? Math.min(...prices) : 0,
      avgSurface: surfaces.length ? Math.round(surfaces.reduce((a, b) => a + b, 0) / surfaces.length) : 0,
      cities,
    };
  }, [properties]);

  if (!isValidPostcode) {
    return <Navigate to="/niet-gevonden" replace />;
  }

  const cityLabel = stats?.cities[0] || "";
  const title = `Woningen in postcode ${postcode}${cityLabel ? ` (${cityLabel})` : ""} | WoonPeek`;
  const description = stats?.count
    ? `${stats.count} woningen te huur en koop in postcode ${postcode}${cityLabel ? `, ${cityLabel}` : ""}. Gemiddelde prijs €${stats.avgPrice.toLocaleString("nl-NL")}. Bekijk het actuele aanbod.`
    : `Woningen zoeken in postcode ${postcode}. Bekijk huur en koopwoningen, prijzen en buurtinfo op WoonPeek.`;

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={title}
        description={description}
        canonical={`https://www.woonpeek.nl/woningen-postcode-${postcode}`}
      />
      <Header />

      <main className="flex-1">
        <section className="border-b bg-muted/30 py-6">
          <div className="container">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Postcodes", href: "/zoeken" },
                { label: `Postcode ${postcode}` },
              ]}
            />
            <h1 className="mt-4 text-3xl font-bold md:text-4xl">
              Woningen in postcode {postcode}
              {cityLabel && <span className="text-muted-foreground"> in {cityLabel}</span>}
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              {stats?.count
                ? `${stats.count} actieve woningen gevonden in postcodegebied ${postcode}. Vergelijk huur en koopwoningen, bekijk prijzen en vind direct contactgegevens.`
                : `Geen actieve woningen in postcode ${postcode} op dit moment. Maak een alert aan om als eerste op de hoogte te zijn van nieuw aanbod.`}
            </p>
          </div>
        </section>

        {stats && stats.count > 0 && (
          <section className="border-b py-6">
            <div className="container grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Home className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Aanbod</p>
                    <p className="text-xl font-semibold">{stats.count} woningen</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gem. prijs</p>
                    <p className="text-xl font-semibold">€{stats.avgPrice.toLocaleString("nl-NL")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <MapPin className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vanaf</p>
                    <p className="text-xl font-semibold">€{stats.minPrice.toLocaleString("nl-NL")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Home className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gem. m²</p>
                    <p className="text-xl font-semibold">{stats.avgSurface} m²</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        <section className="py-8">
          <div className="container space-y-6">
            <AdSlot slotKey="postcode_top" />

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 w-full" />
                ))}
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="space-y-4 p-8 text-center">
                  <p className="text-lg">Geen woningen in postcode {postcode}.</p>
                  <p className="text-muted-foreground">
                    Bekijk het volledige aanbod of maak een alert aan voor nieuwe woningen.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button asChild>
                      <Link to="/zoeken">Bekijk alle woningen</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/dagelijkse-alert">
                        Alert aanmaken <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {cityLabel && (
          <section className="border-t bg-muted/30 py-8">
            <div className="container space-y-3">
              <h2 className="text-2xl font-bold">Meer in {cityLabel}</h2>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link to={`/woningen-${cityLabel.toLowerCase().replace(/\s+/g, "-")}`}>
                    Alle woningen in {cityLabel}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={`/huurwoningen/${cityLabel.toLowerCase().replace(/\s+/g, "-")}`}>
                    Huurwoningen
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={`/koopwoningen/${cityLabel.toLowerCase().replace(/\s+/g, "-")}`}>
                    Koopwoningen
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={`/verhuizen-naar-${cityLabel.toLowerCase().replace(/\s+/g, "-")}`}>
                    Verhuizen naar {cityLabel}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PostcodePage;
