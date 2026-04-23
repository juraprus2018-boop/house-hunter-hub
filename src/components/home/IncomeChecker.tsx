import { useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cityToSlug } from "@/lib/cities";

const POPULAR_CITIES = [
  "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven",
  "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
  "Haarlem", "Leiden", "Maastricht", "Delft", "Zwolle",
];

const SUGGESTED_INCOMES = [2500, 3000, 3500, 4000, 4500, 5000];

const IncomeChecker = () => {
  const [income, setIncome] = useState<string>("");
  const [city, setCity] = useState<string>("amsterdam");

  const incomeNum = Number(income);
  const maxRent = incomeNum > 0 ? Math.floor(incomeNum / 3) : 0;
  const isValid = incomeNum >= 1500 && city;

  // Snap to nearest valid income bracket for SEO landing page
  const nearestBracket = isValid
    ? SUGGESTED_INCOMES.reduce((prev, curr) =>
        Math.abs(curr - incomeNum) < Math.abs(prev - incomeNum) ? curr : prev
      )
    : null;

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-amber-soft/60 via-background to-terracotta-soft/40">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 md:p-8 shadow-md">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber/20">
              <Wallet className="h-6 w-6 text-amber" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">
                Welke huur past bij jouw inkomen?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Verhuurders eisen meestal een bruto maandinkomen van 3x de huur. Bereken direct wat je kunt huren.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Bruto maandinkomen
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="3500"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Stad
              </label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_CITIES.map((c) => (
                    <SelectItem key={c} value={cityToSlug(c)}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                asChild={isValid && nearestBracket !== null}
                disabled={!isValid}
                className="w-full md:w-auto"
              >
                {isValid && nearestBracket !== null ? (
                  <Link to={`/huur-bij-inkomen-${nearestBracket}-${city}`}>
                    Bekijk woningen <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <span>Vul in</span>
                )}
              </Button>
            </div>
          </div>

          {maxRent > 0 && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <p>
                Met <strong>€{incomeNum.toLocaleString("nl-NL")}</strong> bruto p/m kun je huurwoningen tot{" "}
                <strong className="text-primary">€{maxRent.toLocaleString("nl-NL")}/mnd</strong> bekijken
                {nearestBracket && nearestBracket !== incomeNum && (
                  <span className="text-muted-foreground"> (tonen op €{nearestBracket.toLocaleString("nl-NL")} bracket)</span>
                )}
                .
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Populair:</span>
            {SUGGESTED_INCOMES.map((i) => (
              <Link
                key={i}
                to={`/huur-bij-inkomen-${i}-${city}`}
                className="rounded-full border bg-background px-3 py-1 text-xs hover:border-primary hover:text-primary transition-colors"
              >
                €{i.toLocaleString("nl-NL")} bruto
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IncomeChecker;
