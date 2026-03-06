import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BellRing, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import dailyAlertImg from "@/assets/daily-alert-illustration.jpg";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DailyAlertSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  const subscribe = useMutation({
    mutationFn: async (payload: { email?: string; turnstileToken?: string | null }) => {
      const { data, error } = await supabase.functions.invoke("daily-alert-subscribe", {
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Gelukt",
        description: data?.message || "Je bent ingeschreven voor dagelijkse alerts.",
      });
      setEmail("");
      setTurnstileToken(null);
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Inschrijven mislukt",
        description: error instanceof Error ? error.message : "Probeer het later opnieuw.",
      });
    },
  });

  const handleGuestSubscribe = () => {
    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail || !emailRegex.test(cleanedEmail)) {
      toast({
        variant: "destructive",
        title: "Ongeldig e-mailadres",
        description: "Vul een geldig e-mailadres in.",
      });
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      toast({
        variant: "destructive",
        title: "Captcha vereist",
        description: "Vink de captcha aan voordat je je inschrijft.",
      });
      return;
    }

    subscribe.mutate({ email: cleanedEmail, turnstileToken });
  };

  const handleAccountSubscribe = () => {
    if (turnstileSiteKey && !turnstileToken) {
      toast({
        variant: "destructive",
        title: "Captcha vereist",
        description: "Vink de captcha aan voordat je je inschrijft.",
      });
      return;
    }

    subscribe.mutate({ turnstileToken });
  };

  const handleTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  return (
    <section className="py-16">
      <div className="container">
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="grid md:grid-cols-5">
            {/* Image side */}
            <div className="hidden md:col-span-2 md:block">
              <img
                src={dailyAlertImg}
                alt="Dagelijkse woningalerts"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Content side */}
            <div className="p-6 md:col-span-3 md:p-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                  <BellRing className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                    Alert voor nieuw woningaanbod
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Ontvang dagelijks 1 e-mail na de run met het aantal nieuwe woningen en een knop naar al het aanbod.
                  </p>
                </div>
              </div>

              {user ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ingeschreven met je account e-mail: <span className="font-medium text-foreground">{user.email}</span>
                  </p>
                  <TurnstileWidget siteKey={turnstileSiteKey} onTokenChange={handleTokenChange} />
                  <Button onClick={handleAccountSubscribe} disabled={subscribe.isPending} className="gap-2">
                    {subscribe.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Activeer dagelijkse alert
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      type="email"
                      placeholder="jouw@email.nl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="sm:max-w-sm"
                    />
                    <Button onClick={handleGuestSubscribe} disabled={subscribe.isPending} className="gap-2">
                      {subscribe.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Schrijf me in
                    </Button>
                  </div>
                  <TurnstileWidget siteKey={turnstileSiteKey} onTokenChange={handleTokenChange} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyAlertSection;
