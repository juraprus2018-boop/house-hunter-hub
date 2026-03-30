import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Euro, Percent, Calendar } from "lucide-react";

interface MortgageCalculatorProps {
  propertyPrice: number;
}

const MortgageCalculator = ({ propertyPrice }: MortgageCalculatorProps) => {
  const [loanPercentage, setLoanPercentage] = useState(100);
  const [interestRate, setInterestRate] = useState(4.2);
  const [years, setYears] = useState(30);

  const loanAmount = (propertyPrice * loanPercentage) / 100;

  const monthlyPayment = useMemo(() => {
    const r = interestRate / 100 / 12;
    const n = years * 12;
    if (r === 0) return loanAmount / n;
    return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [loanAmount, interestRate, years]);

  const totalCost = monthlyPayment * years * 12;
  const totalInterest = totalCost - loanAmount;

  const formatEuro = (val: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(val);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Hypotheek berekenen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Payment Highlight */}
        <div className="rounded-xl bg-primary/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">Geschatte maandlasten</p>
          <p className="font-display text-3xl font-bold text-primary">{formatEuro(monthlyPayment)}</p>
          <p className="text-xs text-muted-foreground">per maand (annuitair)</p>
        </div>

        {/* Sliders */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Euro className="h-4 w-4 text-muted-foreground" />
                Hypotheekbedrag
              </label>
              <span className="text-sm font-semibold text-foreground">{formatEuro(loanAmount)}</span>
            </div>
            <Slider
              value={[loanPercentage]}
              onValueChange={([v]) => setLoanPercentage(v)}
              min={50}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>50%</span>
              <span>{loanPercentage}%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Percent className="h-4 w-4 text-muted-foreground" />
                Rente
              </label>
              <span className="text-sm font-semibold text-foreground">{interestRate.toFixed(1)}%</span>
            </div>
            <Slider
              value={[interestRate * 10]}
              onValueChange={([v]) => setInterestRate(v / 10)}
              min={10}
              max={80}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1%</span>
              <span>8%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Looptijd
              </label>
              <span className="text-sm font-semibold text-foreground">{years} jaar</span>
            </div>
            <Slider
              value={[years]}
              onValueChange={([v]) => setYears(v)}
              min={10}
              max={30}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10 jr</span>
              <span>30 jr</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-2 rounded-xl border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Woningprijs</span>
            <span className="font-medium text-foreground">{formatEuro(propertyPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Eigen inleg</span>
            <span className="font-medium text-foreground">{formatEuro(propertyPrice - loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Totale rente</span>
            <span className="font-medium text-foreground">{formatEuro(totalInterest)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-medium text-foreground">Totaal terugbetalen</span>
            <span className="font-bold text-foreground">{formatEuro(totalCost)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Dit is een indicatieve berekening. Neem contact op met een hypotheekadviseur voor een persoonlijk advies.
        </p>
      </CardContent>
    </Card>
  );
};

export default MortgageCalculator;
