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
import { isValidDutchCity, getValidCityName } from "@/lib/dutchCities";
import { citySlugToName } from "@/lib/cities";
import { ArrowRight } from "lucide-react";

interface BudgetLandingPageProps {
  listingType: "huur" | "koop";
}

const HUUR_BUDGETS = [750, 1000, 1250, 1500, 2000, 2500];
const KOOP_BUDGETS = [200000, 300000, 400000, 500000, 750000, 1000000];

const BudgetLandingPage = ({ listingType }: BudgetLandingPageProps) => {
  const { city = "", budget = "" } = useParams<{ city: string; budget: string }>();
  const validCity = getValidCityName(city);
  const budgetNum = Number(budget);

  const validBudgets = listingType === "huur" ? HUUR_BUDGETS : KOOP_BUDGETS;
  const isValidBudget = validBudgets.includes(budgetNum);

  const { data: properties, isLoading } = useProperties({
    city: validCity || undefined,
    listingType,
    maxPrice: budgetNum,
    disablePagination: true,
  });

  const stats = useMemo(() => {
    if (!properties || properties.length === 0) return null;
    const prices = properties.map((p) => Number(p.price)).filter((n) => n > 0);
    const surfaces = properties.map((p) => p.surface_area || 0).filter((n) => n > 0);
    return {
      count: properties.length,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      avgSurface: surfaces.length ? Math.round(surfaces.reduce((a, b) => a + b, 0) / surfaces.length) : 0,
      minSurface: surfaces.length ? Math.min(...surfaces) : 0,
      maxSurface: surfaces.length ? Math.max(...surfaces) : 0,
    };
  }, [properties]);

  if (!validCity || !isValidBudget) {
    return <Navigate to="/niet-gevonden" replace />;
  }

  const cityName = validCity;
  const action = listingType === "huur" ? "huren" : "kopen";
  const priceUnit = listingType === "huur" ? "per maand" : "";
  const formattedBudget = `€${budgetNum.toLocaleString("nl-NL")}`;

  const title = `${listingType === "huur" ? "Huurwoningen" : "Koopwoningen"} onder ${formattedBudget} in ${cityName} | WoonPeek`;
  const description = stats?.count
    ? `${stats.count} ${listingType === "huur" ? "huurwoningen" : "koopwoningen"} onder ${formattedBudget} ${priceUnit} in ${cityName}. Gemiddeld ${stats.avgSurface}m². Bekijk het actuele aanbod.`
    : `${listingType === "huur" ? "Huurwoningen" : "Koopwoningen"} onder ${formattedBudget} in ${cityName} zoeken. Vergelijk aanbod, prijzen en m². Direct contact met aanbieders.`;

  // Generate unique SEO content per budget bracket
  const intro = listingType === "huur"
    ? `Een huurwoning in ${cityName} onder ${formattedBudget} per maand vinden vraagt vaak geduld en de juiste timing. Het aanbod onder dit budget bestaat meestal uit appartementen, studio's en kamers, soms met een gedeelde voorziening. Het is verstandig om dagelijks het aanbod te checken en alerts in te stellen, zodat je direct reageert wanneer een geschikte woning beschikbaar komt.`
    : `Een koopwoning in ${cityName} onder ${formattedBudget} kopen is haalbaar als je flexibel bent in type woning en buurt. Voor dit budget vind je vaak appartementen, kleinere huizen of woningen die wat opknapwerk nodig hebben. Vergeet niet de bijkomende kosten zoals overdrachtsbelasting, notaris en hypotheekadvies mee te rekenen in je totale budget.`;

  const tip = stats?.count && stats.avgSurface > 0
    ? `In ${cityName} ${action} onder ${formattedBudget} betekent gemiddeld ${stats.avgSurface}m² woonruimte. Het aanbod varieert van ${stats.minSurface}m² tot ${stats.maxSurface}m², dus er is keuze voor elke situatie.`
    : `Geen actief aanbod onder ${formattedBudget} in ${cityName} op dit moment. Maak een alert aan zodat je direct een mail krijgt zodra een passende woning beschikbaar komt.`;

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={title}
        description={description}
        canonical={`https://www.woonpeek.nl/${listingType === "huur" ? "huurwoningen" : "koopwoningen"}-onder-${budgetNum}-${city}`}
      />
      <Header />

      <main className="flex-1">
        <section className="border-b bg-muted/30 py-6">
          <div className="container">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: cityName, href: `/woningen-${city}` },
                { label: `Onder ${formattedBudget}` },
              ]}
            />
            <h1 className="mt-4 text-3xl font-bold md:text-4xl">
              {listingType === "huur" ? "Huurwoningen" : "Koopwoningen"} onder {formattedBudget} in {cityName}
            </h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">{intro}</p>
          </div>
        </section>

        <section className="py-8">
          <div className="container space-y-6">
            <AdSlot slotKey="budget_top" />

            <Card className="bg-primary/5">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">Wat krijg je voor {formattedBudget} in {cityName}?</h2>
                <p className="mt-2 text-muted-foreground">{tip}</p>
              </CardContent>
            </Card>

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
                  <p className="text-lg">Geen aanbod onder {formattedBudget} in {cityName}.</p>
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
            <h2 className="text-2xl font-bold">Andere budgetten in {cityName}</h2>
            <div className="flex flex-wrap gap-2">
              {validBudgets
                .filter((b) => b !== budgetNum)
                .map((b) => (
                  <Button key={b} asChild variant="outline" size="sm">
                    <Link to={`/${listingType === "huur" ? "huurwoningen" : "koopwoningen"}-onder-${b}-${city}`}>
                      Onder €{b.toLocaleString("nl-NL")}
                    </Link>
                  </Button>
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BudgetLandingPage;
