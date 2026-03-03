import { Link } from "react-router-dom";
import { CheckCircle, Search, Bell, Home, TrendingUp, Shield } from "lucide-react";

const SEOContentSection = () => {
  return (
    <section className="border-t bg-muted/30 py-16">
      <div className="container">
        {/* Waarom WoonPeek */}
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-8">
            Waarom WoonPeek voor jouw woningzoektocht?
          </h2>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            WoonPeek is het woningplatform dat dagelijks het nieuwste aanbod van huurwoningen en koopwoningen
            in heel Nederland verzamelt. Geen eindeloos zoeken op tientallen websites — bij ons vind je alles
            op één plek.
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">Dagelijks vers aanbod</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Onze scrapers doorzoeken elke dag meerdere woningplatforms en makelaarswebsites. 
                Zodra een nieuwe huurwoning of koopwoning online komt, verschijnt deze op WoonPeek. 
                Zo mis je nooit meer een kans op jouw droomwoning.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">Slim zoeken & filteren</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Filter op stad, postcode, woningtype, prijs, aantal slaapkamers en oppervlakte. 
                Of gebruik onze interactieve kaart om woningen in jouw buurt te ontdekken. 
                Van appartementen in Amsterdam tot huizen in Eindhoven — vind precies wat je zoekt.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">Gratis zoekalerts</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stel een dagelijkse alert in en ontvang automatisch een e-mail zodra er nieuwe woningen 
                beschikbaar komen. Ideaal in de krappe woningmarkt waar snelheid het verschil maakt 
                tussen een bezichtiging en een gemiste kans.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">Alle woningtypes</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Van ruime eengezinswoningen en moderne appartementen tot betaalbare studio's en kamers 
                voor studenten. WoonPeek biedt het complete overzicht van het Nederlandse woningaanbod, 
                zowel te huur als te koop.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">Betrouwbare bronnen</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Alle woningen op WoonPeek komen van geverifieerde bronnen zoals gerenommeerde 
                woningplatforms en makelaars. Je kunt altijd doorklikken naar de originele advertentie 
                voor volledige informatie en contact met de aanbieder.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">100% gratis</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                WoonPeek is volledig gratis. Zoek onbeperkt, sla favorieten op, stel alerts in 
                en plaats zelfs je eigen woning — allemaal zonder kosten. Geen verborgen abonnementen, 
                geen makelaarskosten.
              </p>
            </div>
          </div>
        </div>

        {/* Uitgebreide SEO tekst */}
        <div className="mx-auto max-w-3xl space-y-6 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Huurwoningen en koopwoningen zoeken in Nederland
          </h2>
          <p>
            De Nederlandse woningmarkt is competitiever dan ooit. Of je nu een starter bent die op zoek is 
            naar een eerste huurwoning, een gezin dat een ruimer huis wil kopen, of een student die een 
            betaalbare kamer zoekt — het vinden van de juiste woning vergt tijd en doorzettingsvermogen. 
            WoonPeek maakt dit proces eenvoudiger door het aanbod van meerdere woningplatforms samen te 
            brengen op één overzichtelijke plek.
          </p>
          <p>
            Elke dag worden er nieuwe woningen toegevoegd aan ons platform. We scannen bronnen zoals 
            Pararius, Kamernet, Huurwoningen.nl, DirectWonen en diverse woningcorporaties om je het meest 
            complete en actuele overzicht te bieden. Doordat we meerdere bronnen combineren, zie je woningen 
            die je op individuele websites misschien zou missen.
          </p>

          <h3 className="font-display text-xl font-semibold text-foreground pt-4">
            Huurwoningen vinden via WoonPeek
          </h3>
          <p>
            Op zoek naar een <Link to="/huurwoningen" className="text-primary hover:underline">huurwoning</Link>? 
            WoonPeek toont dagelijks het nieuwste huurwoningaanbod in alle grote steden en regio's van Nederland. 
            Filter op maximale huurprijs, aantal slaapkamers, oppervlakte en woningtype om snel een geschikte 
            huurwoning te vinden. Van betaalbare kamers onder de €500 per maand tot ruime gezinswoningen — 
            je vindt het allemaal op ons platform.
          </p>
          <p>
            Populaire steden voor huurwoningen zijn onder andere{" "}
            <Link to="/amsterdam" className="text-primary hover:underline">Amsterdam</Link>,{" "}
            <Link to="/rotterdam" className="text-primary hover:underline">Rotterdam</Link>,{" "}
            <Link to="/utrecht" className="text-primary hover:underline">Utrecht</Link>,{" "}
            <Link to="/den-haag" className="text-primary hover:underline">Den Haag</Link>,{" "}
            <Link to="/eindhoven" className="text-primary hover:underline">Eindhoven</Link> en{" "}
            <Link to="/groningen" className="text-primary hover:underline">Groningen</Link>.
            Maar ook in kleinere steden en dorpen worden dagelijks nieuwe huurwoningen aangeboden.
          </p>

          <h3 className="font-display text-xl font-semibold text-foreground pt-4">
            Koopwoningen vinden via WoonPeek
          </h3>
          <p>
            Naast huurwoningen biedt WoonPeek ook een overzicht van{" "}
            <Link to="/koopwoningen" className="text-primary hover:underline">koopwoningen</Link> in 
            Nederland. Of je nu een appartement, een rijtjeshuis of een vrijstaande woning zoekt — 
            met onze filters vind je snel een koopwoning die past bij jouw wensen en budget. 
            Bekijk de nieuwste koopwoningen, vergelijk prijzen en sla je favorieten op.
          </p>

          <h3 className="font-display text-xl font-semibold text-foreground pt-4">
            Tips voor woningzoekers
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Stel een dagelijkse alert in</strong> — In een krappe woningmarkt is snelheid essentieel. 
              Met onze gratis dagelijkse alert ontvang je elke dag een e-mail met het nieuwste aanbod.
            </li>
            <li>
              <strong>Verbreed je zoekgebied</strong> — Kijk ook in randgemeenten en omliggende steden. 
              Vaak zijn daar meer woningen beschikbaar tegen lagere prijzen.
            </li>
            <li>
              <strong>Reageer snel</strong> — Populaire woningen zijn vaak binnen enkele dagen verhuurd of verkocht. 
              Zorg dat je documenten (ID, werkgeversverklaring, salarisstrook) alvast klaar hebt liggen.
            </li>
            <li>
              <strong>Gebruik de kaartweergave</strong> — Op onze{" "}
              <Link to="/verkennen" className="text-primary hover:underline">verkenningspagina</Link>{" "}
              zie je alle woningen op een interactieve kaart. Handig om te zien wat er in jouw directe 
              omgeving beschikbaar is.
            </li>
            <li>
              <strong>Bewaar je favorieten</strong> — Maak een gratis account aan en sla interessante 
              woningen op in je{" "}
              <Link to="/favorieten" className="text-primary hover:underline">favorieten</Link>. 
              Zo kun je ze later eenvoudig terugvinden en vergelijken.
            </li>
          </ul>

          <h3 className="font-display text-xl font-semibold text-foreground pt-4">
            Veelgestelde vragen
          </h3>
          <p>
            Heb je vragen over hoe WoonPeek werkt? Bekijk onze{" "}
            <Link to="/veelgestelde-vragen" className="text-primary hover:underline">
              veelgestelde vragen
            </Link>{" "}
            pagina voor antwoorden op de meest gestelde vragen over ons platform, het zoekproces en 
            het instellen van alerts.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SEOContentSection;
