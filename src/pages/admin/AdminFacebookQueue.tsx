import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Plus,
  Trash2,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface FacebookGroup {
  id: string;
  name: string;
  group_url: string;
  city: string | null;
  is_active: boolean;
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

  const tags: string[] = [];
  tags.push(property.listing_type === "huur" ? "#huurwoning" : "#koopwoning");
  tags.push(property.listing_type === "huur" ? "#tehuur" : "#tekoop");
  tags.push(`#${property.property_type.toLowerCase()}`);
  tags.push(`#${property.city.toLowerCase().replace(/[^a-z0-9]/g, "")}`);
  tags.push("#woning", "#woonpeek", "#woningmarkt");
  lines.push([...new Set(tags)].slice(0, 8).join(" "));

  return lines.join("\n");
}

const AdminFacebookQueue = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupUrl, setNewGroupUrl] = useState("");
  const [newGroupCity, setNewGroupCity] = useState("");

  // Fetch facebook groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["facebook-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facebook_groups")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as FacebookGroup[];
    },
  });

  const selectedGroup = groups?.find((g) => g.id === selectedGroupId) || null;

  // Fetch unposted properties (optionally filtered by city)
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ["facebook-queue", selectedGroup?.id],
    queryFn: async () => {
      if (!selectedGroup) return [];
      let query = supabase
        .from("properties")
        .select("id, title, price, listing_type, city, street, house_number, postal_code, surface_area, bedrooms, bathrooms, images, slug, property_type, description, energy_label, build_year, created_at")
        .eq("status", "actief")
        .is("facebook_posted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (selectedGroup.city) {
        query = query.ilike("city", selectedGroup.city);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Property[];
    },
    enabled: !!selectedGroup && showQueue,
  });

  // Add group
  const addGroup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("facebook_groups").insert({
        name: newGroupName.trim(),
        group_url: newGroupUrl.trim(),
        city: newGroupCity.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebook-groups"] });
      setNewGroupName("");
      setNewGroupUrl("");
      setNewGroupCity("");
      setShowAddGroup(false);
      toast({ title: "Groep toegevoegd!" });
    },
    onError: () => {
      toast({ title: "Fout bij toevoegen", variant: "destructive" });
    },
  });

  // Delete group
  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from("facebook_groups")
        .update({ is_active: false })
        .eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebook-groups"] });
      setSelectedGroupId(null);
      toast({ title: "Groep verwijderd" });
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
      queryClient.invalidateQueries({ queryKey: ["facebook-queue"] });
    },
  });

  const normalizeGroupUrl = (url: string): string => {
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };

  const handleCopyAndOpen = async (property: Property, group: FacebookGroup) => {
    const text = buildPostText(property);

    let copied = false;

    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      copied = document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    if (!copied) {
      window.prompt("Kopiëren lukte niet automatisch. Kopieer handmatig:", text);
      toast({
        title: "Handmatig kopiëren",
        description: "Gebruik de gekopieerde tekst en klik daarna op Open groep.",
      });
      return;
    }

    setCopiedKey(`${property.id}-${group.id}`);
    setTimeout(() => setCopiedKey(null), 3000);

    toast({
      title: "✅ Tekst gekopieerd!",
      description: `Klik nu op \"Open groep\" voor \"${group.name}\".`,
    });

    await markPosted.mutateAsync(property.id);
  };

  const getImages = (images: string[] | null): string[] => {
    if (!images) return [];
    return images.filter((img) => img && img.trim() !== "").slice(0, 5);
  };

  const isLoading = groupsLoading || propertiesLoading;

  if (groupsLoading) {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
              <Facebook className="h-8 w-8 text-blue-600" />
              Facebook Groepen
            </h1>
            <p className="mt-1 text-muted-foreground">
              Beheer groepen en kopieer posts om handmatig te plaatsen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["facebook-groups"] });
                queryClient.invalidateQueries({ queryKey: ["facebook-queue"] });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Vernieuwen
            </Button>
          </div>
        </div>

        {/* Group tabs + add */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Groepen</CardTitle>
              <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Groep toevoegen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Facebook Groep toevoegen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-sm font-medium text-foreground">Naam *</label>
                      <Input
                        placeholder="bijv. Woningen Eindhoven"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Facebook Groep URL *</label>
                      <Input
                        placeholder="https://www.facebook.com/groups/..."
                        value={newGroupUrl}
                        onChange={(e) => setNewGroupUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Stad (optioneel)</label>
                      <Input
                        placeholder="bijv. Eindhoven (leeg = alle steden)"
                        value={newGroupCity}
                        onChange={(e) => setNewGroupCity(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Als je een stad invult worden alleen woningen uit die stad getoond
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!newGroupName.trim() || !newGroupUrl.trim() || addGroup.isPending}
                      onClick={() => addGroup.mutate()}
                    >
                      {addGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Toevoegen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {groups && groups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center gap-1">
                    <Button
                      variant={selectedGroup?.id === group.id && showQueue ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selectedGroupId === group.id && showQueue) {
                          setShowQueue(false);
                          setSelectedGroupId(null);
                        } else {
                          setSelectedGroupId(group.id);
                          setShowQueue(true);
                        }
                      }}
                      className="gap-2"
                    >
                      <Facebook className="h-3.5 w-3.5" />
                      {group.name}
                      {group.city && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {group.city}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Weet je zeker dat je "${group.name}" wilt verwijderen?`)) {
                          deleteGroup.mutate(group.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nog geen groepen toegevoegd. Klik op "Groep toevoegen" om te beginnen.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        {selectedGroup && showQueue && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-2">Hoe werkt het?</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Klik op <strong>"Kopieer tekst"</strong> bij een woning</li>
                <li>Klik daarna op <strong>"Open groep"</strong> om Facebook te openen</li>
                <li>Plak de tekst met <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+V</kbd></li>
                <li>Voeg eventueel foto's toe en klik op "Plaatsen"</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Queue */}
        {selectedGroup && showQueue && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {properties?.length || 0} woningen in de wachtrij
                {selectedGroup.city ? ` voor ${selectedGroup.city}` : ""}
              </Badge>
            </div>

            {propertiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="space-y-4">
                {properties.map((property) => {
                  const isExpanded = expandedId === property.id;
                  const images = getImages(property.images);
                  const isCopied = copiedKey === `${property.id}-${selectedGroup.id}`;

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
                            <Button asChild variant="outline" size="sm">
                              <a href={normalizeGroupUrl(selectedGroup.group_url)} target="_blank" rel="noopener noreferrer">
                                <Facebook className="h-4 w-4 mr-2" />
                                Open groep
                              </a>
                            </Button>
                            <Button
                              onClick={() => handleCopyAndOpen(property, selectedGroup)}
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
                                  Kopieer tekst
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => setExpandedId(isExpanded ? null : property.id)}
                        >
                          {isExpanded ? (
                            <><ChevronUp className="h-4 w-4 mr-1" /> Verberg preview</>
                          ) : (
                            <><ChevronDown className="h-4 w-4 mr-1" /> Bekijk post preview & foto's</>
                          )}
                        </Button>

                        {isExpanded && (
                          <div className="mt-4 space-y-4">
                            <div className="rounded-lg bg-muted/50 p-4">
                              <p className="text-xs font-medium text-muted-foreground mb-2">POST TEKST:</p>
                              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                                {buildPostText(property)}
                              </pre>
                            </div>

                            {images.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  FOTO'S (rechtermuisknop → "Afbeelding opslaan als"):
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
                                      <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
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
                    Alle woningen{selectedGroup.city ? ` in ${selectedGroup.city}` : ""} zijn al geplaatst.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!selectedGroup && groups && groups.length > 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Selecteer een groep</h3>
              <p className="text-muted-foreground mt-1">Klik hierboven op een groep om de wachtrij te bekijken.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFacebookQueue;
