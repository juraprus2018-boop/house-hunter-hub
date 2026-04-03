import { Home, RefreshCw, Heart, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { Button } from "@/components/ui/button";

const ABOUT_FAQ = [
  {
    question: "Is WoonPeek echt gratis?",
    answer: "Ja, WoonPeek is 100% gratis. Zoeken, alerts instellen en je eigen woning plaatsen kost niets. Er zijn geen verborgen kosten of abonnementen.",
  },
  {
    question: "Hoe verdient WoonPeek geld?",
    answer: "WoonPeek verdient geld via samenwerkingen met makelaars en woningplatforms. De kosten worden gedragen door partners, niet door woningzoekers.",
  },
  {
    question: "Hoeveel woningen staan er op WoonPeek?",
    answer: "WoonPeek heeft dagelijks meer dan 6.000 actieve woningen online uit heel Nederland, afkomstig van meerdere bronnen en makelaars.",
  },
  {
    question: "Kan ik zelf een woning plaatsen op WoonPeek?",
    answer: "Ja, als particuliere verhuurder of verkoper kun je gratis je woning adverteren op WoonPeek en duizenden woningzoekers bereiken.",
  },
];

const stats = [
  { label: "Woningen online", value: "6.000+" },
  { label: "Dagelijks bijgewerkt", value: "Elke dag" },
  { label: "Kosten voor gebruikers", value: "Gratis" },
  { label: "Actieve steden", value: "100+" },
];

const usps = [
  {
    icon: Home,
    title: "Groot en divers aanbod",
    description:
      "WoonPeek verzamelt woningen uit meerdere bronnen op één plek. Van huurwoningen en koopwoningen tot studio's en kamers: je vindt het allemaal bij ons. Geen eindeloos zoeken op tientallen websites meer.",
  },
  {
    icon: RefreshCw,
    title: "Dagelijks bijgewerkt",
    description:
      "Ons platform wordt elke dag automatisch bijgewerkt met het nieuwste aanbod. Woningen die niet meer beschikbaar zijn worden verwijderd, zodat je altijd actuele en betrouwbare resultaten ziet.",
  },
  {
    icon: Heart,
    title: "100% gratis platform",
    description:
      "In tegenstelling tot andere woningplatforms is WoonPeek volledig gratis. Zoeken, alerts instellen én zelfs je eigen woning plaatsen: het kost je niets. Geen verborgen kosten, geen abonnementen.",
  },
  {
    icon: Bell,
    title: "Gratis dagelijkse woningalert",
    description:
      "Ontvang elke dag een overzichtelijke e-mail met het nieuwste woningaanbod. Zo ben je altijd als eerste op de hoogte en hoef je niet zelf te zoeken. Uitschrijven kan op elk moment.",
  },
];

const About = () => {
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Over WoonPeek",
    description:
      "WoonPeek is een gratis woningplatform dat dagelijks het nieuwste huur- en koopaanbod verzamelt uit heel Nederland.",
    url: "https://www.woonpeek.nl/over-woonpeek",
    mainEntity: {
      "@type": "Organization",
      name: "WoonPeek",
      url: "https://www.woonpeek.nl",
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ABOUT_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Over WoonPeek – Gratis woningplatform met dagelijks actueel aanbod"
        description="WoonPeek verzamelt dagelijks het nieuwste woningaanbod uit heel Nederland op één plek. Volledig gratis zoeken, alerts instellen en woningen plaatsen."
        canonical="https://www.woonpeek.nl/over-woonpeek"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }}
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b bg-primary">
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>
          <div className="container relative py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">
                Over WoonPeek
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
                WoonPeek is hét gratis woningplatform van Nederland. Wij
                verzamelen dagelijks het nieuwste huur- en koopaanbod uit
                meerdere bronnen, zodat jij sneller vindt wat je zoekt.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b bg-card">
          <div className="container py-10">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-2xl font-bold text-primary md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* USPs */}
        <section className="py-16 md:py-20">
          <div className="container">
            <h2 className="font-display text-center text-2xl font-bold text-foreground md:text-3xl">
              Waarom WoonPeek?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              Dit maakt ons anders dan andere woningplatforms
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {usps.map((usp) => (
                <div
                  key={usp.title}
                  className="rounded-2xl border bg-card p-6 md:p-8"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <usp.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    {usp.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {usp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="border-y bg-muted/30 py-16 md:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl space-y-6">
              <h2 className="font-display text-center text-2xl font-bold text-foreground md:text-3xl">
                Onze missie
              </h2>
              <p className="text-center leading-relaxed text-muted-foreground">
                De woningmarkt in Nederland is krap en onoverzichtelijk.
                Woningzoekers moeten dagelijks tientallen websites checken om
                niets te missen. Dat kan beter. WoonPeek brengt al het aanbod
                samen op één plek, volledig gratis en dagelijks bijgewerkt.
              </p>
              <p className="text-center leading-relaxed text-muted-foreground">
                Wij geloven dat iedereen eerlijke en snelle toegang verdient tot
                het woningaanbod. Daarom rekenen wij geen kosten voor het
                zoeken, het instellen van alerts of het plaatsen van een woning.
                WoonPeek is er voor iedereen.
              </p>
            </div>
          </div>
        </section>

        {/* Gratis woning plaatsen */}
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Gratis je woning plaatsen
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Heb je een woning te huur of te koop? Op WoonPeek kun je
                kosteloos je woning adverteren. Bereik duizenden woningzoekers
                zonder advertentiekosten, anders dan bij veel andere platforms.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/woning-plaatsen">
                  <Button size="lg" className="gap-2">
                    Plaats gratis je woning
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/dagelijkse-alert">
                  <Button size="lg" variant="outline" className="gap-2">
                    Stel een gratis alert in
                    <Bell className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
