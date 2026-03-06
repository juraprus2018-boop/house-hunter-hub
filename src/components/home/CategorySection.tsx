import { Link } from "react-router-dom";
import categoryAppartement from "@/assets/category-appartement.jpg";
import categoryHuis from "@/assets/category-huis.jpg";
import categoryStudio from "@/assets/category-studio.jpg";
import categoryKamer from "@/assets/category-kamer.jpg";

const categories = [
  {
    title: "Appartement",
    description: "Ruime appartementen in de stad",
    slug: "appartement",
    image: categoryAppartement,
  },
  {
    title: "Huis",
    description: "Eengezinswoningen met tuin",
    slug: "huis",
    image: categoryHuis,
  },
  {
    title: "Studio",
    description: "Compacte, zelfstandige woonruimtes",
    slug: "studio",
    image: categoryStudio,
  },
  {
    title: "Kamer",
    description: "Kamers in gedeelde woningen",
    slug: "kamer",
    image: categoryKamer,
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
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link
              to="/huurwoningen"
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Alle huurwoningen
            </Link>
            <Link
              to="/koopwoningen"
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Alle koopwoningen
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/zoeken?type=${category.slug}`}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl transition-all hover:shadow-lg">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-display text-xl font-semibold text-white">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/80">
                    {category.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
