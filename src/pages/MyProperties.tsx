import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProperties } from "@/hooks/useProperties";
import PropertyCard from "@/components/properties/PropertyCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Pencil } from "lucide-react";

const MyProperties = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: properties, isLoading } = useUserProperties();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/inloggen");
    }
  }, [authLoading, user, navigate]);

  const loading = authLoading || isLoading;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Mijn woningen</h1>
              <p className="mt-1 text-muted-foreground">
                Beheer je geplaatste woningen en bekijk hoe ze op het platform staan.
              </p>
            </div>

            <Link to="/plaatsen">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Woning plaatsen
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <div key={property.id} className="relative">
                  <PropertyCard property={property} />
                  <Link
                    to={`/woning/${property.id}/bewerken`}
                    className="absolute bottom-4 right-4 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="secondary" className="gap-1.5 shadow-md">
                      <Pencil className="h-3.5 w-3.5" />
                      Bewerken
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Je hebt nog geen woningen geplaatst</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Plaats je eerste woning om deze hier terug te zien.
                  </p>
                  <Link to="/plaatsen">
                    <Button className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Plaats je eerste woning
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MyProperties;
