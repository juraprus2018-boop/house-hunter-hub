import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type PropertyType = Database["public"]["Enums"]["property_type"];
type ListingType = Database["public"]["Enums"]["listing_type"];

const CreateProperty = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createProperty = useCreateProperty();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("appartement");
  const [listingType, setListingType] = useState<ListingType>("huur");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/inloggen");
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast({
        variant: "destructive",
        title: "Ongeldige prijs",
        description: "Vul een geldige prijs in (groter dan 0).",
      });
      return;
    }

    try {
      await createProperty.mutateAsync({
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
      });

      toast({
        title: "Woning geplaatst",
        description: "Je woning is opgeslagen.",
      });
      navigate("/mijn-woningen");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Onbekende fout";
      toast({
        variant: "destructive",
        title: "Plaatsen mislukt",
        description: message,
      });
    }
  };

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
                  Voeg een woning toe aan het platform. Je kunt later altijd details aanpassen.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">Stad</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Amsterdam"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postcode</Label>
                      <Input
                        id="postalCode"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="1011AA"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="street">Straat</Label>
                      <Input
                        id="street"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Voorbeeldstraat"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="houseNumber">Huisnummer</Label>
                      <Input
                        id="houseNumber"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        placeholder="12"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={createProperty.isPending}
                  >
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={createProperty.isPending}>
                    {createProperty.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Plaatsen
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
