import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import AdSlot from "@/components/ads/AdSlot";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getValidCityName } from "@/lib/dutchCities";
import { ArrowRight, MapPin, Building2, Train, Car, GraduationCap, Home, Map, Lightbulb, FileText } from "lucide-react";

interface CityGuide {
  id: string;
  city: string;
  city_slug: string;
  intro: string | null;
  registration_info: string | null;
  transport_info: string | null;
  parking_info: string | null;
  schools_info: string | null;
  housing_market_info: string | null;
  neighborhoods_info: string | null;
  practical_tips: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

const renderParagraphs = (text: string | null) => {
  if (!text) return null;
  return text.split(/\n\n+/).map((para, i) => (
    <p key={i} className="mb-3 leading-relaxed text-muted-foreground last:mb-0">
      {para.trim()}
    </p>
  ));
};

const CityGuidePage = () => {
  const { city = "" } = useParams<{ city: string }>();
  const validCity = getValidCityName(city);
  const [guide, setGuide] = useState<CityGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!validCity) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      // Try cache first
      const { data: cached } = await supabase
        .from("city_guides")
        .select("*")
        .eq("city_slug", city)
        .maybeSingle();

      if (cached) {
        setGuide(cached as CityGuide);
        setLoading(false);
        return;
      }

      // On-demand generation
      try {
        const { data, error: fnError } = await supabase.functions.invoke("generate-city-guide", {
          body: { city: validCity, city_slug: city },
        });

        if (fnError) throw fnError;
        if (data?.guide) {
          setGuide(data.guide as CityGuide);
        } else {
          setError("Geen gids beschikbaar.");
        }
      } catch (e) {
        console.error(e);
        setError("Kon gids niet laden. Probeer later opnieuw.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [city, validCity]);

  if (!validCity) {
    return <Navigate to="/niet-gevonden" replace />;
  }

  const title = guide?.meta_title || `Verhuizen naar ${validCity}: Complete gids 2025 | WoonPeek`;
  const description = guide?.meta_description || `Alles over verhuizen naar ${validCity}: inschrijven gemeente, parkeervergunning, scholen, OV en woningmarkt. Praktische gids voor nieuwe inwoners.`;

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={title}
        description={description}
        canonical={`https://www.woonpeek.nl/verhuizen-naar-${city}`}
      />
      <Header />

      <main className="flex-1">
        <section className="border-b bg-muted/30 py-6">
          <div className="container">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: validCity, href: `/woningen-${city}` },
                { label: `Verhuizen naar ${validCity}` },
              ]}
            />
            <h1 className="mt-4 text-3xl font-bold md:text-4xl">
              Verhuizen naar {validCity}
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Praktische gids voor mensen die naar {validCity} verhuizen: inschrijven, scholen, vervoer, parkeren en woningmarkt.
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="container max-w-4xl space-y-6">
            <AdSlot slotKey="city_guide_top" />

            {loading && (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            )}

            {error && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">{error}</p>
                  <Button asChild className="mt-4">
                    <Link to={`/woningen-${city}`}>Bekijk woningen in {validCity}</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {guide && !loading && (
              <article className="space-y-6">
                {guide.intro && (
                  <Card>
                    <CardContent className="p-6">{renderParagraphs(guide.intro)}</CardContent>
                  </Card>
                )}

                {guide.registration_info && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Inschrijven bij gemeente {validCity}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderParagraphs(guide.registration_info)}</CardContent>
                  </Card>
                )}

                {guide.housing_market_info && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        Woningmarkt in {validCity}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderParagraphs(guide.housing_market_info)}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild size="sm">
                          <Link to={`/woningen-${city}`}>
                            Bekijk aanbod <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/huurprijzen/${city}`}>Huurprijzen monitor</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {guide.neighborhoods_info && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Map className="h-5 w-5 text-primary" />
                        Wijken en buurten in {validCity}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderParagraphs(guide.neighborhoods_info)}</CardContent>
                  </Card>
                )}

                <AdSlot slotKey="city_guide_middle" />

                {guide.transport_info && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Train className="h-5 w-5 text-primary" />
                        Openbaar vervoer in {validCity}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderParagraphs(guide.transport_info)}</CardContent>
                  </Card>
                )}

                {guide.parking_info && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        Parkeren in {validCity}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderParagraphs(guide.parking_info)}</CardContent>
                  </Card>
                )}

                {guide.schools_info && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Scholen en kinderopvang in {validCity}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderParagraphs(guide.schools_info)}</CardContent>
                  </Card>
                )}

                {guide.practical_tips && (
                  <Card className="bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Praktische tips voor nieuwe inwoners
                      </CardTitle>
                    </CardHeader>
                    <CardContent>{renderParagraphs(guide.practical_tips)}</CardContent>
                  </Card>
                )}
              </article>
            )}
          </div>
        </section>

        <section className="border-t bg-muted/30 py-8">
          <div className="container max-w-4xl">
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <MapPin className="h-10 w-10 text-primary" />
                <h2 className="text-xl font-bold">Op zoek naar een woning in {validCity}?</h2>
                <p className="text-muted-foreground">
                  Bekijk het actuele aanbod of stel een alert in om als eerste op de hoogte te zijn.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild>
                    <Link to={`/woningen-${city}`}>Woningen in {validCity}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/dagelijkse-alert">Alert aanmaken</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CityGuidePage;
