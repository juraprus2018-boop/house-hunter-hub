import { TrendingUp, Search, Bell, Shield, Zap, Heart } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Sneller dan anderen",
    description:
      "Ontdek nieuwe woningen zodra ze online komen — nog voordat ze op de grote platforms staan.",
  },
  {
    icon: Search,
    title: "Alles op één plek",
    description:
      "Geen tientallen websites doorzoeken. WoonPeek combineert het aanbod van meerdere bronnen.",
  },
  {
    icon: Bell,
    title: "Gratis dagelijkse alerts",
    description:
      "Ontvang automatisch een e-mail met nieuw woningaanbod in jouw zoekgebied.",
  },
  {
    icon: Shield,
    title: "Betrouwbare bronnen",
    description:
      "Alle woningen komen van geverifieerde woningplatforms en makelaars.",
  },
  {
    icon: TrendingUp,
    title: "Dagelijks bijgewerkt",
    description:
      "Ons platform wordt dagelijks geüpdatet met de nieuwste huur- en koopwoningen.",
  },
  {
    icon: Heart,
    title: "100% gratis",
    description:
      "Zoek onbeperkt, sla favorieten op en stel alerts in — volledig gratis.",
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
            Ontdek nieuwe woningen sneller dan anderen
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="rounded-2xl border bg-card p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">
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
