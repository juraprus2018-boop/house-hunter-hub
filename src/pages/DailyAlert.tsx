import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBanner from "@/components/layout/PageBanner";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import DailyAlertSection from "@/components/home/DailyAlertSection";
import SEOHead from "@/components/seo/SEOHead";
import bannerAlert from "@/assets/banner-alert.jpg";

const ALERT_FAQ = [
  {
    question: "Hoe vaak ontvang ik een woningalert?",
    answer: "Je ontvangt elke maandagochtend één e-mail met het nieuwste woningaanbod van de afgelopen week. Geen spam, alleen relevant aanbod.",
  },
  {
    question: "Kan ik de alert filteren op stad?",
    answer: "Ja, je kunt bij het inschrijven een stad kiezen zodat je alleen woningen uit die regio ontvangt.",
  },
  {
    question: "Hoe schrijf ik me uit voor de alert?",
    answer: "In elke alert-e-mail staat een uitschrijflink. Eén klik en je bent direct afgemeld.",
  },
  {
    question: "Is de wekelijkse alert gratis?",
    answer: "Ja, de wekelijkse woningalert is volledig gratis. Er zijn geen kosten aan verbonden.",
  },
];

const DailyAlert = () => {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ALERT_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Wekelijkse Woningalert – Ontvang nieuw aanbod per e-mail | WoonPeek"
        description="Schrijf je gratis in voor de WoonPeek wekelijkse alert en ontvang elke maandag een e-mail met het nieuwste woningaanbod in Nederland."
        canonical="https://www.woonpeek.nl/dagelijkse-alert"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Header />
      <main className="flex-1">
        <PageBanner image={bannerAlert} alt="Wekelijkse woningalert">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Wekelijkse Alert" },
            ]}
          />
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">
            Wekelijkse Woningalert
          </h1>
          <p className="mt-2 text-muted-foreground">
            Ontvang elke week het nieuwste woningaanbod in je inbox
          </p>
        </PageBanner>
        <DailyAlertSection />
        <section className="border-t bg-muted/30 py-12">
          <div className="container max-w-3xl space-y-6 text-sm text-muted-foreground leading-relaxed">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Wekelijkse woningalert van WoonPeek
            </h2>
            <p>
              Met de wekelijkse woningalert van WoonPeek ontvang je elke maandag een overzichtelijke e-mail 
              met het nieuwste woningaanbod van de afgelopen week in Nederland. Of je nu op zoek bent naar een huurwoning, 
              koopwoning, studio of kamer: onze alert houdt je op de hoogte zonder dat je zelf hoeft te zoeken.
            </p>
            <h3 className="font-display text-xl font-semibold text-foreground pt-2">
              Hoe werkt de wekelijkse alert?
            </h3>
            <p>
              Na inschrijving ontvang je elke maandagochtend één e-mail met een overzicht van alle nieuwe woningen 
              die de afgelopen week zijn toegevoegd, met een directe link naar het volledige overzicht. 
              Zo blijf je op de hoogte zonder dat je zelf hoeft te zoeken.
            </p>
            <h3 className="font-display text-xl font-semibold text-foreground pt-2">
              Waarom een woningalert instellen?
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Bespaar tijd</strong>: Je hoeft niet meer dagelijks meerdere websites af te speuren. 
                WoonPeek doet het werk en stuurt je een handig overzicht.
              </li>
              <li>
                <strong>Reageer sneller</strong>: In een krappe woningmarkt is snelheid cruciaal. 
                Hoe eerder je reageert, hoe groter je kans op een bezichtiging.
              </li>
              <li>
                <strong>Mis niets</strong>: Onze scrapers doorzoeken dagelijks meerdere bronnen. 
                Woningen die je op andere platforms zou missen, vind je wel op WoonPeek.
              </li>
              <li>
                <strong>Gratis en vrijblijvend</strong>: Inschrijven is gratis en je kunt je op elk 
                moment weer uitschrijven via de link in de e-mail.
              </li>
            </ul>
            <p>
              Schrijf je nu in met je e-mailadres en ontvang vanaf de eerstvolgende maandag het nieuwste 
              woningaanbod. Heb je een account? Log in en activeer de alert met één klik.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t py-12">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Veelgestelde vragen over de woningalert
            </h2>
            <div className="space-y-4">
              {ALERT_FAQ.map((item, i) => (
                <div key={i} className="rounded-lg border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {item.question}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DailyAlert;
