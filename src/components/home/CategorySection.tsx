import { Link } from "react-router-dom";
import { Home, Building2, DoorOpen, BedDouble, Key } from "lucide-react";

const categories = [
  {
    title: "Huurwoningen",
    description: "Alle huurwoningen in Nederland",
    href: "/huurwoningen",
    icon: Key,
  },
  {
    title: "Appartementen",
    description: "Ruime appartementen in de stad",
    href: "/zoeken?type=appartement",
    icon: Building2,
  },
  {
    title: "Studio's",
    description: "Compacte, zelfstandige woonruimtes",
    href: "/zoeken?type=studio",
    icon: DoorOpen,
  },
  {
    title: "Kamers",
    description: "Kamers in gedeelde woningen",
    href: "/zoeken?type=kamer",
    icon: BedDouble,
  },
  {
    title: "Koopwoningen",
    description: "Woningen te koop in Nederland",
    href: "/koopwoningen",
    icon: Home,
  },
];

const CategorySection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Zoek per woningtype
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Kies het type woning dat bij jou past
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.href}
                to={category.href}
                className="group flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 text-center transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
