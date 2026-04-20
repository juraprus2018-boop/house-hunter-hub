import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Wallet, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface AffordabilityWidgetProps {
  price: number;
  listingType: "huur" | "koop";
}

const formatEuro = (val: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(val);

const AffordabilityWidget = ({ price, listingType }: AffordabilityWidgetProps) => {
  const [grossIncome, setGrossIncome] = useState(3500);

  const result = useMemo(() => {
    if (listingType === "huur") {
      // Standaard verhuurder regel: 3x bruto maandinkomen >= huur
      const ratio = (grossIncome * 3) / price;
      const maxRent = grossIncome / 3;
      let status: "good" | "tight" | "bad" = "bad";
      let label = "Inkomen te laag";
      let color = "bg-destructive/10 text-destructive border-destructive/30";
      let Icon = XCircle;
      if (ratio >= 1.2) {
        status = "good";
        label = "Ruim haalbaar";
        color = "bg-green-500/10 text-green-700 border-green-500/30";
        Icon = CheckCircle2;
      } else if (ratio >= 1) {
        status = "tight";
        label = "Net haalbaar";
        color = "bg-amber-500/10 text-amber-700 border-amber-500/30";
        Icon = AlertTriangle;
      }
      return {
        status,
        label,
        color,
        Icon,
        primaryLabel: "Vereist bruto inkomen",
        primaryValue: formatEuro(price * 3),
        secondaryLabel: "Jouw maximale huur",
        secondaryValue: formatEuro(maxRent),
        explanation:
          "De meeste verhuurders hanteren als regel dat je bruto maandinkomen minstens 3x de kale huurprijs moet zijn.",
      };
    }

    // Koop: indicatieve hypotheek (4.5x bruto jaarsalaris als richtlijn)
    const annualGross = grossIncome * 12;
    const maxMortgage = annualGross * 4.5;
    const ratio = maxMortgage / price;
    let status: "good" | "tight" | "bad" = "bad";
    let label = "Hypotheek te laag";
    let color = "bg-destructive/10 text-destructive border-destructive/30";
    let Icon = XCircle;
    if (ratio >= 1.1) {
      status = "good";
      label = "Ruim haalbaar";
      color = "bg-green-500/10 text-green-700 border-green-500/30";
      Icon = CheckCircle2;
    } else if (ratio >= 0.95) {
      status = "tight";
      label = "Krap haalbaar";
      color = "bg-amber-500/10 text-amber-700 border-amber-500/30";
      Icon = AlertTriangle;
    }
    const shortfall = Math.max(0, price - maxMortgage);
    return {
      status,
      label,
      color,
      Icon,
      primaryLabel: "Indicatieve max. hypotheek",
      primaryValue: formatEuro(maxMortgage),
      secondaryLabel: shortfall > 0 ? "Eigen geld nodig" : "Ruimte over",
      secondaryValue: shortfall > 0 ? formatEuro(shortfall) : formatEuro(maxMortgage - price),
      explanation:
        "Indicatie op basis van 4,5x bruto jaarinkomen. De werkelijke hypotheek hangt af van rente, looptijd en BKR-toetsing.",
    };
  }, [grossIncome, price, listingType]);

  const Icon = result.Icon;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          Kan ik dit betalen?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`flex items-center gap-3 rounded-xl border p-4 ${result.color}`}>
          <Icon className="h-6 w-6 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{result.label}</p>
            <p className="text-xs opacity-80">
              Voor {listingType === "huur" ? "huur van" : "aankoopprijs"} {formatEuro(price)}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Bruto maandinkomen</label>
            <span className="text-sm font-semibold text-foreground">{formatEuro(grossIncome)}</span>
          </div>
          <Slider
            value={[grossIncome]}
            onValueChange={([v]) => setGrossIncome(v)}
            min={1500}
            max={10000}
            step={100}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatEuro(1500)}</span>
            <span>{formatEuro(10000)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">{result.primaryLabel}</p>
            <p className="font-semibold text-foreground">{result.primaryValue}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">{result.secondaryLabel}</p>
            <p className="font-semibold text-foreground">{result.secondaryValue}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">{result.explanation}</p>
      </CardContent>
    </Card>
  );
};

export default AffordabilityWidget;