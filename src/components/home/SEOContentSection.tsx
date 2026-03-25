import { Link } from "react-router-dom";

const SEOContentSection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl space-y-6 text-[0.9375rem] md:text-base leading-relaxed text-muted-foreground">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Woningen zoeken in Nederland
          </h2>
          <p>
            Op zoek naar een <strong>woning</strong> in Nederland? WoonPeek verzamelt dagelijks het
            nieuwste aanbod van <strong>huurwoningen</strong>, <strong>appartementen</strong>,
            studio's en koopwoningen uit heel Nederland op één overzichtelijke plek. Of je nu een
            starter bent die een eerste <strong>huurwoning</strong> zoekt, een gezin dat een ruimer
            huis wil kopen, of een student op zoek naar een betaalbare kamer: bij WoonPeek vind je
            snel wat je zoekt.
          </p>
          <p>
            We doorzoeken meerdere betrouwbare bronnen en combineren het aanbod zodat je geen enkele
            kans mist. Filter op stad, prijs, woningtype en aantal slaapkamers om direct de meest
            relevante <strong>woningen in Nederland</strong> te vinden. Populaire zoeksteden zijn
            onder andere{" "}
            <Link to="/woningen-amsterdam" className="text-primary hover:underline">
              Amsterdam
            </Link>
            ,{" "}
            <Link to="/woningen-rotterdam" className="text-primary hover:underline">
              Rotterdam
            </Link>
            ,{" "}
            <Link to="/woningen-utrecht" className="text-primary hover:underline">
              Utrecht
            </Link>
            ,{" "}
            <Link to="/woningen-den-haag" className="text-primary hover:underline">
              Den Haag
            </Link>{" "}
            en{" "}
            <Link to="/woningen-eindhoven" className="text-primary hover:underline">
              Eindhoven
            </Link>
            .
          </p>
          <p>
            Met onze gratis dagelijkse alert ontvang je automatisch een e-mail wanneer er nieuwe{" "}
            <strong>woningen</strong> beschikbaar komen. Sla je favorieten op, vergelijk prijzen en
            reageer sneller dan anderen op de krappe woningmarkt. Start vandaag nog met{" "}
            <strong>woning zoeken</strong> via WoonPeek. Het is volledig gratis.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SEOContentSection;
