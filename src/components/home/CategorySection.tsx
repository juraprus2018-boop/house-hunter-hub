import { Building2, Home, Building, DoorOpen } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  {
    title: "Appartement",
    description: "Ruime appartementen in de stad",
    icon: Building2,
    slug: "appartement",
  },
  {
    title: "Huis",
    description: "Eengezinswoningen met tuin",
    icon: Home,
    slug: "huis",
  },
  {
    title: "Studio",
    description: "Compacte woonruimtes",
    icon: Building,
    slug: "studio",
  },
  {
    title: "Kamer",
    description: "Kamers in gedeelde woningen",
    icon: DoorOpen,
    slug: "kamer",
  },
];

const CategorySection = () => {
  return (
    <section className="py-8">
      <div className="container">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Categorieën
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-4xl">
            Zoek per woningtype
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/zoeken?type=${category.slug}`}
              className="group"
            >
              <div className="flex flex-col items-center rounded-lg border border-border bg-card p-5 text-center transition-all duration-300 hover:border-accent/30 hover:shadow-lg">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <category.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {category.description}
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
