import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useScrapedProperties,
  useUpdateScrapedProperty,
} from "@/hooks/useAdmin";
import { useApproveScrapedProperty } from "@/hooks/useApproveScrapedProperty";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Euro,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const AdminReviewQueue = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingProperty, setViewingProperty] = useState<any>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Edit form state for approval
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data: pendingProperties, isLoading: pendingLoading } = useScrapedProperties("pending");
  const { data: approvedProperties } = useScrapedProperties("approved");
  const { data: rejectedProperties } = useScrapedProperties("rejected");

  const updateScrapedProperty = useUpdateScrapedProperty();
  const approveProperty = useApproveScrapedProperty();
  const { user } = useAuth();
  const { toast } = useToast();

  const currentProperties =
    activeTab === "pending"
      ? pendingProperties
      : activeTab === "approved"
      ? approvedProperties
      : rejectedProperties;

  const filteredProperties = currentProperties?.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.source_site.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number | null) => {
    if (!price) return "Onbekend";
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleView = (property: any) => {
    setViewingProperty(property);
    setEditForm({
      title: property.title,
      description: property.description || "",
      price: property.price || "",
      city: property.city || "",
      street: property.street || "",
      house_number: property.house_number || "",
      postal_code: property.postal_code || "",
      property_type: property.property_type || "appartement",
      listing_type: property.listing_type || "huur",
      bedrooms: property.bedrooms || "",
      bathrooms: property.bathrooms || "",
      surface_area: property.surface_area || "",
    });
  };

  const handleApprove = async () => {
    if (!viewingProperty || !user) return;

    try {
      await approveProperty.mutateAsync({
        scrapedProperty: viewingProperty,
        overrides: editForm,
        userId: user.id,
      });
      toast({
        title: "Woning goedgekeurd",
        description: "De woning is gepubliceerd op het platform.",
      });
      setViewingProperty(null);
    } catch (error: any) {
      toast({
        title: "Fout bij goedkeuren",
        description: error.message || "Kon de woning niet publiceren.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!user) return;

    try {
      await updateScrapedProperty.mutateAsync({
        id,
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      });
      toast({
        title: "Woning afgewezen",
        description: "De scraped woning is afgewezen.",
      });
      setRejectingId(null);
      setViewingProperty(null);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon de woning niet afwijzen.",
        variant: "destructive",
      });
    }
  };

  if (pendingLoading) {
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
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Review Queue
          </h1>
          <p className="mt-1 text-muted-foreground">
            Beoordeel scraped woningen en keur ze goed voor publicatie
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Wachtend op review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {pendingProperties?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Goedgekeurd
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {approvedProperties?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Afgewezen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {rejectedProperties?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Wachtend
              {(pendingProperties?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingProperties?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Goedgekeurd</TabsTrigger>
            <TabsTrigger value="rejected">Afgewezen</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek op titel, stad of bron..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Property Cards */}
            {filteredProperties && filteredProperties.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProperties.map((property) => (
                  <Card key={property.id} className="overflow-hidden">
                    {/* Image */}
                    {property.images && property.images.length > 0 ? (
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-muted flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold line-clamp-1">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {[property.street, property.city]
                              .filter(Boolean)
                              .join(", ") || "Locatie onbekend"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-primary">
                          {formatPrice(property.price)}
                        </span>
                        {property.surface_area && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Maximize className="h-3 w-3" />
                            {property.surface_area}m²
                          </span>
                        )}
                        {property.bedrooms && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Bed className="h-3 w-3" />
                            {property.bedrooms}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {property.source_site}
                        </Badge>
                        {property.listing_type && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {property.listing_type}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(property.created_at), "d MMM", {
                            locale: nl,
                          })}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleView(property)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Bekijken
                        </Button>
                        {activeTab === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleView(property)}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Review
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>Geen woningen gevonden in deze categorie.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review/Detail Dialog */}
      <Dialog
        open={!!viewingProperty}
        onOpenChange={() => setViewingProperty(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Woning Reviewen</DialogTitle>
            <DialogDescription>
              Controleer en pas de gegevens aan voordat je goedkeurt
            </DialogDescription>
          </DialogHeader>

          {viewingProperty && (
            <div className="space-y-6">
              {/* Source info */}
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{viewingProperty.source_site}</Badge>
                <a
                  href={viewingProperty.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Bron bekijken
                </a>
              </div>

              {/* Images */}
              {viewingProperty.images && viewingProperty.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {viewingProperty.images.slice(0, 6).map((img: string, i: number) => (
                    <div key={i} className="aspect-video overflow-hidden rounded-md bg-muted">
                      <img
                        src={img}
                        alt={`Foto ${i + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Editable form */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Titel</Label>
                  <Input
                    value={editForm.title || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Beschrijving</Label>
                  <Textarea
                    rows={4}
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Prijs</Label>
                    <Input
                      type="number"
                      value={editForm.price || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Type aanbod</Label>
                    <Select
                      value={editForm.listing_type || "huur"}
                      onValueChange={(v) =>
                        setEditForm({ ...editForm, listing_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="huur">Te huur</SelectItem>
                        <SelectItem value="koop">Te koop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Woningtype</Label>
                    <Select
                      value={editForm.property_type || "appartement"}
                      onValueChange={(v) =>
                        setEditForm({ ...editForm, property_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appartement">Appartement</SelectItem>
                        <SelectItem value="huis">Huis</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="kamer">Kamer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Oppervlakte (m²)</Label>
                    <Input
                      type="number"
                      value={editForm.surface_area || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, surface_area: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Stad</Label>
                    <Input
                      value={editForm.city || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Straat</Label>
                    <Input
                      value={editForm.street || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, street: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Huisnummer</Label>
                    <Input
                      value={editForm.house_number || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, house_number: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Postcode</Label>
                    <Input
                      value={editForm.postal_code || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, postal_code: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Slaapkamers</Label>
                    <Input
                      type="number"
                      value={editForm.bedrooms || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bedrooms: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Badkamers</Label>
                    <Input
                      type="number"
                      value={editForm.bathrooms || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bathrooms: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {viewingProperty?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setRejectingId(viewingProperty.id)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Afwijzen
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={approveProperty.isPending}
                >
                  {approveProperty.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Goedkeuren & Publiceren
                </Button>
              </>
            )}
            {viewingProperty?.status !== "pending" && (
              <Button variant="outline" onClick={() => setViewingProperty(null)}>
                Sluiten
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation */}
      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Woning afwijzen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze woning wilt afwijzen?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectingId && handleReject(rejectingId)}
              disabled={updateScrapedProperty.isPending}
            >
              {updateScrapedProperty.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Afwijzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReviewQueue;
