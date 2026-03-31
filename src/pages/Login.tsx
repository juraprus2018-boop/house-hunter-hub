import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import logoWoonpeek from "@/assets/logo-woonpeek-v2.png";
import loginSide from "@/assets/login-side.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const resendConfirmation = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "E-mailadres ontbreekt",
        description: "Vul eerst je e-mailadres in, dan kan ik de bevestigingsmail opnieuw sturen.",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Versturen mislukt",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Bevestigingsmail verstuurd",
        description: "Check je inbox (en eventueel spam) en klik op de bevestigingslink.",
      });
      setShowEmailNotConfirmed(false);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowEmailNotConfirmed(false);

    const { error } = await signIn(email, password);

    if (error) {
      const isEmailNotConfirmed =
        error.message === "Email not confirmed" ||
        error.message.toLowerCase().includes("not confirmed");

      if (isEmailNotConfirmed) {
        setShowEmailNotConfirmed(true);
        toast({
          variant: "destructive",
          title: "E-mail nog niet bevestigd",
          description: "Bevestig eerst je e-mailadres of stuur de bevestigingsmail opnieuw.",
        });
        setIsLoading(false);
        return;
      }

      toast({
        variant: "destructive",
        title: "Inloggen mislukt",
        description: error.message === "Invalid login credentials" 
          ? "Onjuiste e-mail of wachtwoord" 
          : error.message,
      });
    } else {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("user_id", data.user.id).then(() => {});
          supabase.functions.invoke("send-email", {
            body: {
              to: "info@woonpeek.nl",
              subject: `Gebruiker ingelogd: ${data.user.email}`,
              html: `<h2>Gebruiker ingelogd</h2>
                <p><strong>E-mail:</strong> ${data.user.email}</p>
                <p><strong>Tijdstip:</strong> ${new Date().toLocaleString("nl-NL")}</p>`,
            },
          }).catch(() => {});
        }
      });

      toast({
        title: "Welkom terug!",
        description: "Je bent succesvol ingelogd.",
      });
      navigate("/");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={loginSide}
          alt="WoonPeek platform"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="absolute inset-0 flex items-end p-12">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Vind jouw droomwoning
            </h2>
            <p className="mt-2 text-lg text-white/80">
              Duizenden woningen op één plek. Gratis zoeken, filteren en alerts instellen.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex w-full items-center justify-center bg-muted/30 px-4 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="text-center">
            <Link to="/" className="mx-auto mb-4">
              <img src={logoWoonpeek} alt="WoonPeek" className="h-[55px]" />
            </Link>
            <CardTitle className="text-2xl">Inloggen</CardTitle>
            <CardDescription>
              Vul je gegevens in om in te loggen op je account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@voorbeeld.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {showEmailNotConfirmed && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <div>
                    <AlertTitle>E-mail nog niet bevestigd</AlertTitle>
                    <AlertDescription>
                      Je account is nog niet geactiveerd. Open je bevestigingsmail of stuur 'm opnieuw.
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={resendConfirmation}
                          disabled={isResending}
                          className="gap-2"
                        >
                          {isResending && <Loader2 className="h-4 w-4 animate-spin" />}
                          Bevestigingsmail opnieuw sturen
                        </Button>
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Inloggen
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Nog geen account?{" "}
                <Link to="/registreren" className="text-primary hover:underline">
                  Registreer hier
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
