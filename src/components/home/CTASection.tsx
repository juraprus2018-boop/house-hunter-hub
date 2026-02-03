import { PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center md:px-12 md:py-20">
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
          
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Heb je een woning te huur of te koop?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
              Plaats je woning gratis op ons platform en bereik duizenden woningzoekers.
              Geen makelaarskosten, direct contact met geïnteresseerden.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/plaatsen">
                <Button 
                  size="lg" 
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <PlusCircle className="h-5 w-5" />
                  Plaats je woning
                </Button>
              </Link>
              <Link to="/hoe-werkt-het">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Hoe werkt het?
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
