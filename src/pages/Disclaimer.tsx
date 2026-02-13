import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-12">
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Disclaimer
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Laatst bijgewerkt: 13 februari 2026</p>

        <div className="mt-8 space-y-8 text-foreground/90">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">Geen garantie op juistheid</h2>
            <p className="leading-relaxed text-muted-foreground">
              De informatie op WoonPeek wordt met de grootst mogelijke zorg samengesteld. Desondanks kunnen wij niet garanderen 
              dat alle informatie altijd juist, volledig en actueel is. Woninginformatie wordt deels automatisch verzameld van 
              externe bronnen en kan afwijken van de werkelijkheid.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">Geen partij bij transacties</h2>
            <p className="leading-relaxed text-muted-foreground">
              WoonPeek is uitsluitend een informatieplatform en is geen partij bij overeenkomsten die tot stand komen 
              tussen gebruikers onderling. WoonPeek treedt niet op als makelaar, bemiddelaar of adviseur.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">Externe bronnen</h2>
            <p className="leading-relaxed text-muted-foreground">
              WoonPeek verzamelt woningaanbod van diverse externe websites. Wij zijn niet verantwoordelijk voor de inhoud, 
              beschikbaarheid of het privacybeleid van deze externe bronnen. Controleer de informatie altijd bij de originele bron.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">Aansprakelijkheid</h2>
            <p className="leading-relaxed text-muted-foreground">
              WoonPeek is niet aansprakelijk voor enige directe of indirecte schade die voortvloeit uit het gebruik van het platform, 
              waaronder maar niet beperkt tot financiële schade, gemiste kansen of onjuiste beslissingen op basis van de getoonde informatie.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">Wijzigingen</h2>
            <p className="leading-relaxed text-muted-foreground">
              WoonPeek behoudt zich het recht voor om deze disclaimer op elk moment te wijzigen. 
              Het is de verantwoordelijkheid van de gebruiker om regelmatig te controleren of er wijzigingen zijn doorgevoerd.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">Contact</h2>
            <p className="leading-relaxed text-muted-foreground">
              Heb je vragen over deze disclaimer? Neem dan contact met ons op via{" "}
              <strong>info@woonpeek.nl</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Disclaimer;
