import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConsentChoice = "all" | "necessary" | null;

const CONSENT_KEY = "woonpeek_cookie_consent";

/** Read stored consent. Returns null when no choice has been made yet. */
const getStoredConsent = (): ConsentChoice => {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "all" || v === "necessary") return v;
  } catch {}
  return null;
};

/** Activate Google Analytics + AdSense scripts */
const activateAnalytics = () => {
  if (document.getElementById("gtag-script")) return;

  // gtag.js
  const gtagScript = document.createElement("script");
  gtagScript.id = "gtag-script";
  gtagScript.async = true;
  gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-YF7169YC2B";
  document.head.appendChild(gtagScript);

  const inlineGtag = document.createElement("script");
  inlineGtag.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-YF7169YC2B');
  `;
  document.head.appendChild(inlineGtag);

  // AdSense
  if (!document.getElementById("adsense-script")) {
    const adsenseScript = document.createElement("script");
    adsenseScript.id = "adsense-script";
    adsenseScript.async = true;
    adsenseScript.crossOrigin = "anonymous";
    adsenseScript.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3573780897509976";
    document.head.appendChild(adsenseScript);
  }
};

const CookieConsent = () => {
  const [consent, setConsent] = useState<ConsentChoice>(getStoredConsent);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consent === "all") {
      activateAnalytics();
    }
    // Show banner only when no choice stored
    if (consent === null) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [consent]);

  const accept = (choice: "all" | "necessary") => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {}
    setConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-5 shadow-lg sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-foreground">
                Wij gebruiken cookies
              </h3>
              <button
                onClick={() => accept("necessary")}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Sluiten"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              WoonPeek gebruikt cookies voor het functioneren van de website en,
              met jouw toestemming, voor analyse en advertenties. Lees meer in
              ons{" "}
              <Link
                to="/privacy"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                privacybeleid
              </Link>
              .
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => accept("all")} size="sm" className="w-full sm:w-auto">
                Alles accepteren
              </Button>
              <Button
                onClick={() => accept("necessary")}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                Alleen noodzakelijk
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
