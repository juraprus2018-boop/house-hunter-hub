import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchAlerts, useCreateSearchAlert, useToggleSearchAlert, useDeleteSearchAlert } from "@/hooks/useSearchAlerts";
import { Bell, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SearchAlerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: alerts, isLoading } = useSearchAlerts();
  const createAlert = useCreateSearchAlert();
  const toggleAlert = useToggleSearchAlert();
  const deleteAlert = useDeleteSearchAlert();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    city: "",
    property_type: "" as string,
    listing_type: "" as string,
    min_price: "",
    max_price: "",
  });

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">Inloggen vereist</h1>
          <p className="mt-2 text-muted-foreground">Log in om zoekalerts in te stellen.</p>
          <Button className="mt-4" onClick={() => navigate("/inloggen")}>Inloggen</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Vul een naam in", variant: "destructive" });
      return;
    }
    try {
      await createAlert.mutateAsync({
        user_id: user.id,
        name: form.name.trim(),
        city: form.city || null,
        property_type: (form.property_type as any) || null,
        listing_type: (form.listing_type as any) || null,
        min_price: form.min_price ? Number(form.min_price) : null,
        max_price: form.max_price ? Number(form.max_price) : null,
      });
      toast({ title: "Zoekalert aangemaakt!" });
      setDialogOpen(false);
      setForm({ name: "", city: "", property_type: "", listing_type: "", min_price: "", max_price: "" });
    } catch {
      toast({ title: "Er ging iets mis", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">Zoekalerts</h1>
                <p className="text-sm text-muted-foreground">Ontvang een e-mail als er nieuwe woningen zijn die aan jouw criteria voldoen.</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Nieuwe alert</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nieuwe zoekalert</DialogTitle>
                    <DialogDescription>Stel je criteria in en ontvang een melding bij nieuwe woningen.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Naam *</Label>
                      <Input placeholder="Bijv. Appartementen Amsterdam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stad</Label>
                      <Input placeholder="Bijv. Amsterdam" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type woning</Label>
                        <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                          <SelectTrigger><SelectValue placeholder="Alle" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appartement">Appartement</SelectItem>
                            <SelectItem value="huis">Huis</SelectItem>
                            <SelectItem value="studio">Studio</SelectItem>
                            <SelectItem value="kamer">Kamer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Aanbod</Label>
                        <Select value={form.listing_type} onValueChange={(v) => setForm({ ...form, listing_type: v })}>
                          <SelectTrigger><SelectValue placeholder="Alle" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="huur">Te huur</SelectItem>
                            <SelectItem value="koop">Te koop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min. prijs (€)</Label>
                        <Input type="number" placeholder="0" value={form.min_price} onChange={(e) => setForm({ ...form, min_price: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Max. prijs (€)</Label>
                        <Input type="number" placeholder="Geen max" value={form.max_price} onChange={(e) => setForm({ ...form, max_price: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={handleCreate} className="w-full" disabled={createAlert.isPending}>
                      {createAlert.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Alert aanmaken
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="font-semibold">{alert.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {alert.city && <Badge variant="secondary">{alert.city}</Badge>}
                          {alert.property_type && <Badge variant="outline" className="capitalize">{alert.property_type}</Badge>}
                          {alert.listing_type && <Badge variant="outline" className="capitalize">{alert.listing_type}</Badge>}
                          {alert.max_price && <Badge variant="outline">Max €{Number(alert.max_price).toLocaleString("nl-NL")}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={alert.is_active}
                          onCheckedChange={(checked) => toggleAlert.mutate({ id: alert.id, is_active: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAlert.mutate(alert.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="font-semibold">Nog geen zoekalerts</p>
                  <p className="text-sm text-muted-foreground">Maak een alert aan om op de hoogte te blijven.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchAlerts;
