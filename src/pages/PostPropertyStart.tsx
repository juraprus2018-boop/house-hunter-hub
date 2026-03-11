import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Home, UserPlus } from "lucide-react";

const PostPropertyStart = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/plaatsen");
    }
  }, [loading, user, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Woning plaatsen op WoonPeek | Gratis starten"
        description="Maak gratis een account aan en plaats je woning op WoonPeek. Snel online en direct zichtbaar voor woningzoekers."
        canonical="https://www.woonpeek.nl/woning-plaatsen"
      />
      <Header />
      <main className="flex-1">
        <section className="container py-12">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardContent className="space-y-6 p-8">
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-bold">Plaats je woning gratis</h1>
                  <p className="text-muted-foreground">
                    Maak een gratis account aan en plaats direct je huur- of koopwoning op WoonPeek.
                  </p>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>1. Maak gratis een account aan.</p>
                  <p>2. Vul je woninggegevens en foto's in.</p>
                  <p>3. Je woning staat direct online voor woningzoekers.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/registreren" className="sm:flex-1">
                    <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                      <UserPlus className="h-4 w-4" />
                      Gratis account aanmaken
                    </Button>
                  </Link>
                  <Link to="/inloggen" className="sm:flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <Home className="h-4 w-4" />
                      Ik heb al een account
                    </Button>
                  </Link>
                </div>

                <Link to="/inloggen" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  Klik hier om direct in te loggen
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PostPropertyStart;
