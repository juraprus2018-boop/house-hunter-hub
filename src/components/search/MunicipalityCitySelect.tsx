import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DUTCH_CITIES } from "@/lib/dutchCities";
import {
  MUNICIPALITY_KERNEN,
  getKernen,
  hasMultipleKernen,
} from "@/lib/municipalities";
import { supabase } from "@/integrations/supabase/client";

interface MunicipalityCitySelectProps {
  /** Geselecteerde plaatsnaam (kern of enkelvoudige gemeente). */
  value: string;
  /** Wordt aangeroepen met de definitieve plaatsnaam (kern). */
  onChange: (city: string) => void;
  /** Optioneel ID voor labels (bijv. voor a11y). */
  id?: string;
  /** Extra className voor de wrapper. */
  className?: string;
}

/**
 * Two-step selector: eerst gemeente, dan kern (indien van toepassing).
 *
 * - Gemeentes met meerdere kernen tonen een tweede dropdown.
 * - Enkelvoudige gemeentes (bijv. Amsterdam) selecteren direct de stad.
 * - Backwards compatible: `value` mag een kern zijn; we proberen dan de
 *   bovenliggende gemeente te detecteren.
 */
const MunicipalityCitySelect = ({
  value,
  onChange,
  id,
  className,
}: MunicipalityCitySelectProps) => {
  // Auto-toegevoegde plaatsen uit de DB (extra_cities) worden mee gemerged
  // zodat kernen die de sync-job ontdekt direct beschikbaar zijn.
  const { data: extraCities } = useQuery({
    queryKey: ["extra-cities-visible"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extra_cities")
        .select("name")
        .eq("is_visible", true);
      if (error) throw error;
      return (data ?? []).map((r) => r.name as string);
    },
    staleTime: 5 * 60_000,
  });

  // Lijst van alle gemeentes (zowel composiet als enkelvoudig + extra).
  const municipalities = useMemo(() => {
    const set = new Set<string>(DUTCH_CITIES);
    Object.keys(MUNICIPALITY_KERNEN).forEach((m) => set.add(m));
    (extraCities ?? []).forEach((c) => set.add(c));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "nl"));
  }, [extraCities]);

  // Detecteer huidige gemeente op basis van `value`.
  const detectMunicipality = (city: string): string => {
    if (!city) return "";
    if (MUNICIPALITY_KERNEN[city]) return city; // is zelf een gemeente
    // Zoek gemeente waar deze kern bij hoort
    for (const [muni, kernen] of Object.entries(MUNICIPALITY_KERNEN)) {
      if (kernen.includes(city)) return muni;
    }
    return city; // enkelvoudig: gemeente == kern
  };

  const [municipality, setMunicipality] = useState<string>(() => detectMunicipality(value));

  // Sync wanneer `value` extern verandert (bijv. reset).
  useEffect(() => {
    setMunicipality(detectMunicipality(value));
  }, [value]);

  const showKernen = hasMultipleKernen(municipality);
  const kernen = useMemo(() => (showKernen ? getKernen(municipality) : []), [
    municipality,
    showKernen,
  ]);

  const handleMunicipalityChange = (next: string) => {
    setMunicipality(next);
    if (hasMultipleKernen(next)) {
      // Reset kern-keuze; gebruiker moet expliciet kern kiezen.
      onChange("");
    } else {
      // Enkelvoudige gemeente: direct selecteren.
      onChange(next);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Stap 1: Gemeente */}
        <div>
          <label
            htmlFor={id ? `${id}-muni` : undefined}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            <MapPin className="mr-1 inline-block h-4 w-4" />
            Gemeente
          </label>
          <Select value={municipality} onValueChange={handleMunicipalityChange}>
            <SelectTrigger id={id ? `${id}-muni` : undefined} className="w-full">
              <SelectValue placeholder="Kies een gemeente..." />
            </SelectTrigger>
            <SelectContent>
              {municipalities.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                  {hasMultipleKernen(m) && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({MUNICIPALITY_KERNEN[m].length} kernen)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stap 2: Kern (alleen bij samengestelde gemeentes) */}
        {showKernen && (
          <div>
            <label
              htmlFor={id ? `${id}-kern` : undefined}
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Kern / dorp
            </label>
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger id={id ? `${id}-kern` : undefined} className="w-full">
                <SelectValue placeholder={`Kies een kern in ${municipality}...`} />
              </SelectTrigger>
              <SelectContent>
                {kernen.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Gemeente {municipality} bestaat uit meerdere kernen. Kies de plaats waarvoor je alerts wilt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MunicipalityCitySelect;