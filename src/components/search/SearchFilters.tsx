import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MapPin, X } from "lucide-react";
import { type FilterFacets } from "@/hooks/useProperties";

type PropertyType = "appartement" | "huis" | "studio" | "kamer";
type ListingType = "huur" | "koop";

export interface SearchFilterValues {
  city: string;
  propertyType: PropertyType | "";
  listingType: ListingType | "";
  maxPrice: number | undefined;
  minBedrooms: number | undefined;
  minSurface: number | undefined;
  includeInactive: boolean;
}

interface SearchFiltersProps {
  filters: SearchFilterValues;
  onChange: (filters: SearchFilterValues) => void;
  onClear: () => void;
  hideLocation?: boolean;
  facets?: FilterFacets | null;
}

const propertyTypeLabels: Record<string, string> = {
  appartement: "Appartement",
  huis: "Huis",
  studio: "Studio",
  kamer: "Kamer",
};

const listingTypeLabels: Record<string, string> = {
  huur: "Te huur",
  koop: "Te koop",
};

const SearchFilters = ({ filters, onChange, onClear, hideLocation = false, facets }: SearchFiltersProps) => {
  const update = (patch: Partial<SearchFilterValues>) => {
    onChange({ ...filters, ...patch });
  };

  const propertyTypes: PropertyType[] = ["appartement", "huis", "studio", "kamer"];
  const listingTypes: ListingType[] = ["huur", "koop"];
  const bedroomOptions = [1, 2, 3, 4];
  const surfaceOptions = [25, 50, 75, 100];

  return (
    <div className="space-y-6">
      {!hideLocation && (
        <div className="space-y-2">
          <Label>Locatie</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Stad of postcode"
              value={filters.city}
              onChange={(e) => update({ city: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Type woning</Label>
        <Select
          value={filters.propertyType}
          onValueChange={(value: PropertyType | "") => update({ propertyType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Alle types" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypes.map((type) => {
              const count = facets?.propertyTypes[type];
              if (facets && (count === undefined || count === 0)) return null;
              return (
                <SelectItem key={type} value={type}>
                  {propertyTypeLabels[type]}
                  {count !== undefined && (
                    <span className="ml-1 text-muted-foreground">({count.toLocaleString("nl-NL")})</span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Aanbod</Label>
        <Select
          value={filters.listingType}
          onValueChange={(value: ListingType | "") => update({ listingType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Koop & Huur" />
          </SelectTrigger>
          <SelectContent>
            {listingTypes.map((type) => {
              const count = facets?.listingTypes[type];
              if (facets && (count === undefined || count === 0)) return null;
              return (
                <SelectItem key={type} value={type}>
                  {listingTypeLabels[type]}
                  {count !== undefined && (
                    <span className="ml-1 text-muted-foreground">({count.toLocaleString("nl-NL")})</span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Max. prijs: {filters.maxPrice ? `€${filters.maxPrice.toLocaleString("nl-NL")}` : "Geen limiet"}</Label>
        <Slider
          value={[filters.maxPrice || 5000]}
          onValueChange={([value]) => update({ maxPrice: value })}
          max={5000}
          min={200}
          step={50}
        />
      </div>

      <div className="space-y-2">
        <Label>Min. slaapkamers</Label>
        <Select
          value={filters.minBedrooms?.toString() || ""}
          onValueChange={(value) => update({ minBedrooms: value ? Number(value) : undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Geen minimum" />
          </SelectTrigger>
          <SelectContent>
            {bedroomOptions.map((num) => {
              const count = facets?.bedroomCounts[String(num)];
              if (facets && (count === undefined || count === 0)) return null;
              return (
                <SelectItem key={num} value={String(num)}>
                  {num}+
                  {count !== undefined && (
                    <span className="ml-1 text-muted-foreground">({count.toLocaleString("nl-NL")})</span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Min. oppervlakte</Label>
        <Select
          value={filters.minSurface?.toString() || ""}
          onValueChange={(value) => update({ minSurface: value ? Number(value) : undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Geen minimum" />
          </SelectTrigger>
          <SelectContent>
            {surfaceOptions.map((num) => {
              const count = facets?.surfaceRanges[String(num)];
              if (facets && (count === undefined || count === 0)) return null;
              return (
                <SelectItem key={num} value={String(num)}>
                  {num}+ m²
                  {count !== undefined && (
                    <span className="ml-1 text-muted-foreground">({count.toLocaleString("nl-NL")})</span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="include-inactive">Toon inactieve woningen</Label>
        <Switch
          id="include-inactive"
          checked={filters.includeInactive}
          onCheckedChange={(checked) => update({ includeInactive: checked })}
        />
      </div>

      <Button variant="outline" onClick={onClear} className="w-full">
        <X className="mr-2 h-4 w-4" />
        Filters wissen
      </Button>
    </div>
  );
};

export default SearchFilters;
