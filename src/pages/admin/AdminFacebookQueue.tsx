import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Check,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Facebook,
  RefreshCw,
} from "lucide-react";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/woningeneindhoven/";
const SITE_URL = "https://www.woonpeek.nl";

function formatPrice(price: number, listingType: string): string {
  const formatted = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(price);
  return listingType === "huur" ? `${formatted} p/m` : formatted;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface Property {
  id: string;
  title: string;
  price: number;
  listing_type: string;
  city: string;
  street: string;
  house_number: string;
  postal_code: string;
  surface_area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[] | null;
  slug: string | null;
  property_type: string;
  description: string | null;
  energy_label: string | null;
  build_year: number | null;
  created_at: string;
}

function buildPostText(property: Property): string {
  const typeLabel = capitalize(property.property_type);
  const priceFormatted = formatPrice(property.price, property.listing_type);
  const propertyUrl = `${SITE_URL}/woning/${property.slug || property.id}`;
  const listingLabel = property.listing_type === "huur" ? "te huur" : "te koop";

  const lines: string[] = [];

  lines.push(`🏠 ${typeLabel} ${listingLabel} in ${property.city} – ${priceFormatted}`);
  lines.push("");

  const specs: string[] = [];
  specs.push(`📍 ${property.street} ${property.house_number}, ${property.city}`);
  specs.push(`💰 ${priceFormatted}`);
  if (property.surface_area) specs.push(`📐 ${property.surface_area} m²`);
  if (property.bedrooms) specs.push(`🛏️ ${property.bedrooms} slaapkamer${property.bedrooms > 1 ? "s" : ""}`);
  if (property.bathrooms) specs.push(`🛁 ${property.bathrooms} badkamer${property.bathrooms > 1 ? "s" : ""}`);
  if (property.energy_label) specs.push(`⚡ Energielabel ${property.energy_label}`);
  if (property.build_year) specs.push(`🏗️ Bouwjaar ${property.build_year}`);
  lines.push(specs.join("\n"));
  lines.push("");

  // Short description
  if (property.description) {
    const clean = property.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (clean.length > 10) {
      const truncated = clean.length > 200 ? clean.substring(0, 200).replace(/\s\S*$/, "") + "..." : clean;
      lines.push(truncated);
      lines.push("");
    }
  }

  lines.push(`👉 Bekijk deze woning op WoonPeek:`);
  lines.push(propertyUrl);
  lines.push("");

  // Hashtags
  const tags: string[] = [];
  tags.push(property.listing_type === "huur" ? "#huurwoning" : "#koopwoning");
  tags.push(property.listing_type === "huur" ? "#tehuur" : "#tekoop");
  tags.push(`#${property.property_type.toLowerCase()}`);
  tags.push(`#${property.city.toLowerCase().replace(/[^a-z0-9]/g, "")}`);
  tags.push("#woning", "#woonpeek", "#woningmarkt", "#eindhoven");
  lines.push([...new Set(tags)].slice(0, 8).join(" "));

  return lines.join("\n");
}

const AdminFacebookQueue = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch unposted Eindhoven properties
  const { data: properties, isLoading } = useQuery({
    queryKey: ["facebook-queue-eindhoven"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, price, listing_type, city, street, house_number, postal_code, surface_area, bedrooms, bathrooms, images, slug, property_type, description, energy_label, build_year, created_at")
        .eq("status", "actief")
        .is("facebook_posted_at", null)
        .ilike("city", "Eindhoven")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as Property[];
    },
  });

  // Mark as posted
  const markPosted = useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase
        .from("properties")
        .update({ facebook_posted_at: new Date().toISOString() })
        .eq("id", propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebook-queue-eindhoven"] });
    },
  });

  const handleCopyAndOpen = async (property: Property) => {
    try {
      const text = buildPostText(property);
      await navigator.clipboard.writeText(text);
      setCopiedId(property.id);
      setTimeout(() => setCopiedId(null), 3000);

      // Open Facebook group in new tab
      window.open(FACEBOOK_GROUP_URL, "_blank", "noopener,noreferrer");

      toast({
        title: "✅ Post gekopieerd!",
        description: "Plak het bericht in de Facebook-groep met Ctrl+V / ⌘+V. Vergeet niet de foto's toe te voegen!",
      });

      // Mark as posted
      await markPosted.mutateAsync(property.id);
    } catch {
      toast({
        title: "Kopiëren mislukt",
        description: "Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  const getImages = (images: string[] | null): string[] => {
    if (!images) return [];
    return images.filter((img) => img && img.trim() !== "").slice(0, 5);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
              <Facebook className="h-8 w-8 text-blue-600" />
              Facebook Groep – Eindhoven
            </h1>
            <p className="mt-1 text-muted-foreground">
              Kopieer posts en plaats ze handmatig in de Facebook-groep
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["facebook-queue-eindhoven"] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
        </div>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-2">Hoe werkt het?</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Klik op <strong>"Kopieer & Open Groep"</strong> bij een woning</li>
              <li>De tekst wordt gekopieerd en de Facebook-groep opent in een nieuw tabblad</li>
              <li>Plak de tekst met <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+V</kbd></li>
              <li>Voeg eventueel foto's toe vanuit de preview hieronder</li>
              <li>Klik op "Plaatsen" in Facebook</li>
            </ol>
          </CardContent>
        </Card>

        {/* Queue count */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {properties?.length || 0} woningen in de wachtrij
          </Badge>
        </div>

        {/* Property cards */}
        {properties && properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map((property) => {
              const isExpanded = expandedId === property.id;
              const images = getImages(property.images);
              const isCopied = copiedId === property.id;

              return (
                <Card key={property.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{property.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          📍 {property.street} {property.house_number}, {property.city} •{" "}
                          💰 {formatPrice(property.price, property.listing_type)}
                          {property.surface_area ? ` • 📐 ${property.surface_area} m²` : ""}
                          {property.bedrooms ? ` • 🛏️ ${property.bedrooms}` : ""}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="capitalize">{property.property_type}</Badge>
                          <Badge variant="outline">{property.listing_type === "huur" ? "Huur" : "Koop"}</Badge>
                          {images.length > 0 && (
                            <Badge variant="secondary">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {images.length} foto's
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/woning/${property.slug || property.id}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleCopyAndOpen(property)}
                          disabled={isCopied}
                          className={isCopied ? "bg-emerald-600 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"}
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Gekopieerd!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Kopieer & Open Groep
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Expandable preview */}
                  <CardContent className="pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setExpandedId(isExpanded ? null : property.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Verberg preview
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Bekijk post preview & foto's
                        </>
                      )}
                    </Button>

                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        {/* Post text preview */}
                        <div className="rounded-lg bg-muted/50 p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">POST TEKST:</p>
                          <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                            {buildPostText(property)}
                          </pre>
                        </div>

                        {/* Images */}
                        {images.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              FOTO'S (rechtermuisknop → "Afbeelding opslaan als" om toe te voegen aan je groepspost):
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                              {images.map((img, i) => (
                                <a
                                  key={i}
                                  href={img}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block aspect-[4/3] rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                                >
                                  <img
                                    src={img}
                                    alt={`Foto ${i + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Facebook className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Geen woningen in de wachtrij</h3>
              <p className="text-muted-foreground mt-1">
                Alle Eindhoven-woningen zijn al geplaatst op Facebook.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFacebookQueue;
