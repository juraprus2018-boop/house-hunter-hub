import { Link } from "react-router-dom";
import { Heart, Bed, Bath, Maximize, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const { user } = useAuth();
  const { toggle, isFavorite, isLoading } = useToggleFavorite();
  const isPropertyFavorite = isFavorite(property.id);

  const formatPrice = (price: number, listingType: string) => {
    const formatted = new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return listingType === "huur" ? `${formatted}/mnd` : formatted;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggle(property.id);
    }
  };

  const isNew = new Date(property.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (
    <Link to={`/woning/${property.slug || property.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.images?.[0] || "/placeholder.svg"}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            {isNew && (
              <Badge className="bg-accent text-accent-foreground">Nieuw</Badge>
            )}
            <Badge variant="secondary" className="capitalize">
              {property.listing_type}
            </Badge>
          </div>
          {user && (
            <Button
              size="icon"
              variant="secondary"
              className={cn(
                "absolute right-3 top-3 h-9 w-9 rounded-full",
                isPropertyFavorite && "bg-red-100 text-red-500 hover:bg-red-200"
              )}
              onClick={handleFavoriteClick}
              disabled={isLoading}
            >
              <Heart
                className={cn("h-5 w-5", isPropertyFavorite && "fill-current")}
              />
            </Button>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold leading-tight text-foreground line-clamp-1">
              {property.title}
            </h3>
          </div>
          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">
              {property.street} {property.house_number}, {property.city}
            </span>
          </div>
          <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            {property.surface_area && (
              <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                <span>{property.surface_area} m²</span>
              </div>
            )}
          </div>
          <p className="font-display text-xl font-bold text-primary">
            {formatPrice(Number(property.price), property.listing_type)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
