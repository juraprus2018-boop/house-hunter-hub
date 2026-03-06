import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateProperty } from "@/hooks/useProperties";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Loader2, X, ImagePlus, Check, ArrowRight, ArrowLeft, Home, MapPin, Camera, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

const STEPS = [
  { label: "Basis", icon: Home },
  { label: "Adres & details", icon: MapPin },
  { label: "Foto's", icon: Camera },
  { label: "Overzicht", icon: Eye },
];

const CreateProperty = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createProperty = useCreateProperty();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);

  // Step 1 – Basis
  const [listingType, setListingType] = useState<ListingType>("huur");
  const [propertyType, setPropertyType] = useState<PropertyType>("appartement");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 – Adres & details
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [price, setPrice] = useState("");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");

  // Step 3 – Foto's
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/woning-plaatsen");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    return () => { previewUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [previewUrls]);

  /* ── validation per step ── */
  const canProceed = (s: number) => {
    if (s === 0) return title.trim().length > 0;
    if (s === 1) return city.trim().length > 0 && street.trim().length > 0 && houseNumber.trim().length > 0 && postalCode.trim().length > 0 && Number(price) > 0;
    return true;
  };

  /* ── file handling ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (selectedFiles.length + files.length > 10) {
      toast({ variant: "destructive", title: "Te veel foto's", description: "Je kunt maximaal 10 foto's uploaden." });
      return;
    }
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) { toast({ variant: "destructive", title: "Ongeldig bestand", description: `${f.name} is geen afbeelding.` }); return false; }
      if (f.size > 5 * 1024 * 1024) { toast({ variant: "destructive", title: "Te groot", description: `${f.name} is groter dan 5MB.` }); return false; }
      return true;
    });
    setSelectedFiles((p) => [...p, ...valid]);
    setPreviewUrls((p) => [...p, ...valid.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(previewUrls[i]);
    setSelectedFiles((p) => p.filter((_, j) => j !== i));
    setPreviewUrls((p) => p.filter((_, j) => j !== i));
  };

  const uploadImages = async (propertyId: string) => {
    const urls: string[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const ext = file.name.split(".").pop();
      const filePath = `${propertyId}/${i}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (error) { console.error("Upload error:", error); continue; }
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(filePath);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!user) return;
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast({ variant: "destructive", title: "Ongeldige prijs", description: "Vul een geldige prijs in." });
      setStep(1);
      return;
    }
    setIsUploading(true);
    try {
      const property = await createProperty.mutateAsync({
        user_id: user.id, title, description: description || null, price: numericPrice,
        city, street, house_number: houseNumber, postal_code: postalCode,
        property_type: propertyType, listing_type: listingType,
        surface_area: surfaceArea ? Number(surfaceArea) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
      });
      if (selectedFiles.length > 0) {
        const imageUrls = await uploadImages(property.id);
        if (imageUrls.length > 0) await supabase.from("properties").update({ images: imageUrls }).eq("id", property.id);
      }
      supabase.functions.invoke("send-email", {
        body: {
          to: "info@woonpeek.nl",
          subject: `Nieuwe woning geplaatst: ${title}`,
          html: `<h2>Nieuwe woning geplaatst</h2><p><strong>Titel:</strong> ${title}</p><p><strong>Adres:</strong> ${street} ${houseNumber}, ${postalCode} ${city}</p><p><strong>Type:</strong> ${propertyType} (${listingType})</p><p><strong>Prijs:</strong> €${numericPrice.toLocaleString("nl-NL")}</p><p><strong>Geplaatst door:</strong> ${user.email}</p>`,
        },
      }).catch(() => {});
      toast({ title: "Woning geplaatst!", description: "Je woning is succesvol opgeslagen en staat online." });
      navigate("/mijn-woningen");
    } catch (error: unknown) {
      toast({ variant: "destructive", title: "Plaatsen mislukt", description: error instanceof Error ? error.message : "Onbekende fout" });
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = createProperty.isPending || isUploading;

  const propertyTypeLabels: Record<PropertyType, string> = { appartement: "Appartement", huis: "Huis", studio: "Studio", kamer: "Kamer" };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SEOHead title="Woning plaatsen | WoonPeek" description="Plaats gratis je huur- of koopwoning op WoonPeek." canonical="https://woonpeek.nl/plaatsen" />
      <Header />
      <main className="flex-1">
        <div className="container py-8 md:py-12">
          {/* ── Stepper ── */}
          <nav className="mx-auto mb-10 flex max-w-2xl items-center justify-between">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                      done && "border-primary bg-primary text-primary-foreground",
                      active && "border-primary bg-background text-primary",
                      !done && !active && "border-muted-foreground/30 bg-background text-muted-foreground/50"
                    )}>
                      {done ? <Check className="h-5 w-5" /> : i + 1}
                    </div>
                    <span className={cn("text-xs font-medium", active ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("mx-2 h-0.5 flex-1 rounded-full transition-colors", i < step ? "bg-primary" : "bg-muted-foreground/20")} />
                  )}
                </div>
              );
            })}
          </nav>

          {/* ── Form card ── */}
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-10">
              {/* Step 1: Basis */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Je woning plaatsen op WoonPeek</p>
                    <h1 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">Begin met je advertentie</h1>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="listingType">Aanbieding</Label>
                      <Select value={listingType} onValueChange={(v) => setListingType(v as ListingType)}>
                        <SelectTrigger id="listingType"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="huur">Te huur</SelectItem>
                          <SelectItem value="koop">Te koop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Woningtype</Label>
                      <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
                        <SelectTrigger id="propertyType"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appartement">Appartement</SelectItem>
                          <SelectItem value="huis">Huis</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="kamer">Kamer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Titel van je advertentie</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bijv. Ruim appartement in centrum Amsterdam" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Vertel iets over je woning <span className="text-muted-foreground">(optioneel)</span></Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bijv. 'Mijn appartement heeft 2 slaapkamers, een ruime woonkamer en ligt op loopafstand van het station.'" rows={4} />
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h3 className="font-display text-sm font-semibold text-foreground">Voordelen van plaatsen op WoonPeek</h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li>✓ Volledig gratis, geen makelaarskosten</li>
                      <li>✓ Direct zichtbaar voor duizenden woningzoekers</li>
                      <li>✓ Jij hebt volledige controle over je advertentie</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 2: Adres & details */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Stap 2</p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Adres & kenmerken</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Vul het adres en de belangrijkste kenmerken van je woning in.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="street">Straat</Label>
                      <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Voorbeeldstraat" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="houseNumber">Huisnummer</Label>
                      <Input id="houseNumber" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} placeholder="12a" required />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postcode</Label>
                      <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="1011 AA" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Stad</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Amsterdam" required />
                    </div>
                  </div>

                  <hr className="border-border" />

                  <div className="space-y-2">
                    <Label htmlFor="price">Prijs (€{listingType === "huur" ? " per maand" : ""})</Label>
                    <Input id="price" type="number" inputMode="numeric" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={listingType === "huur" ? "Bijv. 1250" : "Bijv. 325000"} required />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="surfaceArea">Oppervlakte (m²)</Label>
                      <Input id="surfaceArea" type="number" inputMode="numeric" min={1} value={surfaceArea} onChange={(e) => setSurfaceArea(e.target.value)} placeholder="85" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Slaapkamers</Label>
                      <Input id="bedrooms" type="number" inputMode="numeric" min={0} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="2" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Badkamers</Label>
                      <Input id="bathrooms" type="number" inputMode="numeric" min={0} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="1" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Foto's */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Stap 3</p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Foto's toevoegen</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Woningen met foto's krijgen tot 10x meer reacties. Upload maximaal 10 foto's.</p>
                  </div>

                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 px-6 py-12 transition-colors hover:border-primary/50 hover:bg-muted"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="font-medium text-foreground">Klik om foto's te selecteren</p>
                    <p className="mt-1 text-sm text-muted-foreground">JPG, PNG, WebP — max 5MB per foto</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />

                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
                          <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeImage(index)} className="absolute right-1.5 top-1.5 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewUrls.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">Je kunt deze stap ook overslaan en later foto's toevoegen.</p>
                  )}
                </div>
              )}

              {/* Step 4: Overzicht */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Stap 4</p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Controleer je advertentie</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Bekijk de gegevens hieronder en klik op "Plaatsen" als alles klopt.</p>
                  </div>

                  <div className="divide-y rounded-xl border bg-muted/30">
                    <SummaryRow label="Titel" value={title} />
                    <SummaryRow label="Type" value={`${propertyTypeLabels[propertyType]} — ${listingType === "huur" ? "Te huur" : "Te koop"}`} />
                    <SummaryRow label="Adres" value={`${street} ${houseNumber}, ${postalCode} ${city}`} />
                    <SummaryRow label="Prijs" value={`€${Number(price).toLocaleString("nl-NL")}${listingType === "huur" ? " /mnd" : ""}`} />
                    {surfaceArea && <SummaryRow label="Oppervlakte" value={`${surfaceArea} m²`} />}
                    {bedrooms && <SummaryRow label="Slaapkamers" value={bedrooms} />}
                    {bathrooms && <SummaryRow label="Badkamers" value={bathrooms} />}
                    <SummaryRow label="Foto's" value={`${selectedFiles.length} foto${selectedFiles.length !== 1 ? "'s" : ""}`} />
                    {description && <SummaryRow label="Beschrijving" value={description} />}
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="aspect-square overflow-hidden rounded-lg border"><img src={url} alt="" className="h-full w-full object-cover" /></div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Navigation buttons ── */}
              <div className="mt-8 flex items-center justify-between gap-3">
                {step > 0 ? (
                  <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} disabled={isSubmitting} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Vorige
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed(step)} className="gap-2">
                    Volgende <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isUploading ? "Foto's uploaden…" : "Woning plaatsen"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start gap-4 px-4 py-3">
    <span className="w-28 shrink-0 text-sm font-medium text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground">{value}</span>
  </div>
);

export default CreateProperty;
