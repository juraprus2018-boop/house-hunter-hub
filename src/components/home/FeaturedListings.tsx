import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useFeaturedProperties } from "@/hooks/useProperties";
import PropertyCard from "@/components/properties/PropertyCard";

const FeaturedListings = () => {
  const { data: properties, isLoading } = useFeaturedProperties();

  if (isLoading) {
    return (
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) return null;

  // Show max 6 properties in a grid
  const displayProperties = properties.slice(0, 6);

  return (
    <section className="bg-muted/30 py-16 md:py-20">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Nieuwste woningen
            </h2>
            <p className="mt-3 text-muted-foreground">
              De meest recent toegevoegde woningen op ons platform
            </p>
          </div>
          <Link to="/zoeken" className="hidden sm:block">
            <Button variant="outline" className="gap-2">
              Bekijk alle woningen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/zoeken">
            <Button variant="outline" className="gap-2">
              Bekijk alle woningen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
