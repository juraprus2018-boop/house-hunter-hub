import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";

const FAQ_ITEMS = [
  {
    question: "Wat is WoonPeek?",
    answer:
      "WoonPeek is een woningplatform dat dagelijks het nieuwste aanbod van huurwoningen en koophuizen verzamelt uit meerdere bronnen. Zo heb je in één overzicht alle beschikbare woningen in Nederland.",
  },
  {
    question: "Is WoonPeek gratis?",
    answer:
      "Ja, WoonPeek is volledig gratis te gebruiken. Je kunt onbeperkt zoeken, filteren en woningen bekijken zonder kosten.",
  },
  {
    question: "Hoe vaak wordt het woningaanbod bijgewerkt?",
    answer:
      "Ons aanbod wordt dagelijks automatisch bijgewerkt. Nieuwe woningen worden direct zichtbaar zodra ze beschikbaar komen bij onze bronnen.",
  },
  {
    question: "Kan ik een zoekalert instellen?",
    answer:
      "Ja! Als je een account aanmaakt kun je zoekalerts instellen. Je ontvangt dan een e-mail zodra er nieuwe woningen beschikbaar komen die aan jouw criteria voldoen.",
  },
  {
    question: "Hoe kan ik contact opnemen met de verhuurder of verkoper?",
    answer:
      "Bij elke woning vind je een link naar de originele advertentie bij de aanbieder. Daar kun je rechtstreeks contact opnemen. Bij woningen die direct op WoonPeek zijn geplaatst, kun je via ons contactformulier een bericht sturen.",
  },
  {
    question: "Uit welke bronnen haalt WoonPeek woningen?",
    answer:
      "WoonPeek verzamelt woningen van meerdere gerenommeerde platforms en makelaars in Nederland. We breiden onze bronnen continu uit om het meest complete overzicht te bieden.",
  },
  {
    question: "Kan ik zelf een woning plaatsen op WoonPeek?",
    answer:
      "Ja, als je een account hebt kun je zelf woningen plaatsen. Dit is handig voor particuliere verhuurders of verkopers die hun woning extra onder de aandacht willen brengen.",
  },
  {
    question: "In welke steden kan ik woningen vinden?",
    answer:
      "WoonPeek heeft woningen in steden door heel Nederland, waaronder Amsterdam, Rotterdam, Utrecht, Eindhoven, Den Haag, Groningen en nog veel meer. We dekken zowel grote als kleinere steden.",
  },
  {
    question: "Hoe werken de filters op de zoekpagina?",
    answer:
      "Je kunt filteren op stad, woningtype (appartement, huis, studio, kamer), huur of koop, maximale prijs, minimaal aantal slaapkamers en minimale oppervlakte. Zo vind je snel precies wat je zoekt.",
  },
  {
    question: "Wat als een woning niet meer beschikbaar is?",
    answer:
      "Woningen die niet meer beschikbaar zijn worden automatisch als 'verlopen' gemarkeerd. Ze blijven tijdelijk zichtbaar zodat je kunt zien dat ze bestonden, maar worden duidelijk als niet meer beschikbaar aangegeven.",
  },
];

const FAQPage = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
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
        title="Veelgestelde vragen | WoonPeek"
        description="Antwoorden op veelgestelde vragen over WoonPeek. Lees hoe ons woningplatform werkt, hoe je zoekt en hoe je zoekalerts instelt."
        canonical="https://woonpeek.nl/veelgestelde-vragen"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container max-w-3xl">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Veelgestelde vragen" },
              ]}
            />
            <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
              Veelgestelde vragen
            </h1>
            <p className="mt-2 text-muted-foreground">
              Alles wat je wilt weten over WoonPeek en ons woningaanbod
            </p>
          </div>
        </section>

        <section className="container max-w-3xl py-12">
          <div className="space-y-6">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-lg border bg-card p-6">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {item.question}
                </h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
