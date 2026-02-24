import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateProperty } from "@/hooks/useProperties";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

const CreateProperty = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createProperty = useCreateProperty();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("appartement");
  const [listingType, setListingType] = useState<ListingType>("huur");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");

  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/inloggen");
    }
  }, [authLoading, user, navigate]);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxFiles = 10;
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      toast({
        variant: "destructive",
        title: "Te veel foto's",
        description: `Je kunt maximaal ${maxFiles} foto's uploaden.`,
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast({ variant: "destructive", title: "Ongeldig bestand", description: `${file.name} is geen afbeelding.` });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Te groot", description: `${file.name} is groter dan 5MB.` });
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (propertyId: string): Promise<string[]> => {
    const urls: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const ext = file.name.split(".").pop();
      const filePath = `${propertyId}/${i}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("property-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(filePath);

      urls.push(urlData.publicUrl);
    }

    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast({ variant: "destructive", title: "Ongeldige prijs", description: "Vul een geldige prijs in (groter dan 0)." });
      return;
    }

    setIsUploading(true);

    try {
      // Create property first (without images)
      const property = await createProperty.mutateAsync({
        user_id: user.id,
        title,
        description: description || null,
        price: numericPrice,
        city,
        street,
        house_number: houseNumber,
        postal_code: postalCode,
        property_type: propertyType,
        listing_type: listingType,
        surface_area: surfaceArea ? Number(surfaceArea) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
      });

      // Upload images if any
      if (selectedFiles.length > 0) {
        const imageUrls = await uploadImages(property.id);

        if (imageUrls.length > 0) {
          await supabase
            .from("properties")
            .update({ images: imageUrls })
            .eq("id", property.id);
        }
      }

      // Send admin notification (fire-and-forget)
      supabase.functions.invoke("send-email", {
        body: {
          to: "info@woonpeek.nl",
          subject: `Nieuwe woning geplaatst: ${title}`,
          html: `<h2>Nieuwe woning geplaatst</h2>
            <p><strong>Titel:</strong> ${title}</p>
            <p><strong>Adres:</strong> ${street} ${houseNumber}, ${postalCode} ${city}</p>
            <p><strong>Type:</strong> ${propertyType} (${listingType})</p>
            <p><strong>Prijs:</strong> €${numericPrice.toLocaleString("nl-NL")}</p>
            <p><strong>Geplaatst door:</strong> ${user.email}</p>`,
        },
      }).catch(() => {});

      toast({ title: "Woning geplaatst", description: "Je woning is succesvol opgeslagen." });
      navigate("/mijn-woningen");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Onbekende fout";
      toast({ variant: "destructive", title: "Plaatsen mislukt", description: message });
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = createProperty.isPending || isUploading;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container py-10">
          <div className="mx-auto w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">Woning plaatsen</CardTitle>
                <CardDescription>
                  Voeg een woning toe aan het platform. Voeg foto's toe om meer interesse te wekken.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Bijv. Ruim appartement in centrum"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Beschrijving (optioneel)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Korte omschrijving, kenmerken, etc."
                      rows={5}
                    />
                  </div>

                  {/* Listing type & Property type */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="listingType">Aanbieding</Label>
                      <Select value={listingType} onValueChange={(v) => setListingType(v as ListingType)}>
                        <SelectTrigger id="listingType">
                          <SelectValue placeholder="Kies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="huur">Huur</SelectItem>
                          <SelectItem value="koop">Koop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Woningtype</Label>
                      <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
                        <SelectTrigger id="propertyType">
                          <SelectValue placeholder="Kies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appartement">Appartement</SelectItem>
                          <SelectItem value="huis">Huis</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="kamer">Kamer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Prijs</Label>
                    <Input
                      id="price"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={listingType === "huur" ? "Bijv. 1250" : "Bijv. 325000"}
                      required
                    />
                  </div>

                  {/* Surface, bedrooms, bathrooms */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="surfaceArea">Oppervlakte (m²)</Label>
                      <Input
                        id="surfaceArea"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={surfaceArea}
                        onChange={(e) => setSurfaceArea(e.target.value)}
                        placeholder="85"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Slaapkamers</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        placeholder="2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Badkamers</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">Stad</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Amsterdam" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postcode</Label>
                      <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="1011AA" required />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="street">Straat</Label>
                      <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Voorbeeldstraat" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="houseNumber">Huisnummer</Label>
                      <Input id="houseNumber" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} placeholder="12" required />
                    </div>
                  </div>

                  {/* Photo upload */}
                  <div className="space-y-3">
                    <Label>Foto's (max. 10)</Label>
                    <div
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 transition-colors hover:border-primary/50 hover:bg-muted"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Klik om foto's te selecteren
                      </p>
                      <p className="text-xs text-muted-foreground/70">JPG, PNG, WebP — max 5MB per foto</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />

                    {previewUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                            <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? "Foto's uploaden…" : "Plaatsen"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CreateProperty;
