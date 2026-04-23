import { TrendingUp, Search, Bell, Shield, Zap, Heart } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Sneller dan anderen",
    description: "Ontdek nieuwe woningen zodra ze online komen, nog voordat ze op de grote platforms staan.",
  },
  {
    icon: Search,
    title: "Alles op een plek",
    description: "Geen tientallen websites doorzoeken. WoonPeek combineert het aanbod van meerdere bronnen.",
  },
  {
    icon: Bell,
    title: "Gratis dagelijkse alerts",
    description: "Ontvang automatisch een e-mail met nieuw woningaanbod in jouw zoekgebied.",
  },
  {
    icon: Shield,
    title: "Betrouwbare bronnen",
    description: "Alle woningen komen van geverifieerde woningplatforms en makelaars.",
  },
  {
    icon: TrendingUp,
    title: "Dagelijks bijgewerkt",
    description: "Ons platform wordt dagelijks geupdatet met de nieuwste huur- en koopwoningen.",
  },
  {
    icon: Heart,
    title: "100% gratis",
    description: "Zoek onbeperkt, sla favorieten op en stel alerts in. Volledig gratis.",
  },
];

const WhyUsSection = () => {
  return (
    <section className="bg-surface-cream py-16 md:py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Waarom WoonPeek?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Ontdek nieuwe woningen sneller dan anderen
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="rounded-2xl border border-border bg-background p-7 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
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
