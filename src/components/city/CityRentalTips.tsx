import { Link } from "react-router-dom";
import { Lightbulb, FileCheck, Clock, Euro, CheckCircle2, AlertTriangle } from "lucide-react";

interface CityRentalTipsProps {
  cityName: string;
  totalCount: number;
}

const CityRentalTips = ({ cityName, totalCount }: CityRentalTipsProps) => {
  return (
    <section className="border-t py-12 bg-muted/30">
      <div className="container">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Tips om sneller een woning te vinden in {cityName}
          </h2>
        </div>
        <p className="mb-8 text-base text-muted-foreground">
          De woningmarkt in {cityName} is competitief. Met deze tips vergroot je je kans om snel een woning te vinden.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tip 1: Snel reageren */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Reageer binnen 24 uur</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nieuwe woningen in {cityName} zijn vaak binnen een paar dagen weg. Stel een{" "}
              <Link to="/dagelijkse-alert" className="text-primary underline hover:no-underline">dagelijkse alert</Link>{" "}
              in zodat je direct een melding krijgt bij nieuw aanbod. Op dit moment staan er {totalCount} woningen in {cityName}.
            </p>
          </div>

          {/* Tip 2: Inkomenseisen */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <Euro className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Bereken je maximale huurprijs</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              De meeste verhuurders in {cityName} vragen een bruto inkomen van minimaal <strong>3x de kale huurprijs</strong>. 
              Bij een huur van €1.200 heb je dus minimaal €3.600 bruto per maand nodig. Huur je samen? Dan tellen beide inkomens mee.
            </p>
          </div>

          {/* Tip 3: Documenten */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <FileCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Zorg dat je documenten klaarliggen</h3>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="mb-2">Maak een bezichtigingsmap met deze documenten:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Kopie ID (paspoort of rijbewijs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Laatste 3 loonstroken</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Werkgeversverklaring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Uittreksel BRP (gemeente)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Verklaring Omtrent Gedrag (VOG)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tip 4: Valkuilen */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-foreground">Voorkom oplichting</h3>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="mb-2">Let op deze waarschuwingssignalen:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold shrink-0">✕</span>
                  <span>Betaal nooit vooraf zonder bezichtiging</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold shrink-0">✕</span>
                  <span>Prijs te mooi om waar te zijn? Wees alert</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold shrink-0">✕</span>
                  <span>Verhuurder wil alleen via WhatsApp communiceren</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Controleer KvK-nummer van de verhuurder</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CityRentalTips;
