import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AlertUnsubscribe = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Je afmelding wordt verwerkt...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setMessage("Ongeldige afmeldlink.");
        setIsSuccess(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("daily-alert-unsubscribe", {
        body: { token },
      });

      if (error || data?.error) {
        setMessage(data?.error || error?.message || "Afmelden is niet gelukt.");
        setIsSuccess(false);
      } else if (data?.already_unsubscribed) {
        setMessage("Je was al afgemeld voor deze alerts.");
        setIsSuccess(true);
      } else if (data?.success) {
        setMessage("Je bent succesvol afgemeld van de wekelijkse alerts.");
        setIsSuccess(true);
      } else {
        setMessage("Ongeldige of verlopen afmeldlink.");
        setIsSuccess(false);
      }

      setLoading(false);
    };

    run();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Alert afmelden | WoonPeek"
        description="Meld je af voor wekelijkse e-mailalerts van WoonPeek."
        canonical="https://www.woonpeek.nl/alerts/afmelden"
      />
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-4 p-8 text-center">
            {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /> : null}
            <h1 className="font-display text-2xl font-bold">{isSuccess ? "Afmelding voltooid" : "Afmelding"}</h1>
            <p className="text-muted-foreground">{message}</p>
            <Link to="/">
              <Button>Naar home</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AlertUnsubscribe;
