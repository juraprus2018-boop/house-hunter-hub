import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center md:px-12 md:py-20">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }} />
          </div>

          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Op zoek naar een woning?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
              Bekijk het complete woningaanbod van Nederland op WoonPeek. Huurwoningen,
              koopwoningen en meer, dagelijks bijgewerkt.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/zoeken">
                <Button
                  size="lg"
                  className="gap-2 bg-accent px-8 text-accent-foreground shadow-lg hover:bg-accent/90"
                >
                  Bekijk het aanbod
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dagelijkse-alert">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Stel een alert in
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
