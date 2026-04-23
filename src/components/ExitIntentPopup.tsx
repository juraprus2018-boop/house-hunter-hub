import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DISMISSED_KEY = "woonpeek_exit_popup_dismissed";
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

const ExitIntentPopup = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {}
  }, []);

  useEffect(() => {
    // Check cooldown
    try {
      const last = localStorage.getItem(DISMISSED_KEY);
      if (last && Date.now() - Number(last) < COOLDOWN_MS) return;
    } catch {}

    // Only trigger after 10s on page
    const timer = setTimeout(() => {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 5) {
          setVisible(true);
          document.removeEventListener("mouseout", handleMouseLeave);
        }
      };
      document.addEventListener("mouseout", handleMouseLeave);
      return () => document.removeEventListener("mouseout", handleMouseLeave);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("daily-alert-subscribe", {
        body: { email: email.trim(), source: "exit-intent" },
      });
      if (error) throw error;
      toast.success("Je ontvangt nu wekelijks het nieuwste woningaanbod!");
      dismiss();
    } catch {
      toast.error("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Mis geen nieuwe woningen!
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ontvang wekelijks gratis het nieuwste woningaanbod in je inbox. Eerder weten betekent sneller reageren.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex w-full gap-2">
            <Input
              type="email"
              placeholder="Je e-mailadres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "..." : "Aanmelden"}
            </Button>
          </form>

          <p className="mt-3 text-xs text-muted-foreground">
            Gratis en altijd opzegbaar.{" "}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacybeleid
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
