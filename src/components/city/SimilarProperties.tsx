import PropertyCard from "@/components/properties/PropertyCard";
import { useSimilarProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";

interface SimilarPropertiesProps {
  cityName: string;
  excludeIds?: string[];
}

const SimilarProperties = ({ cityName, excludeIds = [] }: SimilarPropertiesProps) => {
  // Fetch huur and koop similar properties
  const huurQuery = useSimilarProperties("__none__", cityName, "huur");
  const koopQuery = useSimilarProperties("__none__", cityName, "koop");

  const allSimilar = [
    ...(huurQuery.data || []),
    ...(koopQuery.data || []),
  ]
    .filter((p) => !excludeIds.includes(p.id))
    .slice(0, 6);

  const isLoading = huurQuery.isLoading || koopQuery.isLoading;

  if (!isLoading && allSimilar.length === 0) return null;

  return (
    <section className="border-t py-12">
      <div className="container">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Nieuwste woningen in {cityName}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Recent toegevoegde woningen uit het aanbod van {cityName}
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border bg-card">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))
            : allSimilar.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
        </div>
      </div>
    </section>
  );
};

export default SimilarProperties;
