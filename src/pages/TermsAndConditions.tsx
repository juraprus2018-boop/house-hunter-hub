import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-12">
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Algemene Voorwaarden
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Laatst bijgewerkt: 13 februari 2026</p>

        <div className="mt-8 space-y-8 text-foreground/90">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">1. Definities</h2>
            <p className="leading-relaxed text-muted-foreground">
              In deze algemene voorwaarden wordt verstaan onder: <strong>WoonPeek</strong>: het online woningplatform bereikbaar via woonpeek.nl; 
              <strong> Gebruiker</strong>: iedere bezoeker of geregistreerde gebruiker van WoonPeek; 
              <strong> Adverteerder</strong>: een gebruiker die een woning aanbiedt via WoonPeek.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">2. Toepasselijkheid</h2>
            <p className="leading-relaxed text-muted-foreground">
              Deze voorwaarden zijn van toepassing op elk gebruik van WoonPeek. Door het platform te gebruiken, ga je akkoord met deze voorwaarden. 
              WoonPeek behoudt zich het recht voor om deze voorwaarden te wijzigen.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">3. Gebruik van het platform</h2>
            <p className="leading-relaxed text-muted-foreground">
              WoonPeek is een platform dat woningaanbod verzamelt en toont. Gebruikers kunnen woningen zoeken, opslaan en aanbieden. 
              Het is niet toegestaan om het platform te gebruiken voor illegale of misleidende doeleinden.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">4. Advertenties en inhoud</h2>
            <p className="leading-relaxed text-muted-foreground">
              Adverteerders zijn zelf verantwoordelijk voor de juistheid en volledigheid van de geplaatste woninginformatie. 
              WoonPeek behoudt zich het recht voor om advertenties te verwijderen die in strijd zijn met deze voorwaarden of de wet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">5. Intellectueel eigendom</h2>
            <p className="leading-relaxed text-muted-foreground">
              Alle content op WoonPeek, inclusief teksten, afbeeldingen, logo's en software, is eigendom van WoonPeek of haar licentiegevers. 
              Het is niet toegestaan om deze content te kopiëren of te verspreiden zonder schriftelijke toestemming.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">6. Aansprakelijkheid</h2>
            <p className="leading-relaxed text-muted-foreground">
              WoonPeek is een bemiddelingsplatform en is niet aansprakelijk voor de inhoud van advertenties, transacties tussen gebruikers, 
              of schade die voortvloeit uit het gebruik van het platform. WoonPeek garandeert niet dat de informatie op het platform altijd 
              juist, volledig of actueel is.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">7. Privacy</h2>
            <p className="leading-relaxed text-muted-foreground">
              WoonPeek verwerkt persoonsgegevens conform de Algemene Verordening Gegevensbescherming (AVG). 
              Zie ons <a href="/privacy" className="text-primary underline hover:text-primary/80">privacybeleid</a> voor meer informatie.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">8. Toepasselijk recht</h2>
            <p className="leading-relaxed text-muted-foreground">
              Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Amsterdam.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
