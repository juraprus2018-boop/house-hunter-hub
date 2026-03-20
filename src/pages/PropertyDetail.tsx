import { useParams, Link } from "react-router-dom";
import propertyPlaceholder from "@/assets/property-placeholder.jpg";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProperty, useSimilarProperties } from "@/hooks/useProperties";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useFeedLogos } from "@/hooks/useFeedLogos";
import { useAuth } from "@/contexts/AuthContext";
import PropertyMap from "@/components/properties/PropertyMap";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PropertyCard from "@/components/properties/PropertyCard";
import PriceAnalysis from "@/components/properties/PriceAnalysis";
import NearbyAmenities from "@/components/properties/NearbyAmenities";
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
  ExternalLink,
  Home,
  Copy,
  MessageCircle,
  Camera,
  ArrowRight,
  Building2,
  Ruler,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { cityPath } from "@/lib/cities";
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
  const { data: feedLogos } = useFeedLogos();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = property?.title || "Woning op WoonPeek";
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
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
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <Home className="h-12 w-12 text-muted-foreground/40" />
          <h1 className="font-display text-2xl font-bold">Woning niet gevonden</h1>
          <p className="text-muted-foreground">Deze woning bestaat niet of is niet meer beschikbaar.</p>
          <Button asChild><Link to="/zoeken">Terug naar zoeken</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = property.images?.length ? property.images : [propertyPlaceholder];
  const isPropertyFavorite = isFavorite(property.id);
  const sourceInfo = { source_url: property.source_url, source_site: property.source_site };
  const sourceMeta = sourceInfo.source_site
    ? SOURCE_SITE_META[sourceInfo.source_site] || { label: sourceInfo.source_site, color: "hsl(var(--primary))" }
    : null;
  const sourceLogo = feedLogos && sourceInfo.source_site
    ? feedLogos[sourceInfo.source_site.toLowerCase()]
    : undefined;

  const formatPrice = (price: number, listingType: string) => {
    const formatted = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
    return listingType === "huur" ? `${formatted}/mnd` : formatted;
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const citySlugVal = property.city.toLowerCase().replace(/\s+/g, "-");
  const typeLabel = property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1);
  const listingLabel = property.listing_type === "huur" ? "te huur" : "te koop";
  const bedroomsLabel = property.bedrooms ? `${property.bedrooms} kamers` : null;
  const surfaceLabel = property.surface_area ? `${property.surface_area} m²` : null;
  const priceFormatted = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(property.price));

  // Meta Title: [Woningtype] in [stad] – [kamers] – €[prijs]
  const seoTitle = `${typeLabel} in ${property.city}${bedroomsLabel ? ` – ${bedroomsLabel}` : ""} – ${priceFormatted} | WoonPeek`;

  // Meta Description
  const seoDescription = `Bekijk deze ${property.property_type} in ${property.city}.${bedroomsLabel ? ` ${bedroomsLabel}` : ""}${surfaceLabel ? ` • ${surfaceLabel}` : ""} • ${priceFormatted}${property.listing_type === "huur" ? "/mnd" : ""}. Bekijk foto's, informatie en vraag direct meer info aan.`;

  // H1: [Woningtype] te huur/koop in [stad] – [kamers]
  const h1Title = `${typeLabel} ${listingLabel} in ${property.city}${bedroomsLabel ? ` – ${bedroomsLabel}` : ""}`;

  // ── Product schema (Google-supported rich result with price) ──
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": property.title,
    "description": property.description || seoDescription,
    "url": `https://www.woonpeek.nl/woning/${property.slug}`,
    "image": property.images?.length ? property.images : undefined,
    "brand": { "@type": "Brand", "name": "WoonPeek" },
    "category": `${typeLabel} te ${property.listing_type}`,
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "EUR",
      "availability": property.status === "actief" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      "url": `https://www.woonpeek.nl/woning/${property.slug}`,
      "validFrom": property.created_at,
    },
    "additionalProperty": [
      ...(property.surface_area ? [{ "@type": "PropertyValue", "name": "Oppervlakte", "value": `${property.surface_area} m²`, "unitCode": "MTK" }] : []),
      ...(property.bedrooms ? [{ "@type": "PropertyValue", "name": "Slaapkamers", "value": property.bedrooms }] : []),
      ...(property.bathrooms ? [{ "@type": "PropertyValue", "name": "Badkamers", "value": property.bathrooms }] : []),
      ...(property.build_year ? [{ "@type": "PropertyValue", "name": "Bouwjaar", "value": property.build_year }] : []),
      ...(property.energy_label ? [{ "@type": "PropertyValue", "name": "Energielabel", "value": property.energy_label }] : []),
    ],
    ...(property.latitude && property.longitude ? {
      "geo": { "@type": "GeoCoordinates", "latitude": Number(property.latitude), "longitude": Number(property.longitude) }
    } : {}),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": `${property.street} ${property.house_number}`,
      "postalCode": property.postal_code,
      "addressLocality": property.city,
      "addressCountry": "NL",
    },
  };

  // ── RealEstateListing schema (extra context) ──
  const realEstateJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description || `${typeLabel} te ${property.listing_type} in ${property.city}`,
    "url": `https://www.woonpeek.nl/woning/${property.slug}`,
    "datePosted": property.created_at,
    "image": property.images?.length ? property.images : undefined,
  };

  // ── FAQ schema (Google-supported rich result) ──
  const priceLabel = property.listing_type === "huur" ? "huur" : "koop";
  const faqItems = [
    {
      question: `Wat is de ${priceLabel}prijs van ${property.street} ${property.house_number} in ${property.city}?`,
      answer: `De ${priceLabel}prijs van deze ${property.property_type} aan ${property.street} ${property.house_number}, ${property.postal_code} ${property.city} is ${formatPrice(Number(property.price), property.listing_type)}.${property.surface_area ? ` De prijs per m² komt neer op €${Math.round(Number(property.price) / property.surface_area).toLocaleString("nl-NL")}.` : ""}`,
    },
    {
      question: `Hoeveel kamers heeft ${property.street} ${property.house_number} in ${property.city}?`,
      answer: `Deze ${property.property_type} heeft ${property.bedrooms ? property.bedrooms + " slaapkamer(s)" : "een onbekend aantal slaapkamers"}${property.bathrooms ? " en " + property.bathrooms + " badkamer(s)" : ""}.${property.surface_area ? ` De woonoppervlakte is ${property.surface_area} m².` : ""}`,
    },
    {
      question: `Wat voor type woning is ${property.street} ${property.house_number}?`,
      answer: `Dit is een ${property.property_type} die te ${property.listing_type} wordt aangeboden in ${property.city}.${property.energy_label ? ` Het energielabel is ${property.energy_label}.` : ""}${property.build_year ? ` Het bouwjaar is ${property.build_year}.` : ""}`,
    },
    {
      question: `Is ${property.street} ${property.house_number} in ${property.city} nog beschikbaar?`,
      answer: property.status === "actief"
        ? `Ja, deze woning is momenteel actief beschikbaar op WoonPeek. De woning is geplaatst op ${new Date(property.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}.`
        : `Nee, deze woning is momenteel ${property.status}. Bekijk vergelijkbare woningen in ${property.city} op WoonPeek.`,
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  const kenmerken = [
    { icon: Building2, label: "Type", value: typeLabel },
    { icon: Tag, label: "Aanbod", value: `Te ${property.listing_type}` },
    property.surface_area ? { icon: Maximize, label: "Oppervlakte", value: `${property.surface_area} m²` } : null,
    property.bedrooms ? { icon: Bed, label: "Slaapkamers", value: String(property.bedrooms) } : null,
    property.bathrooms ? { icon: Bath, label: "Badkamers", value: String(property.bathrooms) } : null,
    property.build_year ? { icon: Calendar, label: "Bouwjaar", value: String(property.build_year) } : null,
    property.energy_label ? { icon: Zap, label: "Energielabel", value: property.energy_label } : null,
    property.neighborhood ? { icon: MapPin, label: "Buurt", value: property.neighborhood } : null,
  ].filter(Boolean) as { icon: typeof Home; label: string; value: string }[];

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={`https://www.woonpeek.nl/woning/${property.slug}`}
        ogImage={property.images?.length ? property.images[0] : undefined}
        ogType="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Header />

      <main className="flex-1">
        {/* ── Inactive Banner ── */}
        {property.status !== "actief" && (
          <div className="bg-destructive/10 border-b border-destructive/20">
            <div className="mx-auto max-w-screen-xl px-4 py-3 text-center">
              <p className="text-sm font-medium text-destructive">
                {property.status === "verhuurd" && "⚠️ Deze woning is verhuurd en niet meer beschikbaar."}
                {property.status === "verkocht" && "⚠️ Deze woning is verkocht en niet meer beschikbaar."}
                {property.status === "inactief" && "⚠️ Deze woning is niet meer beschikbaar. Mogelijk is deze al verhuurd of van de markt gehaald."}
              </p>
              <Link to="/zoeken" className="mt-1 inline-block text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                Bekijk vergelijkbare woningen →
              </Link>
            </div>
          </div>
        )}

        {/* ── Photo Gallery ── */}
        <section className="relative bg-muted">
          <div className="cursor-pointer" onClick={() => { setLightboxOpen(true); setCurrentImageIndex(0); }}>
            {images.length >= 3 ? (
              <div className="mx-auto grid h-[300px] max-w-screen-2xl grid-cols-4 gap-1 md:h-[480px]">
                <div className="col-span-2 row-span-2 overflow-hidden">
                  <img src={images[0]} alt={property.title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} />
                </div>
                <div className="col-span-1 overflow-hidden">
                  <img src={images[1]} alt={`${property.title} - foto 2`} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} />
                </div>
                <div className="col-span-1 overflow-hidden">
                  <img src={images[2]} alt={`${property.title} - foto 3`} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} />
                </div>
                {images.length >= 5 ? (
                  <>
                    <div className="col-span-1 overflow-hidden">
                      <img src={images[3]} alt={`${property.title} - foto 4`} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} />
                    </div>
                    <div className="relative col-span-1 overflow-hidden">
                      <img src={images[4]} alt={`${property.title} - foto 5`} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} />
                      {images.length > 5 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                          +{images.length - 5} foto's
                        </div>
                      )}
                    </div>
                  </>
                ) : images.length === 4 ? (
                  <>
                    <div className="col-span-2 overflow-hidden">
                      <img src={images[3]} alt={`${property.title} - foto 4`} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} />
                    </div>
                  </>
                ) : null}
              </div>
            ) : images.length === 2 ? (
              <div className="mx-auto grid h-[300px] max-w-screen-2xl grid-cols-2 gap-1 md:h-[480px]">
                <div className="overflow-hidden"><img src={images[0]} alt={property.title} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} /></div>
                <div className="overflow-hidden"><img src={images[1]} alt={`${property.title} - foto 2`} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} /></div>
              </div>
            ) : (
              <div className="mx-auto h-[300px] max-w-screen-2xl overflow-hidden md:h-[480px]">
                <img src={images[0]} alt={property.title} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} />
              </div>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-sm">
                <Camera className="h-4 w-4" />
                Alle {images.length} foto's
              </div>
            )}
          </div>
        </section>

        {/* Lightbox */}
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
                  <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-4 py-1.5 text-sm font-medium text-foreground">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-1 overflow-x-auto bg-black p-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImageIndex(i)} className={cn("h-16 w-20 flex-shrink-0 overflow-hidden rounded transition-all", i === currentImageIndex ? "ring-2 ring-primary" : "opacity-50 hover:opacity-80")}>
                    <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = propertyPlaceholder; }} />
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Main Content ── */}
        <div className="container py-6 lg:py-10 overflow-hidden">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: "Home", href: "/" },
            { label: property.city, href: cityPath(property.city) },
            { label: `${property.street} ${property.house_number}` },
          ]} />

          {/* Status banners */}
          {property.status === "inactief" && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">⚠️ Deze woning is verlopen — het aanbod is niet meer beschikbaar.</p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Verlopen sinds {new Date(property.updated_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
          {(property.status === "verkocht" || property.status === "verhuurd") && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">⚠️ Deze woning is {property.status}.</p>
            </div>
          )}

          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            {/* ── Left Column ── */}
            <div className="space-y-8 lg:col-span-2">
              {/* Title + price + quick stats */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize">{property.listing_type === "huur" ? "Te huur" : "Te koop"}</Badge>
                  <Badge variant="outline" className="capitalize">{property.property_type}</Badge>
                  {sourceMeta && (
                    <Badge variant="outline" style={{ borderColor: sourceMeta.color, color: sourceMeta.color }}>
                      {sourceMeta.label}
                    </Badge>
                  )}
                </div>
                <h1 className="font-display text-2xl font-bold leading-tight md:text-3xl lg:text-4xl">
                  {h1Title}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{property.street} {property.house_number}, {property.postal_code} {property.city}</span>
                </div>
                <p className="mt-3 font-display text-3xl font-bold text-primary md:text-4xl">
                  {formatPrice(Number(property.price), property.listing_type)}
                </p>

                {/* Quick stats row */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  {property.surface_area && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Maximize className="h-4 w-4" />
                      <span className="font-medium text-foreground">{property.surface_area} m²</span>
                    </div>
                  )}
                  {property.bedrooms && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Bed className="h-4 w-4" />
                      <span className="font-medium text-foreground">{property.bedrooms} slaapkamers</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Bath className="h-4 w-4" />
                      <span className="font-medium text-foreground">{property.bathrooms} badkamers</span>
                    </div>
                  )}
                  {property.energy_label && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium text-foreground">Label {property.energy_label}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div className="flex flex-wrap gap-2 border-y py-3">
                {user && (
                  <Button variant="ghost" size="sm" className={cn(isPropertyFavorite && "text-red-500")} onClick={() => toggle(property.id)} disabled={favoriteLoading}>
                    <Heart className={cn("mr-1.5 h-4 w-4", isPropertyFavorite && "fill-current")} />
                    {isPropertyFavorite ? "Opgeslagen" : "Opslaan"}
                  </Button>
                )}
                {typeof navigator.share === "function" ? (
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="mr-1.5 h-4 w-4" /> Delen
                  </Button>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm"><Share2 className="mr-1.5 h-4 w-4" /> Delen</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2">
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="sm" className="justify-start" onClick={copyLink}><Copy className="mr-2 h-4 w-4" /> Link kopiëren</Button>
                        <Button variant="ghost" size="sm" className="justify-start" asChild>
                          <a href={`https://wa.me/?text=${encodeURIComponent(property.title + " " + window.location.href)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</a>
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-start" asChild>
                          <a href={`mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(window.location.href)}`}><Mail className="mr-2 h-4 w-4" /> E-mail</a>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* ── Description ── */}
              <section>
                <h2 className="font-display text-xl font-semibold mb-3">
                  Beschrijving
                </h2>
                {property.description ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {property.description}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <Home className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Er is nog geen beschrijving beschikbaar voor deze woning.
                    </p>
                    {sourceInfo.source_url && (
                      <p className="mt-2 text-xs text-muted-foreground/70">
                        Bekijk de originele advertentie voor meer informatie.
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* ── Kenmerken ── */}
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">Kenmerken van deze woning in {property.city}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {kenmerken.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-sm font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Price Analysis ── */}
              <PriceAnalysis
                price={Number(property.price)}
                surfaceArea={property.surface_area}
                city={property.city}
                listingType={property.listing_type}
                propertyType={property.property_type}
              />

              {/* ── Map ── */}
              {property.latitude && property.longitude && (
                <section>
                  <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Locatie
                  </h2>
                  <div className="h-[350px] overflow-hidden rounded-xl border">
                    <PropertyMap
                      latitude={Number(property.latitude)}
                      longitude={Number(property.longitude)}
                      title={property.title}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.latitude},${property.longitude}&heading=0&pitch=0&fov=90`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Camera className="mr-1.5 h-4 w-4" /> Street View bekijken
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="mr-1.5 h-4 w-4" /> Bekijk op Google Maps
                      </a>
                    </Button>
                  </div>
                </section>
              )}

              {/* ── Nearby Amenities ── */}
              {property.latitude && property.longitude && (
                <NearbyAmenities
                  latitude={Number(property.latitude)}
                  longitude={Number(property.longitude)}
                  city={property.city}
                />
              )}

              {/* ── Over wonen in [stad] ── */}
              <section className="rounded-xl border bg-muted/30 p-6">
                <h2 className="font-display text-xl font-semibold mb-3">
                  Over wonen in {property.city}
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    {property.city} biedt een divers woningaanbod, van appartementen en studio's tot ruime eengezinswoningen. 
                    Of je nu op zoek bent naar een huurwoning of koopwoning in {property.city}, WoonPeek helpt je om het 
                    actuele aanbod overzichtelijk te vergelijken.
                  </p>
                  <p>
                    Bekijk alle beschikbare woningen in {property.city} en ontdek welke buurt het beste bij jou past. 
                    Stel een dagelijkse alert in om als eerste op de hoogte te zijn van nieuwe woningen.
                  </p>
                </div>
              </section>

              {/* ── Meer woningen in [stad] ── */}
              <section className="rounded-xl border bg-muted/30 p-6">
                <h2 className="font-display text-xl font-semibold mb-3">
                  Meer woningen in {property.city}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Bekijk alle beschikbare huurwoningen en koopwoningen in {property.city} en omgeving.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link to={cityPath(property.city)} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                    Alle woningen in {property.city}
                  </Link>
                  <Link to={`/huurwoningen/${citySlugVal}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                    Huurwoningen in {property.city}
                  </Link>
                  <Link to={`/koopwoningen/${citySlugVal}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                    Koopwoningen in {property.city}
                  </Link>
                  <Link to={`/appartementen/${citySlugVal}`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                    Appartementen in {property.city}
                  </Link>
                  <Link to={`/woningen/${citySlugVal}/onder-1000`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                    Woningen onder €1.000
                  </Link>
                  {property.bedrooms && (
                    <Link to={`/woningen/${citySlugVal}/${property.bedrooms}-kamers`} className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground transition-shadow hover:shadow-md hover:text-primary">
                      {property.bedrooms} kamers in {property.city}
                    </Link>
                  )}
                </div>
              </section>
            </div>

            {/* ── Sidebar ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Price + CTA Card */}
                <Card className="overflow-hidden shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {property.listing_type === "huur" ? "Maandhuur" : "Koopprijs"}
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold text-primary">
                        {formatPrice(Number(property.price), property.listing_type)}
                      </p>
                    </div>

                    <Separator />

                    {/* Quick specs */}
                    <div className="space-y-2.5">
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
                      {property.build_year && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bouwjaar</span>
                          <span className="font-medium">{property.build_year}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Primary CTA */}
                    {sourceInfo.source_url ? (
                      <Button asChild className="w-full" size="lg">
                        <a href={sourceInfo.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Reageer op deze woning
                        </a>
                      </Button>
                    ) : (
                      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full" size="lg">
                            <Mail className="mr-2 h-4 w-4" />
                            Vraag meer informatie
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

                {/* Source card */}
                {(sourceMeta || sourceLogo) && (
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        {sourceLogo ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white p-1">
                            <img
                              src={sourceLogo}
                              alt={sourceMeta?.label || sourceInfo.source_site || "Aanbieder"}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : sourceMeta ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: sourceMeta.color }}>
                            {sourceMeta.label.charAt(0).toUpperCase()}
                          </div>
                        ) : null}
                        <div>
                          <p className="font-semibold">{sourceMeta?.label || sourceInfo.source_site}</p>
                          <p className="text-xs text-muted-foreground">Externe aanbieder</p>
                        </div>
                      </div>
                      {sourceInfo.source_url && (
                        <Button asChild variant="outline" className="mt-3 w-full" size="sm">
                          <a href={sourceInfo.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            Bekijk bij {sourceMeta?.label || sourceInfo.source_site}
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

        {/* ── Similar Properties ── */}
        {similarProperties && similarProperties.length > 0 && (
          <section className="border-t bg-muted/30 py-12 lg:py-16">
            <div className="container">
              <h2 className="font-display text-2xl font-bold mb-2">
                Vergelijkbare woningen in {property.city}
              </h2>
              <p className="text-muted-foreground mb-8">
                Bekijk andere {property.listing_type === "huur" ? "huurwoningen" : "koopwoningen"} in {property.city}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {similarProperties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Button asChild variant="outline" size="lg">
                  <Link to={cityPath(property.city)}>
                    Alle woningen in {property.city}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ Section ── */}
        <section className="border-t bg-muted/30 py-12 lg:py-16">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl font-bold mb-6">
              Veelgestelde vragen over {property.street} {property.house_number}
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <details key={i} className="group rounded-xl border bg-card">
                  <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-foreground list-none flex items-center justify-between gap-4">
                    {faq.question}
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="border-t py-12 lg:py-16">
          <div className="container text-center">
            <h2 className="font-display text-2xl font-bold mb-3">Op zoek naar een woning?</h2>
            <p className="mx-auto max-w-lg text-muted-foreground mb-6">
              Ontdek duizenden huurwoningen en koopwoningen door heel Nederland op WoonPeek.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/zoeken">Bekijk het aanbod</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/dagelijkse-alert">Ontvang dagelijkse alerts</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetail;
