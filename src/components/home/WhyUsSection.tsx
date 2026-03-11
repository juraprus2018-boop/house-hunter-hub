import { TrendingUp, Search, Bell, Shield, Zap, Heart } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Actueel woningaanbod",
    description:
      "Dagelijks worden er nieuwe woningen toegevoegd vanuit betrouwbare bronnen in heel Nederland.",
  },
  {
    icon: Search,
    title: "Zoeken op stad en woningtype",
    description:
      "Filter eenvoudig op stad, postcode, prijs, woningtype en aantal slaapkamers.",
  },
  {
    icon: Zap,
    title: "Snel woningen vinden",
    description:
      "Geen eindeloos zoeken op tientallen websites. Bij ons vind je alles op één overzichtelijke plek.",
  },
  {
    icon: Bell,
    title: "Gratis dagelijkse alerts",
    description:
      "Ontvang automatisch een e-mail zodra er nieuwe woningen beschikbaar komen in jouw zoekgebied.",
  },
  {
    icon: Shield,
    title: "Betrouwbare bronnen",
    description:
      "Alle woningen komen van geverifieerde woningplatforms en makelaars. Altijd actueel, altijd betrouwbaar.",
  },
  {
    icon: Heart,
    title: "100% gratis",
    description:
      "Zoek onbeperkt, sla favorieten op en stel alerts in — volledig gratis, zonder verborgen kosten.",
  },
];

const WhyUsSection = () => {
  return (
    <section className="bg-muted/30 py-16 md:py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Waarom WoonPeek?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Het slimste woningplatform van Nederland
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
