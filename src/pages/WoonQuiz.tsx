import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cityToSlug } from "@/lib/cities";
import SEOHead from "@/components/seo/SEOHead";
import { Sparkles, ArrowRight, ArrowLeft, Home, Building2, DoorOpen, Bed } from "lucide-react";

type Answers = {
  listingType?: "huur" | "koop";
  propertyType?: "appartement" | "huis" | "studio" | "kamer";
  city?: string;
  budget?: number;
  bedrooms?: number;
};

const STEPS = 5;

const POPULAR_CITIES = [
  "Amsterdam",
  "Rotterdam",
  "Den Haag",
  "Utrecht",
  "Eindhoven",
  "Groningen",
  "Tilburg",
  "Almere",
  "Breda",
  "Nijmegen",
];

const WoonQuiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [cityInput, setCityInput] = useState("");

  const set = (patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    const slug = answers.city ? cityToSlug(answers.city) : "";
    const base =
      answers.propertyType === "appartement"
        ? "/appartementen"
        : answers.propertyType === "huis"
          ? "/huizen"
          : answers.propertyType === "studio"
            ? "/studios"
            : answers.propertyType === "kamer"
              ? "/kamers"
              : answers.listingType === "koop"
                ? "/koopwoningen"
                : "/huurwoningen";

    const params = new URLSearchParams();
    if (answers.budget) params.set("max_price", String(answers.budget));
    if (answers.bedrooms) params.set("min_bedrooms", String(answers.bedrooms));
    if (answers.listingType && !["/koopwoningen", "/huurwoningen"].includes(base)) {
      params.set("listing_type", answers.listingType);
    }
    const qs = params.toString();
    const path = slug ? `${base}/${slug}` : base;
    navigate(qs ? `${path}?${qs}` : path);
  };

  const progress = (step / STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Woonquiz: vind jouw ideale woning | WoonPeek"
        description="Beantwoord 5 korte vragen en ontdek welke woningen het beste bij jou passen. Direct gefilterd aanbod in heel Nederland."
        canonical="https://www.woonpeek.nl/woonquiz"
      />
      <Header />
      <main className="flex-1 py-10 lg:py-16">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Persoonlijk advies
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">Vind jouw ideale woning</h1>
            <p className="text-muted-foreground">5 korte vragen, direct passend aanbod.</p>
          </div>

          <Progress value={progress} className="mb-8 h-2" />

          <Card>
            <CardContent className="p-6 lg:p-8">
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">Wil je huren of kopen?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {(["huur", "koop"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          set({ listingType: t });
                          next();
                        }}
                        className={`rounded-xl border-2 p-6 text-center transition-all hover:border-primary hover:bg-primary/5 ${
                          answers.listingType === t ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <Home className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="font-semibold capitalize">{t}woning</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">Wat voor type woning zoek je?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: "appartement", label: "Appartement", Icon: Building2 },
                      { v: "huis", label: "Huis", Icon: Home },
                      { v: "studio", label: "Studio", Icon: DoorOpen },
                      { v: "kamer", label: "Kamer", Icon: Bed },
                    ].map(({ v, label, Icon }) => (
                      <button
                        key={v}
                        onClick={() => {
                          set({ propertyType: v as Answers["propertyType"] });
                          next();
                        }}
                        className={`rounded-xl border-2 p-5 text-center transition-all hover:border-primary hover:bg-primary/5 ${
                          answers.propertyType === v ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <Icon className="h-7 w-7 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-sm">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">In welke stad wil je wonen?</h2>
                  <Input
                    placeholder="Typ een stad…"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="text-base"
                  />
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_CITIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          set({ city: c });
                          setCityInput(c);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-all hover:border-primary ${
                          answers.city === c ? "border-primary bg-primary/10 text-primary" : "border-border"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    disabled={!cityInput.trim()}
                    onClick={() => {
                      set({ city: cityInput.trim() });
                      next();
                    }}
                  >
                    Volgende <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">Wat is je maximale budget?</h2>
                  <p className="text-sm text-muted-foreground">
                    {answers.listingType === "koop" ? "Aankoopprijs" : "Huur per maand"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(answers.listingType === "koop"
                      ? [200000, 300000, 400000, 500000, 750000, 1000000]
                      : [750, 1000, 1250, 1500, 2000, 2500]
                    ).map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          set({ budget: b });
                          next();
                        }}
                        className={`rounded-xl border-2 p-4 text-center font-semibold transition-all hover:border-primary hover:bg-primary/5 ${
                          answers.budget === b ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        {new Intl.NumberFormat("nl-NL", {
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: 0,
                        }).format(b)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={next}
                    className="text-sm text-muted-foreground hover:text-foreground underline w-full text-center"
                  >
                    Geen voorkeur, sla over
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">Hoeveel slaapkamers minimaal?</h2>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          set({ bedrooms: n });
                          next();
                        }}
                        className={`rounded-xl border-2 p-5 text-center transition-all hover:border-primary hover:bg-primary/5 ${
                          answers.bedrooms === n ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <p className="font-display text-xl font-bold">{n}+</p>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={next}
                    className="text-sm text-muted-foreground hover:text-foreground underline w-full text-center"
                  >
                    Geen voorkeur, sla over
                  </button>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">Je perfecte match is klaar!</h2>
                  <p className="text-muted-foreground">
                    We hebben {answers.propertyType ?? "woningen"}
                    {answers.city ? ` in ${answers.city}` : ""}
                    {answers.budget
                      ? ` tot ${new Intl.NumberFormat("nl-NL", {
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: 0,
                        }).format(answers.budget)}`
                      : ""}{" "}
                    voor je geselecteerd.
                  </p>
                  <Button size="lg" onClick={finish} className="w-full">
                    Bekijk mijn matches <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {step > 0 && step < STEPS && (
                <div className="mt-6 flex justify-between text-sm">
                  <button
                    onClick={back}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" /> Terug
                  </button>
                  <span className="text-muted-foreground">
                    Stap {step + 1} van {STEPS}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WoonQuiz;