import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Briefcase, Car, Bike, X, Loader2, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface CommuteValue {
  address: string;
  lat: number;
  lng: number;
  maxMinutes: number;
  mode: "driving" | "cycling";
}

interface CommuteFilterProps {
  value: CommuteValue | null;
  onChange: (value: CommuteValue | null) => void;
}

const CommuteFilter = ({ value, onChange }: CommuteFilterProps) => {
  const [address, setAddress] = useState(value?.address || "");
  const [maxMinutes, setMaxMinutes] = useState(value?.maxMinutes || 30);
  const [mode, setMode] = useState<"driving" | "cycling">(value?.mode || "driving");
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (!address.trim()) {
      toast({ title: "Vul een werkadres in", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=nl&limit=1&q=${encodeURIComponent(address)}`;
      const resp = await fetch(url, {
        headers: { "Accept-Language": "nl" },
      });
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        toast({ title: "Adres niet gevonden", description: "Probeer straat + huisnummer + plaats.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      onChange({ address, lat, lng, maxMinutes, mode });
      toast({
        title: "Werkadres ingesteld",
        description: `Toont woningen binnen ${maxMinutes} min ${mode === "driving" ? "auto" : "fiets"}.`,
      });
    } catch {
      toast({ title: "Geocoderen mislukt", description: "Probeer het later opnieuw.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setAddress("");
    onChange(null);
  };

  return (
    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <Label className="flex items-center gap-1.5 text-sm">
        <Briefcase className="h-4 w-4 text-primary" />
        Reistijd naar werk
      </Label>

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Bv. Damrak 1, Amsterdam"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Max. reistijd: {maxMinutes} min</Label>
        <Slider
          value={[maxMinutes]}
          onValueChange={([v]) => setMaxMinutes(v)}
          min={10}
          max={90}
          step={5}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "driving" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setMode("driving")}
        >
          <Car className="mr-1.5 h-3.5 w-3.5" />
          Auto
        </Button>
        <Button
          type="button"
          variant={mode === "cycling" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setMode("cycling")}
        >
          <Bike className="mr-1.5 h-3.5 w-3.5" />
          Fiets
        </Button>
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" className="flex-1" onClick={apply} disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Toepassen
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={clear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {value && (
        <p className="text-xs text-muted-foreground">
          Actief: <strong>{value.address}</strong>
        </p>
      )}

      <p className="text-[10px] text-muted-foreground">
        Powered by OpenStreetMap & OSRM (gratis).
      </p>
    </div>
  );
};

export default CommuteFilter;
