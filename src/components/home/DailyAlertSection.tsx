import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BellRing, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DailyAlertSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const subscribe = useMutation({
    mutationFn: async (payload: { email?: string }) => {
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
    subscribe.mutate({ email: cleanedEmail });
  };

  const handleAccountSubscribe = () => {
    subscribe.mutate({});
  };

  return (
    <section className="py-16">
      <div className="container">
        <div className="rounded-3xl border bg-card p-6 md:p-10">
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
              <Button onClick={handleAccountSubscribe} disabled={subscribe.isPending} className="gap-2">
                {subscribe.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Activeer dagelijkse alert
              </Button>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
};

export default DailyAlertSection;
