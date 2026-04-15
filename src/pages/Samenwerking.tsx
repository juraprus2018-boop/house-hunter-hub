import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Handshake, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Samenwerking = () => {
  const { data: feeds, isLoading } = useQuery({
    queryKey: ["daisycon-feeds-public"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("daisycon_feeds")
        .select("name, logo_url, is_active")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as { name: string; logo_url: string | null; is_active: boolean }[];
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Samenwerking – Onze partners | WoonPeek"
        description="WoonPeek werkt samen met toonaangevende woningplatformen in Nederland. Bekijk onze partners en aanbieders."
        canonical="https://www.woonpeek.nl/samenwerking"
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-muted/30 py-12 md:py-16">
          <div className="container max-w-3xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Handshake className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Onze partners &amp; aanbieders
            </h1>
            <p className="mt-3 text-muted-foreground">
              WoonPeek werkt samen met betrouwbare woningplatformen in heel Nederland.
              Via ons partnernetwerk verzamelen we dagelijks het nieuwste woningaanbod,
              zodat jij alles op één plek kunt vinden.
            </p>
          </div>
        </section>

        {/* Partners grid */}
        <section className="py-12 md:py-16">
          <div className="container max-w-5xl">
            <h2 className="font-display mb-8 text-center text-2xl font-bold text-foreground">
              Aangesloten aanbieders
            </h2>

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(feeds || []).map((feed) => (
                  <div
                    key={feed.name}
                    className="flex flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
                  >
                    {feed.logo_url ? (
                      <img
                        src={feed.logo_url}
                        alt={`Logo ${feed.name}`}
                        className="h-12 max-w-[160px] object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground">
                        {feed.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-display text-lg font-semibold text-foreground">
                      {feed.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && (!feeds || feeds.length === 0) && (
              <p className="text-center text-muted-foreground">
                Er zijn momenteel geen partners beschikbaar.
              </p>
            )}
          </div>
        </section>

        {/* Info */}
        <section className="border-t bg-muted/30 py-12">
          <div className="container max-w-3xl space-y-6 text-sm leading-relaxed text-muted-foreground">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Hoe werkt onze samenwerking?
            </h2>
            <p>
              WoonPeek werkt samen met diverse woningplatformen en aanbieders in heel Nederland.
              Dankzij ons partnernetwerk verzamelen we dagelijks duizenden woningen en tonen
              we deze op één overzichtelijke plek.
            </p>
            <p>
              Elke partner levert een datafeed met actueel woningaanbod. Onze systemen
              verwerken deze feeds automatisch, zodat je als bezoeker altijd het meest
              recente aanbod ziet, zonder zelf tientallen websites af te hoeven zoeken.
            </p>
            <h3 className="font-display pt-2 text-xl font-semibold text-foreground">
              Zelf samenwerken met WoonPeek?
            </h3>
            <p>
              Ben je een woningplatform of makelaar en wil je jouw aanbod op WoonPeek tonen?
              Neem dan contact met ons op via{" "}
              <a href="mailto:info@woonpeek.nl" className="font-medium text-primary underline underline-offset-2">
                info@woonpeek.nl
              </a>{" "}
              of bekijk onze{" "}
              <a href="/makelaar-koppelen" className="font-medium text-primary underline underline-offset-2">
                makelaar-koppeling
              </a>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Samenwerking;
