import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import DaisyconEnergyWidget from "@/components/energy/DaisyconEnergyWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, PiggyBank, ShieldCheck, Leaf } from "lucide-react";

const EnergieVergelijken = () => {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Hoeveel kan ik besparen door energie te vergelijken?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Huishoudens besparen gemiddeld € 200 tot € 600 per jaar door over te stappen naar een goedkopere energieleverancier.",
        },
      },
      {
        "@type": "Question",
        name: "Is overstappen van energieleverancier gratis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ja, overstappen is gratis. Je nieuwe leverancier regelt de overstap en de opzegging bij je huidige leverancier.",
        },
      },
      {
        "@type": "Question",
        name: "Hoe lang duurt een overstap?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Na bevestiging duurt een overstap meestal 3 tot 4 weken. Je zit niet zonder energie tijdens de overstap.",
        },
      },
    ],
  };

  const benefits = [
    {
      icon: PiggyBank,
      title: "Bespaar tot € 600 per jaar",
      desc: "Vergelijk in één oogopslag de scherpste tarieven van alle grote energieleveranciers.",
    },
    {
      icon: ShieldCheck,
      title: "100% vrijblijvend",
      desc: "Bekijk eerst alle aanbiedingen, je sluit pas af als je echt wilt overstappen.",
    },
    {
      icon: Leaf,
      title: "Groene stroom mogelijk",
      desc: "Filter op 100% Nederlandse groene stroom van zon, wind of waterkracht.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Energie vergelijken – Bespaar op gas en stroom | WoonPeek"
        description="Vergelijk de actuele energietarieven van alle grote leveranciers en bespaar tot € 600 per jaar. Eenvoudig, vrijblijvend en gratis overstappen via WoonPeek."
        canonical="https://www.woonpeek.nl/energie-vergelijken"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container py-8 md:py-12">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Energie vergelijken" },
              ]}
            />
            <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                  <Zap className="h-3.5 w-3.5" />
                  Energievergelijker
                </span>
                <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                  Energie vergelijken en{" "}
                  <span className="text-primary">honderden euro's besparen</span>
                </h1>
                <p className="mt-4 text-base text-muted-foreground md:text-lg">
                  Verhuis je naar een nieuwe woning of wil je gewoon goedkoper uit zijn?
                  Vergelijk binnen één minuut alle Nederlandse energieleveranciers en
                  vind het beste tarief voor jouw situatie.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Widget */}
        <section className="py-10 md:py-14">
          <div className="container">
            <Card className="overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <DaisyconEnergyWidget />
              </CardContent>
            </Card>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Vergelijking aangeboden via Daisycon. WoonPeek ontvangt mogelijk een
              vergoeding bij een succesvolle overstap.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-t bg-muted/30 py-12 md:py-16">
          <div className="container">
            <h2 className="text-2xl font-bold md:text-3xl">
              Waarom energie vergelijken via WoonPeek?
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {benefits.map((b) => (
                <Card key={b.title}>
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <b.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SEO content */}
        <section className="py-12 md:py-16">
          <div className="container max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground md:text-base">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Hoe werkt energie vergelijken?
            </h2>
            <p>
              Met de energievergelijker zie je in één overzicht de actuele tarieven
              van alle grote Nederlandse leveranciers, zoals Vattenfall, Essent,
              Eneco, Greenchoice en Budget Energie. Je vult je postcode en gemiddeld
              verbruik in en de tool berekent direct welk contract het meest oplevert
              op jaarbasis.
            </p>
            <h3 className="text-xl font-semibold text-foreground">
              Verhuizen? Regel meteen je nieuwe energiecontract
            </h3>
            <p>
              Wanneer je een nieuwe woning betrekt, ben je vrij om zelf je
              energieleverancier te kiezen. Dit is hét moment om kritisch te
              vergelijken: nieuwe klanten krijgen vaak welkomstkortingen en
              cashbacks die kunnen oplopen tot honderden euro's. Combineer dit met
              een meerjarig vast contract en je weet precies waar je aan toe bent.
            </p>
            <h3 className="text-xl font-semibold text-foreground">
              Vast of variabel tarief?
            </h3>
            <p>
              Een vast tarief geeft zekerheid: je betaalt 1, 2 of 3 jaar lang
              hetzelfde bedrag per kWh of m³. Een variabel tarief beweegt mee met de
              markt en kan voordeliger uitvallen wanneer de prijzen dalen. De
              vergelijker toont beide opties zodat je een weloverwogen keuze maakt.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EnergieVergelijken;