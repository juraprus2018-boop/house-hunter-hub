import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useFeaturedProperties } from "@/hooks/useProperties";
import PropertyCard from "@/components/properties/PropertyCard";

const FeaturedSkeleton = () => (
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

const FeaturedListings = () => {
  const { data: properties, isLoading } = useFeaturedProperties();

  if (isLoading) {
    return (
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mb-10">
            <Skeleton className="h-6 w-36 mb-2" />
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <FeaturedSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) return null;

  const displayProperties = properties.slice(0, 6);

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Clock className="h-3.5 w-3.5" />
              Dagelijks bijgewerkt
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Nieuw geplaatst vandaag
            </h2>
            <p className="mt-2 text-muted-foreground">
              De nieuwste woningen op ons platform. Wees er snel bij!
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
          {displayProperties.map((property, idx) => (
            <PropertyCard key={property.id} property={property} priority={idx === 0} />
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
