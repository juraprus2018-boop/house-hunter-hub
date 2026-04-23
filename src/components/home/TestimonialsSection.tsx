import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Lisa van den Berg",
    city: "Amsterdam",
    rating: 5,
    text: "Eindelijk een site waar ik écht als eerste nieuwe huurwoningen zie. Ik heb binnen twee weken een appartement gevonden via de dagelijkse alert.",
  },
  {
    name: "Mark Janssen",
    city: "Utrecht",
    rating: 5,
    text: "Heel handig dat al het aanbod uit verschillende bronnen op één plek staat. Bespaart me uren scrollen op tien verschillende sites.",
  },
  {
    name: "Fatima El Amrani",
    city: "Rotterdam",
    rating: 4,
    text: "De inkomenscheck is super: ik zie meteen welke woningen passen bij mijn salaris. Geen tijdverspilling meer aan onhaalbare woningen.",
  },
];

const cardStyles = [
  "bg-amber-soft/50 border-amber/20",
  "bg-sky-soft/60 border-sky/20",
  "bg-terracotta-soft/40 border-terracotta/20",
];

const TestimonialsSection = () => {
  return (
    <section className="bg-gradient-to-b from-background to-surface-cream/50 py-16">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Wat zoekers over WoonPeek zeggen
          </h2>
          <p className="mt-3 text-muted-foreground">
            Ervaringen van mensen die via WoonPeek hun nieuwe woning ontdekten.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Card key={t.name} className={`${cardStyles[i % cardStyles.length]} transition-transform hover:-translate-y-1`}>
              <CardContent className="space-y-4 p-6">
                <Quote className="h-8 w-8 text-foreground/20" />
                <p className="text-sm leading-relaxed text-foreground/90">
                  "{t.text}"
                </p>
                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                  </div>
                  <div className="flex">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
