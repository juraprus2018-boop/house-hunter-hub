import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Loader2, Search } from "lucide-react";

const Favorites = () => {
  const { user } = useAuth();
  const { data: favorites, isLoading } = useFavorites();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">
            Log in om je favorieten te bekijken
          </h1>
          <p className="mt-2 text-center text-muted-foreground">
            Maak een account aan of log in om woningen op te slaan
          </p>
          <div className="mt-6 flex gap-4">
            <Button asChild>
              <Link to="/inloggen">Inloggen</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/registreren">Registreren</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Mijn favorieten</h1>
            <p className="mt-2 text-muted-foreground">
              {isLoading
                ? "Laden..."
                : `${favorites?.length || 0} opgeslagen ${
                    favorites?.length === 1 ? "woning" : "woningen"
                  }`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : favorites && favorites.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favorites.map((favorite) => (
                <PropertyCard
                  key={favorite.id}
                  property={favorite.properties as any}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="font-display text-xl font-semibold">
                Nog geen favorieten
              </h2>
              <p className="mt-2 text-muted-foreground">
                Sla woningen op door op het hartje te klikken
              </p>
              <Button asChild className="mt-6">
                <Link to="/zoeken">
                  <Search className="mr-2 h-4 w-4" />
                  Zoek woningen
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
