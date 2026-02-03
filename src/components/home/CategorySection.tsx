import { Building2, Home, Building, DoorOpen } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  {
    title: "Appartement",
    description: "Ruime appartementen in de stad",
    icon: Building2,
    count: 456,
    slug: "appartement",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600",
  },
  {
    title: "Huis",
    description: "Eengezinswoningen met tuin",
    icon: Home,
    count: 234,
    slug: "huis",
    gradient: "from-green-500/10 to-emerald-500/10",
    iconColor: "text-green-600",
  },
  {
    title: "Studio",
    description: "Compacte woonruimtes",
    icon: Building,
    count: 189,
    slug: "studio",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-600",
  },
  {
    title: "Kamer",
    description: "Kamers in gedeelde woningen",
    icon: DoorOpen,
    count: 355,
    slug: "kamer",
    gradient: "from-orange-500/10 to-amber-500/10",
    iconColor: "text-orange-600",
  },
];

const CategorySection = () => {
  return (
    <section className="bg-muted/30 py-16">
      <div className="container">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">
            Zoek per woningtype
          </h2>
          <p className="mt-2 text-muted-foreground">
            Kies het type woning dat bij jou past
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/zoeken?type=${category.slug}`}
              className="group"
            >
              <div className={`rounded-2xl bg-gradient-to-br ${category.gradient} p-6 transition-all hover:shadow-lg`}>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ${category.iconColor}`}>
                  <category.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {category.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description}
                </p>
                <p className="mt-3 text-sm font-medium text-foreground">
                  {category.count} woningen
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
