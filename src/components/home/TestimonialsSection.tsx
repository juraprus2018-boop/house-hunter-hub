import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Lisa van den Berg",
    city: "Amsterdam",
    rating: 5,
    text: "Eindelijk een site waar ik echt als eerste nieuwe huurwoningen zie. Ik heb binnen twee weken een appartement gevonden via de dagelijkse alert.",
  },
  {
    name: "Mark Janssen",
    city: "Utrecht",
    rating: 5,
    text: "Heel handig dat al het aanbod uit verschillende bronnen op een plek staat. Bespaart me uren scrollen op tien verschillende sites.",
  },
  {
    name: "Fatima El Amrani",
    city: "Rotterdam",
    rating: 4,
    text: "De inkomenscheck is super: ik zie meteen welke woningen passen bij mijn salaris. Geen tijdverspilling meer aan onhaalbare woningen.",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="bg-surface-cream py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Wat zoekers over WoonPeek zeggen
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Ervaringen van mensen die via WoonPeek hun nieuwe woning ontdekten.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border bg-background transition-transform hover:-translate-y-1">
              <CardContent className="space-y-4 p-7">
                <Quote className="h-9 w-9 text-terracotta/40" />
                <p className="text-base leading-relaxed text-foreground/90">
                  "{t.text}"
                </p>
                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <p className="text-base font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.city}</p>
                  </div>
                  <div className="flex">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-terracotta text-terracotta" />
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
