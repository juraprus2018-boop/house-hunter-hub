import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-lg mx-auto">
          {/* Large 404 with gradient */}
          <div className="relative mb-6">
            <h1 
              className="text-[10rem] font-bold leading-none tracking-tighter select-none"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: 0.15,
              }}
            >
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border">
                <MapPin className="w-12 h-12 text-accent mx-auto mb-2" />
                <p className="text-lg font-semibold text-foreground">Adres niet gevonden</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Deze pagina bestaat niet
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            De pagina die je zoekt is verhuisd of bestaat niet meer. 
            Misschien kunnen we je helpen met een nieuwe zoekopdracht?
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Naar home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link to="/zoeken">
                <Search className="w-4 h-4 mr-2" />
                Woningen zoeken
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="w-full sm:w-auto"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ga terug
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
