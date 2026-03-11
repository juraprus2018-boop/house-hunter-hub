import { Search, Sparkles, Bell } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "1",
    title: "Zoek jouw regio",
    description: "Kies een stad, postcode of regio en stel je filters in op prijs, woningtype en kamers.",
  },
  {
    icon: Sparkles,
    step: "2",
    title: "Ontdek nieuw aanbod",
    description: "Bekijk dagelijks bijgewerkte woningen van meerdere betrouwbare bronnen op één plek.",
  },
  {
    icon: Bell,
    step: "3",
    title: "Reageer als eerste",
    description: "Stel alerts in en ontvang nieuwe woningen direct in je inbox — sneller dan anderen.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Hoe werkt WoonPeek?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            In drie stappen sneller bij je nieuwe woning
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -top-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
