import { PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-8">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center md:px-12">
          {/* Subtle decorative circles */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-primary-foreground/10" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full border border-primary-foreground/5" />
          
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/60">
              Voor verhuurders & verkopers
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-primary-foreground md:text-4xl lg:text-5xl">
              Heb je een woning
              <br />
              <span className="italic">te huur of te koop?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base text-primary-foreground/70 leading-relaxed">
              Plaats je woning gratis op WoonPeek en bereik duizenden woningzoekers.
              Geen makelaarskosten.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/plaatsen">
                <Button 
                  size="lg" 
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <PlusCircle className="h-4 w-4" />
                  Plaats je woning
                </Button>
              </Link>
              <Link to="/hoe-werkt-het">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Hoe werkt het?
                  <ArrowRight className="h-4 w-4" />
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
