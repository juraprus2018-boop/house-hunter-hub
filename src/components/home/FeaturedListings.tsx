import { ArrowRight, MapPin, Bed, Square, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useFeaturedProperties } from "@/hooks/useProperties";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const FeaturedListings = () => {
  const { data: properties, isLoading } = useFeaturedProperties();
  const { user } = useAuth();
  const { toggle, isFavorite, isLoading: favoriteLoading } = useToggleFavorite();

  const formatPrice = (price: number, listingType: string) => {
    const formatted = new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return listingType === "huur" ? `${formatted}/mnd` : formatted;
  };

  const isNew = (createdAt: string) => {
    return new Date(createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <section className="py-8">
        <div className="container">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Uitgelichte woningen
            </h2>
            <p className="mt-2 text-muted-foreground">
              Er zijn nog geen woningen beschikbaar. Wees de eerste om een woning te plaatsen!
            </p>
          </div>
          <div className="text-center">
            <Link to="/plaatsen">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                Plaats je eerste woning
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Uitgelichte woningen
            </h2>
            <p className="mt-2 text-muted-foreground">
              Ontdek de nieuwste en populairste woningen op ons platform
            </p>
          </div>
          <Link to="/zoeken" className="hidden md:block">
            <Button variant="ghost" className="gap-2">
              Bekijk alle woningen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {properties.map((property) => (
              <CarouselItem key={property.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Link to={`/woning/${property.slug || property.id}`}>
                  <Card className="group overflow-hidden border-0 shadow-md transition-shadow hover:shadow-xl">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={property.images?.[0] || "/placeholder.svg"}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {isNew(property.created_at) && (
                        <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">
                          Nieuw
                        </Badge>
                      )}
                      {user && (
                        <button
                          className={cn(
                            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors hover:bg-white",
                            isFavorite(property.id)
                              ? "text-red-500"
                              : "text-muted-foreground hover:text-destructive"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            toggle(property.id);
                          }}
                          disabled={favoriteLoading}
                        >
                          <Heart
                            className={cn(
                              "h-5 w-5",
                              isFavorite(property.id) && "fill-current"
                            )}
                          />
                        </button>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <Badge variant="secondary" className="bg-white/90 capitalize text-foreground">
                          {property.property_type}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">
                          {property.title}
                        </h3>
                        <p className="font-display text-lg font-bold text-primary whitespace-nowrap">
                          {formatPrice(Number(property.price), property.listing_type)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{property.city}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        {property.bedrooms && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms} slaapkamers</span>
                          </div>
                        )}
                        {property.surface_area && (
                          <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            <span>{property.surface_area} m²</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>

        <div className="mt-6 text-center md:hidden">
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
