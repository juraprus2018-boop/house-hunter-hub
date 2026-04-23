import { TrendingUp, Search, Bell, Shield, Zap, Heart } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Sneller dan anderen",
    description:
      "Ontdek nieuwe woningen zodra ze online komen, nog voordat ze op de grote platforms staan.",
    iconBg: "bg-amber/20",
    iconColor: "text-amber",
    cardBg: "bg-amber-soft/40",
  },
  {
    icon: Search,
    title: "Alles op één plek",
    description:
      "Geen tientallen websites doorzoeken. WoonPeek combineert het aanbod van meerdere bronnen.",
    iconBg: "bg-sky/15",
    iconColor: "text-sky",
    cardBg: "bg-sky-soft/50",
  },
  {
    icon: Bell,
    title: "Gratis dagelijkse alerts",
    description:
      "Ontvang automatisch een e-mail met nieuw woningaanbod in jouw zoekgebied.",
    iconBg: "bg-terracotta/15",
    iconColor: "text-terracotta",
    cardBg: "bg-terracotta-soft/40",
  },
  {
    icon: Shield,
    title: "Betrouwbare bronnen",
    description:
      "Alle woningen komen van geverifieerde woningplatforms en makelaars.",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    cardBg: "bg-surface-mint",
  },
  {
    icon: TrendingUp,
    title: "Dagelijks bijgewerkt",
    description:
      "Ons platform wordt dagelijks geüpdatet met de nieuwste huur- en koopwoningen.",
    iconBg: "bg-berry/15",
    iconColor: "text-berry",
    cardBg: "bg-berry-soft/40",
  },
  {
    icon: Heart,
    title: "100% gratis",
    description:
      "Zoek onbeperkt, sla favorieten op en stel alerts in. Volledig gratis.",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
    cardBg: "bg-surface-cream",
  },
];

const WhyUsSection = () => {
  return (
    <section className="bg-gradient-to-br from-surface-sky via-background to-surface-mint py-16 md:py-20">
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
                className={`rounded-2xl border ${benefit.cardBg} p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${benefit.iconBg}`}>
                  <Icon className={`h-5 w-5 ${benefit.iconColor}`} />
                </div>
                <h3 className="font-display text-[1.0625rem] font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
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
