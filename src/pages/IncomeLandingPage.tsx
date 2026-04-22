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
import { getValidCityName } from "@/lib/dutchCities";
import { ArrowRight, Wallet, CheckCircle2, Info } from "lucide-react";

const VALID_INCOMES = [2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000];

const IncomeLandingPage = () => {
  const { city = "", income = "" } = useParams<{ city: string; income: string }>();
  const validCity = getValidCityName(city);
  const incomeNum = Number(income);
  const isValidIncome = VALID_INCOMES.includes(incomeNum);

  const maxRent = Math.floor(incomeNum / 3);

  const { data, isLoading } = useProperties({
    city: validCity || undefined,
    listingType: "huur",
    maxPrice: maxRent,
    disablePagination: true,
  });
  const properties = data?.properties ?? [];

  const stats = useMemo(() => {
    if (properties.length === 0) return null;
    const prices = properties.map((p) => Number(p.price)).filter((n) => n > 0);
    const surfaces = properties.map((p) => p.surface_area || 0).filter((n) => n > 0);
    return {
      count: properties.length,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      avgSurface: surfaces.length ? Math.round(surfaces.reduce((a, b) => a + b, 0) / surfaces.length) : 0,
      minPrice: prices.length ? Math.min(...prices) : 0,
    };
  }, [properties]);

  if (!validCity || !isValidIncome) {
    return <Navigate to="/niet-gevonden" replace />;
  }

  const cityName = validCity;
  const formattedIncome = `€${incomeNum.toLocaleString("nl-NL")}`;
  const formattedMaxRent = `€${maxRent.toLocaleString("nl-NL")}`;

  const title = `Huurwoningen bij ${formattedIncome} bruto inkomen in ${cityName} | WoonPeek`;
  const description = stats?.count
    ? `${stats.count} huurwoningen tot ${formattedMaxRent}/mnd in ${cityName} bij een bruto inkomen van ${formattedIncome}. Voldoet aan de 3x huur regel van verhuurders.`
    : `Bereken welke huurwoningen in ${cityName} passen bij ${formattedIncome} bruto inkomen. Volgens de 3x huur regel maximaal ${formattedMaxRent} per maand.`;

  const intro = `Met een bruto maandinkomen van ${formattedIncome} kun je in ${cityName} huurwoningen bekijken tot ongeveer ${formattedMaxRent} per maand. Bijna alle verhuurders in Nederland hanteren de zogenoemde "3x huur regel": je bruto inkomen moet minimaal driemaal de kale huurprijs zijn. Op deze pagina tonen we alleen het aanbod dat aan deze norm voldoet, zodat je geen tijd verliest aan woningen waar je niet voor in aanmerking komt.`;

  const explanation = stats?.count && stats.avgSurface > 0
    ? `Op basis van het huidige aanbod in ${cityName} krijg je gemiddeld ${stats.avgSurface}m² woonruimte voor maximaal ${formattedMaxRent}/mnd. De goedkoopste huurwoning binnen jouw inkomensgrens start vanaf €${stats.minPrice.toLocaleString("nl-NL")} per maand.`
    : `Op dit moment is er geen actief aanbod in ${cityName} dat aansluit bij ${formattedIncome} bruto inkomen. Maak een gratis alert aan om direct bericht te krijgen wanneer een passende woning beschikbaar komt.`;

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={title}
        description={description}
        canonical={`https://www.woonpeek.nl/huur-bij-inkomen-${incomeNum}-${city}`}
      />
      <Header />

      <main className="flex-1">
        <section className="border-b bg-muted/30 py-6">
          <div className="container">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: cityName, href: `/woningen-${city}` },
                { label: `Inkomen ${formattedIncome}` },
              ]}
            />
            <h1 className="mt-4 text-3xl font-bold md:text-4xl">
              Huurwoningen bij {formattedIncome} bruto inkomen in {cityName}
            </h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">{intro}</p>
          </div>
        </section>

        <section className="py-8">
          <div className="container space-y-6">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-wrap items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Jouw maximale huur (3x regel)</p>
                  <p className="text-2xl font-bold text-primary">{formattedMaxRent} per maand</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{stats?.count || 0} woningen passen</span>
                </div>
              </CardContent>
            </Card>

            <AdSlot slotKey="income_top" />

            <Card>
              <CardContent className="space-y-3 p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Info className="h-5 w-5 text-primary" />
                  Wat krijg je voor {formattedIncome} inkomen in {cityName}?
                </h2>
                <p className="text-muted-foreground">{explanation}</p>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 w-full" />
                ))}
              </div>
            ) : properties.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} userIncome={incomeNum} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="space-y-4 p-8 text-center">
                  <p className="text-lg">Geen aanbod tot {formattedMaxRent}/mnd in {cityName}.</p>
                  <Button asChild>
                    <Link to="/dagelijkse-alert">
                      Alert aanmaken <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="border-t bg-muted/30 py-8">
          <div className="container space-y-3">
            <h2 className="text-2xl font-bold">Andere inkomens in {cityName}</h2>
            <p className="text-sm text-muted-foreground">Bekijk welke huurwoningen passen bij verschillende inkomensniveaus.</p>
            <div className="flex flex-wrap gap-2">
              {VALID_INCOMES
                .filter((i) => i !== incomeNum)
                .map((i) => (
                  <Button key={i} asChild variant="outline" size="sm">
                    <Link to={`/huur-bij-inkomen-${i}-${city}`}>
                      €{i.toLocaleString("nl-NL")} bruto
                    </Link>
                  </Button>
                ))}
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container max-w-3xl space-y-4">
            <h2 className="text-2xl font-bold">Veelgestelde vragen over inkomen en huren</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Wat is de 3x huur regel?</h3>
                <p className="text-muted-foreground">Verhuurders eisen meestal dat je bruto maandinkomen minimaal drie keer de kale huurprijs is. Bij {formattedIncome} bruto kom je dus in aanmerking voor woningen tot {formattedMaxRent} per maand.</p>
              </div>
              <div>
                <h3 className="font-semibold">Telt vakantiegeld of bonus mee?</h3>
                <p className="text-muted-foreground">Ja, vakantiegeld (8%) en een vaste 13e maand mogen meestal worden meegerekend bij het bepalen van je bruto jaarinkomen. Deel dit door 12 voor je effectieve maandinkomen.</p>
              </div>
              <div>
                <h3 className="font-semibold">Wat als ik samen huur?</h3>
                <p className="text-muted-foreground">Bij een gezamenlijke huurovereenkomst tellen beide inkomens mee. Het tweede inkomen wordt door veel verhuurders voor 100% meegerekend, maar dit verschilt per partij.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default IncomeLandingPage;
