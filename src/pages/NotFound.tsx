import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import notFoundImg from "@/assets/not-found-illustration.jpg";

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
          {/* Atmospheric image */}
          <div className="mx-auto mb-8 w-64 h-44 overflow-hidden rounded-2xl shadow-lg">
            <img
              src={notFoundImg}
              alt="Pagina niet gevonden"
              className="h-full w-full object-cover"
            />
          </div>

          <h1 className="text-7xl font-bold text-primary/20 mb-2">404</h1>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Deze pagina bestaat niet
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            De pagina die je zoekt is verhuisd of bestaat niet meer. 
            Misschien kunnen we je helpen met een nieuwe zoekopdracht?
          </p>

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
