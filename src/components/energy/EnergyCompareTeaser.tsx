import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DaisyconEnergyWidget from "./DaisyconEnergyWidget";

interface EnergyCompareTeaserProps {
  /** Optional context, e.g. city or address, used in copy. */
  context?: string;
  /** Variant changes the headline copy. */
  variant?: "city" | "property";
}

/**
 * Compact, conversion-focused energy comparison block for embedding on
 * city pages and property detail pages. The widget loads lazily after the
 * user expands it, keeping initial page load fast.
 */
const EnergyCompareTeaser = ({ context, variant = "city" }: EnergyCompareTeaserProps) => {
  const [open, setOpen] = useState(false);

  const headline =
    variant === "property"
      ? "Bespaar op energie in deze woning"
      : context
      ? `Energie vergelijken in ${context}`
      : "Bespaar op je energierekening";

  const sub =
    variant === "property"
      ? "Verhuis je naar deze woning? Regel meteen het scherpste energietarief en bespaar tot € 600 per jaar."
      : "Vergelijk gas en stroom van alle leveranciers en stap gratis over.";

  return (
    <Card className="overflow-hidden border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold md:text-lg">{headline}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen((o) => !o)}
              className="gap-1.5"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              />
              {open ? "Verberg" : "Vergelijk hier"}
            </Button>
            <Button asChild size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/energie-vergelijken">
                Naar vergelijker
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {open && (
          <div className="mt-5 border-t pt-5">
            <DaisyconEnergyWidget />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Vergelijking via Daisycon
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnergyCompareTeaser;