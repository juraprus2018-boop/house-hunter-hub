import { useParams, Link } from "react-router-dom";
import propertyPlaceholder from "@/assets/property-placeholder.jpg";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProperty } from "@/hooks/useProperties";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import PropertyMap from "@/components/properties/PropertyMap";
import SEOHead from "@/components/seo/SEOHead";
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
  Copy,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SOURCE_SITE_META: Record<string, { label: string; color: string }> = {
  wooniezie: { label: "Wooniezie", color: "#FF6B00" },
  pararius: { label: "Pararius", color: "#00A651" },
  kamernet: { label: "Kamernet", color: "#1E88E5" },
  "huurwoningen.nl": { label: "Huurwoningen.nl", color: "#E53935" },
  directwonen: { label: "DirectWonen", color: "#7B1FA2" },
  vesteda: { label: "Vesteda", color: "#004D40" },
};

const PropertyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: property, isLoading } = useProperty(slug || "");
  const { user } = useAuth();
  const { toggle, isFavorite, isLoading: favoriteLoading } = useToggleFavorite();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = property?.title || "Woning op WoonPeek";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link gekopieerd!" });
  };

  const handleContact = async () => {
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast({ title: "Vul alle verplichte velden in", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          property_id: property?.id,
          sender_name: contactForm.name.trim().substring(0, 100),
          sender_email: contactForm.email.trim().substring(0, 255),
          sender_phone: contactForm.phone.trim().substring(0, 20) || null,
          message: contactForm.message.trim().substring(0, 2000),
        },
      });
      if (error) throw error;
      toast({ title: "Bericht verzonden!" });
      setContactOpen(false);
      setContactForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast({ title: "Verzenden mislukt", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const sourceInfo = property ? { source_url: property.source_url, source_site: property.source_site } : null;

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

  const images = property.images?.length ? property.images : [propertyPlaceholder];
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

  const seoTitle = property
    ? `${property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)} te ${property.listing_type}: ${property.street} ${property.house_number} ${property.postal_code} ${property.city} | WoonPeek`
    : "Woning | WoonPeek";

  const jsonLd = property ? {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description || `${property.property_type} te ${property.listing_type} in ${property.city}`,
    "url": `https://www.woonpeek.nl/woning/${property.slug}`,
    "datePosted": property.created_at,
    "image": property.images?.length ? property.images : undefined,
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "EUR",
      "availability": property.status === "actief" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": `${property.street} ${property.house_number}`,
      "postalCode": property.postal_code,
      "addressLocality": property.city,
      "addressCountry": "NL",
    },
    ...(property.latitude && property.longitude ? {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": Number(property.latitude),
        "longitude": Number(property.longitude),
      }
    } : {}),
    "additionalProperty": [
      ...(property.surface_area ? [{ "@type": "PropertyValue", "name": "Oppervlakte", "value": `${property.surface_area} m²` }] : []),
      ...(property.bedrooms ? [{ "@type": "PropertyValue", "name": "Slaapkamers", "value": property.bedrooms }] : []),
      ...(property.bathrooms ? [{ "@type": "PropertyValue", "name": "Badkamers", "value": property.bathrooms }] : []),
      ...(property.build_year ? [{ "@type": "PropertyValue", "name": "Bouwjaar", "value": property.build_year }] : []),
      ...(property.energy_label ? [{ "@type": "PropertyValue", "name": "Energielabel", "value": property.energy_label }] : []),
    ],
  } : null;

  return (
    <div className="flex min-h-screen flex-col">
      {property && (
        <>
          <SEOHead
            title={seoTitle}
            description={`${property.property_type} te ${property.listing_type} aan ${property.street} ${property.house_number}, ${property.postal_code} ${property.city}. ${property.surface_area ? property.surface_area + ' m²' : ''} ${property.bedrooms ? property.bedrooms + ' slaapkamers' : ''} voor ${formatPrice(Number(property.price), property.listing_type)}.`}
            canonical={`https://www.woonpeek.nl/woning/${property.slug}`}
            ogImage={property.images?.length ? property.images[0] : undefined}
            ogType="article"
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </>
      )}
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

          {/* Inactive banner */}
          {property.status === "inactief" && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                ⚠️ Deze woning is verlopen — het aanbod is niet meer beschikbaar bij de aanbieder.
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Verlopen sinds {new Date(property.updated_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
          {(property.status === "verkocht" || property.status === "verhuurd") && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                ⚠️ Deze woning is {property.status}.
              </p>
            </div>
          )}
        </div>

        {/* Image gallery */}
        <div className="relative bg-muted">
          <div className="container">
            <div className="relative aspect-[16/9] overflow-hidden md:aspect-[21/9]">
              <img
                src={images[currentImageIndex]}
                alt={property.title}
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.src = propertyPlaceholder; }}
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
                      {property.status === "inactief" ? "verlopen" : property.status}
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

              {/* Map */}
              {property.latitude && property.longitude && (
                <Card className="mb-6 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Locatie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[300px]">
                      <PropertyMap
                        latitude={Number(property.latitude)}
                        longitude={Number(property.longitude)}
                        title={property.title}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

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
                      {typeof navigator.share === "function" ? (
                        <Button variant="outline" className="flex-1" onClick={handleShare}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Delen
                        </Button>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="flex-1">
                              <Share2 className="mr-2 h-4 w-4" />
                              Delen
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2">
                            <div className="flex flex-col gap-1">
                              <Button variant="ghost" size="sm" className="justify-start" onClick={copyLink}>
                                <Copy className="mr-2 h-4 w-4" />
                                Link kopiëren
                              </Button>
                              <Button variant="ghost" size="sm" className="justify-start" asChild>
                                <a href={`https://wa.me/?text=${encodeURIComponent(property.title + " " + window.location.href)}`} target="_blank" rel="noopener noreferrer">
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  WhatsApp
                                </a>
                              </Button>
                              <Button variant="ghost" size="sm" className="justify-start" asChild>
                                <a href={`mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(window.location.href)}`}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  E-mail
                                </a>
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
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
                        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full">
                              <Mail className="mr-2 h-4 w-4" />
                              Stuur bericht
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Bericht sturen</DialogTitle>
                              <DialogDescription>Stuur een bericht naar de eigenaar van deze woning.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Naam *</Label>
                                <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Je naam" />
                              </div>
                              <div className="space-y-2">
                                <Label>E-mailadres *</Label>
                                <Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="je@email.nl" />
                              </div>
                              <div className="space-y-2">
                                <Label>Telefoonnummer</Label>
                                <Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="Optioneel" />
                              </div>
                              <div className="space-y-2">
                                <Label>Bericht *</Label>
                                <Textarea value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Schrijf je bericht..." rows={4} />
                              </div>
                              <Button onClick={handleContact} className="w-full" disabled={sending}>
                                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Versturen
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
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
