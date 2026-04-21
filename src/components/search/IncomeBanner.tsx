import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IncomeBannerProps {
  grossIncome?: number;
  listingType?: string;
  onClear: () => void;
}

const IncomeBanner = ({ grossIncome, listingType, onClear }: IncomeBannerProps) => {
  if (!grossIncome || grossIncome <= 0) return null;
  if (listingType === "koop") return null;

  const maxRent = Math.floor(grossIncome / 3);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
      <Wallet className="h-4 w-4 shrink-0 text-primary" />
      <span>
        Met een bruto inkomen van{" "}
        <strong>€{grossIncome.toLocaleString("nl-NL")}</strong> p/m tonen we
        huurwoningen tot{" "}
        <strong className="text-primary">
          €{maxRent.toLocaleString("nl-NL")}
        </strong>{" "}
        (3x huur regel).
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="ml-auto h-7 text-xs"
        onClick={onClear}
      >
        Wissen
      </Button>
    </div>
  );
};

export default IncomeBanner;