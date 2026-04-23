import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PiggyBank, ShoppingCart, Zap, Bus, Sparkles, Wallet, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NibudBudgetBreakdownProps {
  monthlyHousingCost: number;
  listingType: "huur" | "koop";
  city?: string;
}

const formatEuro = (val: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(val)));

// Indicatieve netto-belasting (vereenvoudigd box 1, 2025)
const grossToNet = (gross: number) => {
  // Globale benadering: ~30% inhouding boven 1500, ~22% daaronder
  if (gross <= 1500) return gross * 0.85;
  if (gross <= 3500) return 1500 * 0.85 + (gross - 1500) * 0.7;
  if (gross <= 6000) return 1500 * 0.85 + 2000 * 0.7 + (gross - 3500) * 0.6;
  return 1500 * 0.85 + 2000 * 0.7 + 2500 * 0.6 + (gross - 6000) * 0.5;
};

// NIBUD-richtlijnen 2025 (alleenstaande, indicatief)
const nibudCategories = (household: "single" | "couple" | "family") => {
  const base = {
    groceries: { single: 290, couple: 470, family: 720 },
    energy: { single: 145, couple: 195, family: 245 },
    transport: { single: 180, couple: 320, family: 420 },
    insurance: { single: 165, couple: 280, family: 340 },
    leisure: { single: 175, couple: 290, family: 380 },
    other: { single: 130, couple: 220, family: 320 },
  };
  return {
    groceries: base.groceries[household],
    energy: base.energy[household],
    transport: base.transport[household],
    insurance: base.insurance[household],
    leisure: base.leisure[household],
    other: base.other[household],
  };
};

const NibudBudgetBreakdown = ({
  monthlyHousingCost,
  listingType,
  city,
}: NibudBudgetBreakdownProps) => {
  const [grossIncome, setGrossIncome] = useState(3500);
  const [household, setHousehold] = useState<"single" | "couple" | "family">("single");

  const data = useMemo(() => {
    const net = grossToNet(grossIncome);
    const cats = nibudCategories(household);
    const fixed =
      cats.groceries +
      cats.energy +
      cats.transport +
      cats.insurance +
      cats.leisure +
      cats.other;
    const afterHousing = net - monthlyHousingCost;
    const remaining = afterHousing - fixed;
    const housingRatio = monthlyHousingCost / net;

    let verdict: { label: string; tone: "good" | "warn" | "bad"; text: string };
    if (housingRatio < 0.3 && remaining > 200) {
      verdict = {
        label: "Comfortabel",
        tone: "good",
        text: "Je houdt ruim geld over voor sparen en onverwachte uitgaven.",
      };
    } else if (housingRatio < 0.4 && remaining > 0) {
      verdict = {
        label: "Krap aan",
        tone: "warn",
        text: "Je komt rond, maar er blijft weinig over voor sparen of luxe.",
      };
    } else {
      verdict = {
        label: "Risicovol",
        tone: "bad",
        text: "De woonlasten zijn hoog ten opzichte van je netto inkomen volgens NIBUD-richtlijnen.",
      };
    }

    return { net, cats, fixed, afterHousing, remaining, housingRatio, verdict };
  }, [grossIncome, household, monthlyHousingCost]);

  const handleShare = async () => {
    const text = `Met €${grossIncome} bruto per maand houd ik na huisvesting (${formatEuro(
      monthlyHousingCost
    )}) en vaste lasten ${formatEuro(data.remaining)} over volgens de NIBUD-richtlijn.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mijn woonbudget", text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        toast({ title: "Link gekopieerd", description: "Deel je budget met je partner." });
      }
    } catch {
      // user cancelled
    }
  };

  const toneClass =
    data.verdict.tone === "good"
      ? "bg-green-500/10 text-green-700 border-green-500/30"
      : data.verdict.tone === "warn"
      ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
      : "bg-destructive/10 text-destructive border-destructive/30";

  const householdLabel =
    household === "single" ? "Alleenstaand" : household === "couple" ? "Samenwonend" : "Gezin";

  const rows = [
    { icon: ShoppingCart, label: "Boodschappen & eten", value: data.cats.groceries },
    { icon: Zap, label: "Energie & water", value: data.cats.energy },
    { icon: Bus, label: "Vervoer", value: data.cats.transport },
    { icon: Sparkles, label: "Verzekeringen & abonnementen", value: data.cats.insurance },
    { icon: PiggyBank, label: "Vrije tijd & uitgaan", value: data.cats.leisure },
    { icon: Wallet, label: "Kleding & overig", value: data.cats.other },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PiggyBank className="h-5 w-5 text-primary" />
            Woon-budget calculator
          </CardTitle>
          <Badge variant="outline" className="text-xs">NIBUD richtlijn</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Wat houd je over na deze {listingType === "huur" ? "huur" : "hypotheeklast"}
          {city ? ` in ${city}` : ""}?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verdict */}
        <div className={`rounded-xl border p-4 ${toneClass}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">{data.verdict.label}</p>
            <p className="text-xs opacity-80">
              Woonquote {(data.housingRatio * 100).toFixed(0)}% van netto
            </p>
          </div>
          <p className="text-xs mt-1 opacity-90">{data.verdict.text}</p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Bruto maandinkomen</label>
              <span className="text-sm font-semibold">{formatEuro(grossIncome)}</span>
            </div>
            <Slider
              value={[grossIncome]}
              onValueChange={([v]) => setGrossIncome(v)}
              min={1500}
              max={10000}
              step={100}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Huishouden</p>
            <div className="grid grid-cols-3 gap-2">
              {(["single", "couple", "family"] as const).map((h) => (
                <Button
                  key={h}
                  type="button"
                  variant={household === h ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHousehold(h)}
                  className="text-xs"
                >
                  {h === "single" ? "Alleen" : h === "couple" ? "Samen" : "Gezin"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="rounded-xl border divide-y">
          <div className="flex items-center justify-between p-3 bg-muted/40">
            <span className="text-sm font-medium">Netto inkomen ({householdLabel})</span>
            <span className="text-sm font-semibold">{formatEuro(data.net)}</span>
          </div>
          <div className="flex items-center justify-between p-3 text-destructive">
            <span className="text-sm">Woonlasten</span>
            <span className="text-sm font-semibold">- {formatEuro(monthlyHousingCost)}</span>
          </div>
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between p-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <r.icon className="h-4 w-4" />
                {r.label}
              </span>
              <span className="text-sm">- {formatEuro(r.value)}</span>
            </div>
          ))}
          <div
            className={`flex items-center justify-between p-3 font-semibold ${
              data.remaining < 0 ? "text-destructive bg-destructive/5" : "bg-primary/5 text-primary"
            }`}
          >
            <span>Over voor sparen & extra's</span>
            <span>{formatEuro(data.remaining)}</span>
          </div>
        </div>

        <Button onClick={handleShare} variant="outline" size="sm" className="w-full">
          <Share2 className="mr-2 h-4 w-4" />
          Deel mijn budget
        </Button>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Indicatie op basis van NIBUD-richtlijnen 2025. Werkelijke uitgaven verschillen per
          situatie. Geen financieel advies.
        </p>
      </CardContent>
    </Card>
  );
};

export default NibudBudgetBreakdown;