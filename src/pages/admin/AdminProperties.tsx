import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useAllProperties, useUpdatePropertyAdmin, useDeletePropertyAdmin } from "@/hooks/useAdmin";
import { Search, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const AdminProperties = () => {
  const { data: properties, isLoading } = useAllProperties();
  const updateProperty = useUpdatePropertyAdmin();
  const deleteProperty = useDeletePropertyAdmin();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingProperty, setEditingProperty] = useState<typeof properties extends (infer T)[] ? T : never | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const filteredProperties = properties?.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.street.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number, listingType: string) => {
    const formatted = new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(price);
    return listingType === "huur" ? `${formatted}/mnd` : formatted;
  };

  const handleEdit = (property: NonNullable<typeof properties>[number]) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description || "",
      price: property.price,
      city: property.city,
      street: property.street,
      house_number: property.house_number,
      postal_code: property.postal_code,
      property_type: property.property_type,
      listing_type: property.listing_type,
      status: property.status,
      bedrooms: property.bedrooms || "",
      bathrooms: property.bathrooms || "",
      surface_area: property.surface_area || "",
      energy_label: property.energy_label || "",
      build_year: property.build_year || "",
    });
  };

  const handleSave = async () => {
    if (!editingProperty) return;

    try {
      await updateProperty.mutateAsync({
        id: editingProperty.id,
        ...formData,
        price: Number(formData.price),
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        surface_area: formData.surface_area ? Number(formData.surface_area) : null,
        build_year: formData.build_year ? Number(formData.build_year) : null,
      });
      toast({
        title: "Woning bijgewerkt",
        description: "De wijzigingen zijn opgeslagen.",
      });
      setEditingProperty(null);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon de woning niet bijwerken.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProperty.mutateAsync(id);
      toast({
        title: "Woning verwijderd",
        description: "De woning is verwijderd.",
      });
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon de woning niet verwijderen.",
        variant: "destructive",
      });
    }
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Woningen</h1>
            <p className="mt-1 text-muted-foreground">
              Beheer alle woningen op het platform
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Zoek op titel, stad of straat..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredProperties?.length || 0} woningen gevonden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Locatie</TableHead>
                  <TableHead>Prijs</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Toegevoegd</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties?.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {property.title}
                    </TableCell>
                    <TableCell>
                      {property.city}
                    </TableCell>
                    <TableCell>
                      {formatPrice(Number(property.price), property.listing_type)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {property.property_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          property.status === "actief"
                            ? "default"
                            : property.status === "verkocht" || property.status === "verhuurd"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(property.created_at), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/woning/${property.id}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(property)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteConfirm(property.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredProperties || filteredProperties.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Geen woningen gevonden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={() => setEditingProperty(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Woning bewerken</DialogTitle>
            <DialogDescription>
              Pas de gegevens van de woning aan
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={formData.title as string || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description as string || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Prijs</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price as number || ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status as string || ""}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actief">Actief</SelectItem>
                    <SelectItem value="inactief">Inactief</SelectItem>
                    <SelectItem value="verkocht">Verkocht</SelectItem>
                    <SelectItem value="verhuurd">Verhuurd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="property_type">Woningtype</Label>
                <Select
                  value={formData.property_type as string || ""}
                  onValueChange={(value) => setFormData({ ...formData, property_type: value })}
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
                <Label htmlFor="listing_type">Aanbieding</Label>
                <Select
                  value={formData.listing_type as string || ""}
                  onValueChange={(value) => setFormData({ ...formData, listing_type: value })}
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
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">Stad</Label>
                <Input
                  id="city"
                  value={formData.city as string || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="street">Straat</Label>
                <Input
                  id="street"
                  value={formData.street as string || ""}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="house_number">Huisnummer</Label>
                <Input
                  id="house_number"
                  value={formData.house_number as string || ""}
                  onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bedrooms">Slaapkamers</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms as number || ""}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bathrooms">Badkamers</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms as number || ""}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="surface_area">Oppervlakte (m²)</Label>
                <Input
                  id="surface_area"
                  type="number"
                  value={formData.surface_area as number || ""}
                  onChange={(e) => setFormData({ ...formData, surface_area: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="build_year">Bouwjaar</Label>
                <Input
                  id="build_year"
                  type="number"
                  value={formData.build_year as number || ""}
                  onChange={(e) => setFormData({ ...formData, build_year: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProperty(null)}>
              Annuleren
            </Button>
            <Button onClick={handleSave} disabled={updateProperty.isPending}>
              {updateProperty.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Woning verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze woning wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteProperty.isPending}
            >
              {deleteProperty.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProperties;
