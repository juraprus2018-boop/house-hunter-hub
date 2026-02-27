import { useParams, Link } from "react-router-dom";
import propertyPlaceholder from "@/assets/property-placeholder.jpg";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProperty, useSimilarProperties } from "@/hooks/useProperties";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import PropertyMap from "@/components/properties/PropertyMap";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PropertyCard from "@/components/properties/PropertyCard";
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
  Camera,
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
  huurzone: { label: "Huurzone", color: "#FF9800" },
};

const PropertyDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: property, isLoading } = useProperty(slug || "");
  const { data: similarProperties } = useSimilarProperties(
    property?.id || "",
    property?.city || "",
    property?.listing_type || ""
  );
  const { user } = useAuth();
  const { toggle, isFavorite, isLoading: favoriteLoading } = useToggleFavorite();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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
        {/* Photo Gallery Grid - Pararius style */}
        <div className="relative bg-muted">
          <div
            className="cursor-pointer"
            onClick={() => { setLightboxOpen(true); setCurrentImageIndex(0); }}
          >
            {images.length >= 3 ? (
              <div className="grid h-[280px] grid-cols-3 gap-1 md:h-[420px]">
                <div className="col-span-1 overflow-hidden">
                  <img
                    src={images[0]}
                    alt={property.title}
                    className="h-full w-full object-cover transition-opacity hover:opacity-90"
                    onError={(e) => { e.currentTarget.src = propertyPlaceholder; }}
                  />
                </div>
                <div className="col-span-1 overflow-hidden">
                  <img
                    src={images[1]}
                    alt={`${property.title} - foto 2`}
                    className="h-full w-full object-cover transition-opacity hover:opacity-90"
                    onError={(e) => { e.currentTarget.src = propertyPlaceholder; }}
                  />
                </div>
                <div className="col-span-1 overflow-hidden">
                  <img
                    src={images[2]}
                    alt={`${property.title} - foto 3`}
                    className="h-full w-full object-cover transition-opacity hover:opacity-90"
                    onError={(e) => { e.currentTarget.src = propertyPlaceholder; }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-[280px] overflow-hidden md:h-[420px]">
                <img
                  src={images[0]}
                  alt={property.title}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.src = propertyPlaceholder; }}
                />
              </div>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-background/90 px-3 py-2 text-sm font-medium text-foreground shadow-md backdrop-blur-sm">
                <Camera className="h-4 w-4" />
                {images.length} foto's
              </div>
            )}
          </div>
        </div>

        {/* Lightbox Dialog */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-5xl border-0 bg-black/95 p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Foto's van {property.title}</DialogTitle>
              <DialogDescription>Bekijk alle foto's</DialogDescription>
            </DialogHeader>
            <div className="relative flex items-center justify-center" style={{ minHeight: "70vh" }}>
              <img
                src={images[currentImageIndex]}
                alt={`${property.title} - foto ${currentImageIndex + 1}`}
                className="max-h-[80vh] max-w-full object-contain"
                onError={(e) => { e.currentTarget.src = propertyPlaceholder; }}
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-4 py-1.5 text-sm font-medium text-foreground">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-1 overflow-x-auto bg-black p-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={cn(
                      "h-16 w-20 flex-shrink-0 overflow-hidden rounded transition-all",
                      i === currentImageIndex ? "ring-2 ring-primary" : "opacity-50 hover:opacity-80"
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} />
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Breadcrumbs + Content */}
        <div className="container py-6">
          <div className="mb-4 flex items-center justify-between">
            <Breadcrumbs items={[
              { label: "Home", href: "/" },
              { label: property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1) },
              { label: property.city, href: `/${property.city.toLowerCase().replace(/\s+/g, "-")}` },
              { label: property.neighborhood || property.city },
            ]} />
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(isPropertyFavorite && "text-red-500")}
                  onClick={() => toggle(property.id)}
                  disabled={favoriteLoading}
                >
                  <Heart className={cn("mr-1.5 h-4 w-4", isPropertyFavorite && "fill-current")} />
                  {isPropertyFavorite ? "Opgeslagen" : "Toevoegen aan favorieten"}
                </Button>
              )}
              {typeof navigator.share === "function" ? (
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="mr-1.5 h-4 w-4" />
                  Delen
                </Button>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Share2 className="mr-1.5 h-4 w-4" />
                      Delen
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm" className="justify-start" onClick={copyLink}>
                        <Copy className="mr-2 h-4 w-4" /> Link kopiëren
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start" asChild>
                        <a href={`https://wa.me/?text=${encodeURIComponent(property.title + " " + window.location.href)}`} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start" asChild>
                        <a href={`mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(window.location.href)}`}>
                          <Mail className="mr-2 h-4 w-4" /> E-mail
                        </a>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {/* Inactive banners */}
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

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & address */}
              <div>
                <h1 className="font-display text-2xl font-bold md:text-3xl">{property.title}</h1>
                <p className="mt-1 text-muted-foreground">
                  {property.street} {property.house_number}, {property.postal_code} {property.city}, Netherlands
                </p>
              </div>

              {/* Description */}
              <div>
                <h2 className="mb-3 font-display text-lg font-semibold">
                  Te {property.listing_type}: {property.street} {property.house_number}, {property.city} –
                </h2>
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

              <Separator />

              {/* Details / Kenmerken */}
              <div>
                <h2 className="mb-4 font-display text-lg font-semibold">Kenmerken</h2>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex justify-between rounded-lg border p-3">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium capitalize">{property.property_type}</dd>
                  </div>
                  <div className="flex justify-between rounded-lg border p-3">
                    <dt className="text-muted-foreground">Aanbod</dt>
                    <dd className="font-medium capitalize">Te {property.listing_type}</dd>
                  </div>
                  {property.surface_area && (
                    <div className="flex justify-between rounded-lg border p-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><Maximize className="h-4 w-4" /> Oppervlakte</dt>
                      <dd className="font-medium">{property.surface_area} m²</dd>
                    </div>
                  )}
                  {property.bedrooms && (
                    <div className="flex justify-between rounded-lg border p-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><Bed className="h-4 w-4" /> Slaapkamers</dt>
                      <dd className="font-medium">{property.bedrooms}</dd>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex justify-between rounded-lg border p-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><Bath className="h-4 w-4" /> Badkamers</dt>
                      <dd className="font-medium">{property.bathrooms}</dd>
                    </div>
                  )}
                  {property.build_year && (
                    <div className="flex justify-between rounded-lg border p-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Bouwjaar</dt>
                      <dd className="font-medium">{property.build_year}</dd>
                    </div>
                  )}
                  {property.energy_label && (
                    <div className="flex justify-between rounded-lg border p-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><Zap className="h-4 w-4" /> Energielabel</dt>
                      <dd className="font-medium">{property.energy_label}</dd>
                    </div>
                  )}
                  {property.neighborhood && (
                    <div className="flex justify-between rounded-lg border p-3">
                      <dt className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> Buurt</dt>
                      <dd className="font-medium">{property.neighborhood}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Map */}
              {property.latitude && property.longitude && (
                <div>
                  <h2 className="mb-4 font-display text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Locatie
                  </h2>
                  <div className="h-[300px] overflow-hidden rounded-lg border">
                    <PropertyMap
                      latitude={Number(property.latitude)}
                      longitude={Number(property.longitude)}
                      title={property.title}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Price card */}
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground capitalize">
                      {property.listing_type === "huur" ? "Maandhuur" : "Koopprijs"}
                    </p>
                    <p className="mt-1 font-display text-3xl font-bold text-foreground">
                      {new Intl.NumberFormat("nl-NL", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(Number(property.price))}
                      <span className="ml-1 text-lg font-normal text-muted-foreground">€</span>
                    </p>
                    <Separator className="my-4" />
                    {/* Quick specs in sidebar */}
                    <div className="space-y-3">
                      {property.surface_area && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Oppervlakte</span>
                          <span className="font-medium">{property.surface_area} m²</span>
                        </div>
                      )}
                      {property.bedrooms && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Slaapkamers</span>
                          <span className="font-medium">{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Badkamers</span>
                          <span className="font-medium">{property.bathrooms}</span>
                        </div>
                      )}
                    </div>
                    <Separator className="my-4" />
                    {/* CTA Button */}
                    {sourceInfo?.source_url ? (
                      <Button asChild className="w-full" size="lg">
                        <a href={sourceInfo.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Reageren
                        </a>
                      </Button>
                    ) : (
                      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full" size="lg">
                            <Mail className="mr-2 h-4 w-4" />
                            Reageren
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
                    )}
                  </CardContent>
                </Card>

                {/* Source / aanbieder card */}
                {sourceInfo && sourceMeta && (
                  <Card>
                    <CardContent className="p-5">
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
                      {sourceInfo.source_url && (
                        <Button asChild variant="outline" className="mt-3 w-full" size="sm">
                          <a href={sourceInfo.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            Bekijk bij {sourceMeta.label}
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar properties */}
        {similarProperties && similarProperties.length > 0 && (
          <section className="border-t bg-muted/30 py-12">
            <div className="container">
              <h2 className="font-display text-2xl font-bold mb-6">
                Vergelijkbare woningen in {property.city}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {similarProperties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetail;
