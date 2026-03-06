import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoWoonpeek from "@/assets/logo-woonpeek.png";
import loginSide from "@/assets/login-side.jpg";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Wachtwoord te kort",
        description: "Je wachtwoord moet minimaal 6 tekens bevatten.",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, displayName);

    if (error) {
      toast({
        variant: "destructive",
        title: "Registratie mislukt",
        description: error.message,
      });
    } else {
      supabase.functions.invoke("send-email", {
        body: {
          to: "info@woonpeek.nl",
          subject: `Nieuwe registratie: ${displayName || email}`,
          html: `<h2>Nieuwe gebruiker geregistreerd</h2>
            <p><strong>Naam:</strong> ${displayName || "Niet opgegeven"}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            <p><strong>Tijdstip:</strong> ${new Date().toLocaleString("nl-NL")}</p>`,
        },
      }).catch(() => {});

      toast({
        title: "Registratie succesvol!",
        description: "Controleer je e-mail om je account te bevestigen.",
      });
      navigate("/inloggen");
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
              Word lid van WoonPeek
            </h2>
            <p className="mt-2 text-lg text-white/80">
              Maak gratis een account aan en ontdek duizenden woningen in heel Nederland.
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
            <CardTitle className="text-2xl">Registreren</CardTitle>
            <CardDescription>
              Maak een account aan om woningen te plaatsen en favorieten op te slaan
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Naam</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Jan Jansen"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
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
                  placeholder="Minimaal 6 tekens"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registreren
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Al een account?{" "}
                <Link to="/inloggen" className="text-primary hover:underline">
                  Log hier in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
