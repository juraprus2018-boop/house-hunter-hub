import { Link } from "react-router-dom";

const SEOContentSection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl space-y-6 text-base md:text-lg leading-relaxed text-muted-foreground">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Woningen zoeken in Nederland
          </h2>
          <p>
            Op zoek naar een <strong>woning</strong> in Nederland? WoonPeek verzamelt dagelijks het
            nieuwste aanbod van <Link to="/huurwoningen" className="text-primary hover:underline">huurwoningen</Link>,{" "}
            <Link to="/appartementen" className="text-primary hover:underline">appartementen</Link>,
            studio's en <Link to="/koopwoningen" className="text-primary hover:underline">koopwoningen</Link> uit heel Nederland op een overzichtelijke plek. Of je nu een
            starter bent die een eerste huurwoning zoekt, een gezin dat een ruimer
            huis wil kopen, of een student op zoek naar een betaalbare{" "}
            <Link to="/kamers" className="text-primary hover:underline">kamer</Link>: bij WoonPeek vind je
            snel wat je zoekt.
          </p>
          <p>
            We doorzoeken meerdere betrouwbare bronnen en combineren het aanbod zodat je geen enkele
            kans mist. Filter op stad, prijs, woningtype en aantal slaapkamers om direct de meest
            relevante <Link to="/zoeken" className="text-primary hover:underline">woningen in Nederland</Link> te vinden. Populaire zoeksteden zijn
            onder andere{" "}
            <Link to="/woningen-amsterdam" className="text-primary hover:underline">Amsterdam</Link>,{" "}
            <Link to="/woningen-rotterdam" className="text-primary hover:underline">Rotterdam</Link>,{" "}
            <Link to="/woningen-utrecht" className="text-primary hover:underline">Utrecht</Link>,{" "}
            <Link to="/woningen-den-haag" className="text-primary hover:underline">Den Haag</Link> en{" "}
            <Link to="/woningen-eindhoven" className="text-primary hover:underline">Eindhoven</Link>.
            Bekijk het volledige overzicht op onze{" "}
            <Link to="/steden" className="text-primary hover:underline">stedenpagina</Link>.
          </p>
          <p>
            Met onze gratis{" "}
            <Link to="/dagelijkse-alert" className="text-primary hover:underline">dagelijkse alert</Link>{" "}
            ontvang je automatisch een e-mail wanneer er nieuwe woningen beschikbaar komen. Bekijk ook het{" "}
            <Link to="/nieuw-aanbod" className="text-primary hover:underline">nieuw aanbod van vandaag</Link>{" "}
            of gebruik de{" "}
            <Link to="/budget-tool" className="text-primary hover:underline">budget tool</Link>{" "}
            om te berekenen wat je kunt besteden. Sla je favorieten op, vergelijk prijzen en
            reageer sneller dan anderen op de krappe woningmarkt.
          </p>
          <p>
            Lees onze{" "}
            <Link to="/blog" className="text-primary hover:underline">blog</Link>{" "}
            voor tips over woningen zoeken, de woningmarkt en huurprijzen. Of bekijk de{" "}
            <Link to="/huurprijsmonitor" className="text-primary hover:underline">huurprijsmonitor</Link>{" "}
            voor actuele huurprijzen per stad. Start vandaag nog met{" "}
            <strong>woning zoeken</strong> via WoonPeek. Het is volledig gratis.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SEOContentSection;
