import { Link } from "react-router-dom";
import { Heart, Bed, Bath, Maximize, MapPin, Zap, Share2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useFeedLogos } from "@/hooks/useFeedLogos";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import propertyPlaceholder from "@/assets/property-placeholder.jpg";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyCardProps {
  property: Property;
  /** Average price for this property type in the same city (used for deal labels) */
  cityAvgPrice?: number;
}

const PropertyCard = ({ property, cityAvgPrice }: PropertyCardProps) => {
  const { user } = useAuth();
  const { toggle, isFavorite, isLoading } = useToggleFavorite();
  const { data: feedLogos } = useFeedLogos();
  const isPropertyFavorite = isFavorite(property.id);

  const sourceLogo = feedLogos && property.source_site
    ? feedLogos[property.source_site.toLowerCase()]
    : undefined;

  const formatPrice = (price: number, listingType: string) => {
    const formatted = new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return listingType === "huur" ? `${formatted} per maand` : formatted;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggle(property.id);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/woning/${property.slug || property.id}`;
    if (navigator.share) {
      navigator.share({ title: property.title, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const hoursAgo = (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60);
  const isToday = hoursAgo < 24;
  const isNew = hoursAgo < 7 * 24;

  const energyLabelColor: Record<string, string> = {
    "A++": "bg-success text-success-foreground",
    "A+": "bg-success text-success-foreground",
    "A": "bg-success text-success-foreground",
    "B": "bg-success/80 text-success-foreground",
    "C": "bg-warning text-warning-foreground",
    "D": "bg-warning text-warning-foreground",
    "E": "bg-destructive/80 text-destructive-foreground",
    "F": "bg-destructive text-destructive-foreground",
    "G": "bg-destructive text-destructive-foreground",
  };

  return (
    <Link to={`/woning/${property.slug || property.id}`}>
      <Card className={cn(
        "group overflow-hidden border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        property.status !== "actief" && "opacity-75"
      )}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.images?.[0] || propertyPlaceholder}
            alt={property.title}
            loading="lazy"
            decoding="async"
            width={400}
            height={300}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = propertyPlaceholder; }}
          />
          {/* Badges top-left */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {property.status === "inactief" && (
              <Badge variant="destructive" className="text-xs">Inactief</Badge>
            )}
            {property.status === "verhuurd" && (
              <Badge variant="destructive" className="text-xs">Verhuurd</Badge>
            )}
            {property.status === "verkocht" && (
              <Badge variant="destructive" className="text-xs">Verkocht</Badge>
            )}
            {isToday && property.status === "actief" && (
              <Badge className="bg-accent text-accent-foreground text-xs font-semibold">
                Nieuw vandaag
              </Badge>
            )}
            {!isToday && isNew && property.status === "actief" && (
              <Badge className="bg-accent/80 text-accent-foreground text-xs">Nieuw</Badge>
            )}
            <Badge variant="secondary" className="capitalize text-xs">
              {property.listing_type}
            </Badge>
          </div>

          {/* Actions top-right */}
          <div className="absolute right-3 top-3 flex gap-1.5">
            {user && (
              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  "h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white",
                  isPropertyFavorite && "bg-red-100 text-red-500 hover:bg-red-200"
                )}
                onClick={handleFavoriteClick}
                disabled={isLoading}
              >
                <Heart className={cn("h-4 w-4", isPropertyFavorite && "fill-current")} />
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white"
              onClick={handleShareClick}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Source logo */}
          {sourceLogo && (
            <div className="absolute right-3 bottom-3 h-7 w-7 rounded-md bg-white/90 p-0.5 shadow-sm">
              <img
                src={sourceLogo}
                alt={property.source_site || "Aanbieder"}
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Price */}
          <p className="font-display text-xl font-bold text-primary">
            {formatPrice(Number(property.price), property.listing_type)}
          </p>

          {/* Title */}
          <h3 className="mt-1 text-sm leading-tight text-foreground line-clamp-1" style={{ fontWeight: 600 }}>
            {property.title}
          </h3>

          {/* Location */}
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {property.street} {property.house_number}, {property.city}
            </span>
          </div>

          {/* Stats row */}
          <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            {property.surface_area && (
              <div className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                <span>{property.surface_area} m²</span>
              </div>
            )}
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                <span>{property.bedrooms} kamers</span>
              </div>
            )}
            {property.energy_label && (
              <Badge variant="outline" className={cn("ml-auto h-5 px-1.5 text-[10px] font-bold", energyLabelColor[property.energy_label])}>
                {property.energy_label}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PropertyCard;
