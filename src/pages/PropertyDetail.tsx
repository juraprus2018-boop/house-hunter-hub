import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProperty } from "@/hooks/useProperties";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Zap,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  ArrowLeft,
  ExternalLink,
  Globe,
  Home,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const SOURCE_SITE_META: Record<string, { label: string; color: string }> = {
  wooniezie: { label: "Wooniezie", color: "#FF6B00" },
  pararius: { label: "Pararius", color: "#00A651" },
  kamernet: { label: "Kamernet", color: "#1E88E5" },
  "huurwoningen.nl": { label: "Huurwoningen.nl", color: "#E53935" },
  directwonen: { label: "DirectWonen", color: "#7B1FA2" },
  vesteda: { label: "Vesteda", color: "#004D40" },
};

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id || "");
  const { user } = useAuth();
  const { toggle, isFavorite, isLoading: favoriteLoading } = useToggleFavorite();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: sourceInfo } = useQuery({
    queryKey: ["property-source", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("scraped_properties")
        .select("source_url, source_site")
        .eq("published_property_id", id!)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const sourceMeta = sourceInfo?.source_site
    ? SOURCE_SITE_META[sourceInfo.source_site] || { label: sourceInfo.source_site, color: "hsl(var(--primary))" }
    : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center">
          <h1 className="font-display text-2xl font-bold">Woning niet gevonden</h1>
          <p className="mt-2 text-muted-foreground">
            Deze woning bestaat niet of is niet meer beschikbaar.
          </p>
          <Button asChild className="mt-4">
            <Link to="/zoeken">Terug naar zoeken</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = property.images?.length ? property.images : ["/placeholder.svg"];
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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Back button */}
        <div className="container py-4">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/zoeken">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar zoeken
            </Link>
          </Button>
        </div>

        {/* Image gallery */}
        <div className="relative bg-muted">
          <div className="container">
            <div className="relative aspect-[16/9] overflow-hidden md:aspect-[21/9]">
              <img
                src={images[currentImageIndex]}
                alt={property.title}
                className="h-full w-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors",
                          index === currentImageIndex ? "bg-white" : "bg-white/50"
                        )}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {property.listing_type}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {property.property_type}
                  </Badge>
                  {property.status !== "actief" && (
                    <Badge variant="destructive" className="capitalize">
                      {property.status}
                    </Badge>
                  )}
                </div>
                <h1 className="font-display text-3xl font-bold">{property.title}</h1>
                <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>
                    {property.street} {property.house_number}, {property.postal_code} {property.city}
                  </span>
                </div>
                <p className="mt-4 font-display text-3xl font-bold text-primary">
                  {formatPrice(Number(property.price), property.listing_type)}
                </p>
              </div>

              <Separator className="my-6" />

              {/* Quick specs */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {property.surface_area && (
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <Maximize className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Oppervlakte</p>
                      <p className="font-semibold">{property.surface_area} m²</p>
                    </div>
                  </div>
                )}
                {property.bedrooms && (
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <Bed className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Slaapkamers</p>
                      <p className="font-semibold">{property.bedrooms}</p>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <Bath className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Badkamers</p>
                      <p className="font-semibold">{property.bathrooms}</p>
                    </div>
                  </div>
                )}
                {property.build_year && (
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <Calendar className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bouwjaar</p>
                      <p className="font-semibold">{property.build_year}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="mb-4 font-display text-xl font-semibold">Beschrijving</h2>
                {property.description ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {property.description}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <Home className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Er is nog geen uitgebreide beschrijving beschikbaar voor deze woning.
                    </p>
                    {sourceInfo?.source_url && (
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        Bekijk de originele advertentie voor meer informatie bij de aanbieder.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* All specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Kenmerken</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Type</dt>
                      <dd className="font-medium capitalize">{property.property_type}</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Aanbod</dt>
                      <dd className="font-medium capitalize">Te {property.listing_type}</dd>
                    </div>
                    {property.surface_area && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-muted-foreground">Oppervlakte</dt>
                        <dd className="font-medium">{property.surface_area} m²</dd>
                      </div>
                    )}
                    {property.bedrooms && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-muted-foreground">Slaapkamers</dt>
                        <dd className="font-medium">{property.bedrooms}</dd>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-muted-foreground">Badkamers</dt>
                        <dd className="font-medium">{property.bathrooms}</dd>
                      </div>
                    )}
                    {property.build_year && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-muted-foreground">Bouwjaar</dt>
                        <dd className="font-medium">{property.build_year}</dd>
                      </div>
                    )}
                    {property.energy_label && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-muted-foreground">Energielabel</dt>
                        <dd className="font-medium">{property.energy_label}</dd>
                      </div>
                    )}
                    {property.neighborhood && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-muted-foreground">Buurt</dt>
                        <dd className="font-medium">{property.neighborhood}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Action buttons */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-2">
                      {user && (
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1",
                            isPropertyFavorite && "border-red-500 text-red-500"
                          )}
                          onClick={() => toggle(property.id)}
                          disabled={favoriteLoading}
                        >
                          <Heart
                            className={cn(
                              "mr-2 h-4 w-4",
                              isPropertyFavorite && "fill-current"
                            )}
                          />
                          {isPropertyFavorite ? "Opgeslagen" : "Bewaren"}
                        </Button>
                      )}
                      <Button variant="outline" className="flex-1">
                        <Share2 className="mr-2 h-4 w-4" />
                        Delen
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Source / aanbieder card */}
                {sourceInfo && sourceMeta && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="h-4 w-4" />
                        Aanbieder
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                          style={{ backgroundColor: sourceMeta.color }}
                        >
                          {sourceMeta.label.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{sourceMeta.label}</p>
                          <p className="text-xs text-muted-foreground">Externe aanbieder</p>
                        </div>
                      </div>
                      <Button asChild className="w-full">
                        <a href={sourceInfo.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Bekijk bij {sourceMeta.label}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Contact card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact opnemen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Interesse in deze woning? Neem contact op met de aanbieder.
                    </p>
                    {sourceInfo?.source_url ? (
                      <Button asChild className="w-full">
                        <a href={sourceInfo.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ga naar aanbieder
                        </a>
                      </Button>
                    ) : (
                      <>
                        <Button className="w-full">
                          <Mail className="mr-2 h-4 w-4" />
                          Stuur bericht
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Phone className="mr-2 h-4 w-4" />
                          Bel aanbieder
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetail;
