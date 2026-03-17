import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ClipboardList,
  Link2,
  Rocket,
  XCircle,
  Zap,
  RefreshCw,
  Users,
  Globe,
  BarChart3,
  Shield,
} from "lucide-react";

const MakelaarKoppelen = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    kantoornaam: "",
    contactpersoon: "",
    email: "",
    telefoon: "",
    website: "",
    koppeling_type: "xml",
    crm_software: "",
    feed_url: "",
    opmerking: "",
  });

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kantoornaam || !form.contactpersoon || !form.email) {
      toast.error("Vul alle verplichte velden in.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("makelaar_leads" as any).insert({
      kantoornaam: form.kantoornaam,
      contactpersoon: form.contactpersoon,
      email: form.email,
      telefoon: form.telefoon || null,
      website: form.website || null,
      koppeling_type: form.koppeling_type,
      crm_software: form.crm_software || null,
      feed_url: form.feed_url || null,
      opmerking: form.opmerking || null,
    } as any);
    setLoading(false);
    if (error) {
      toast.error("Er ging iets mis. Probeer het opnieuw.");
      return;
    }
    setSubmitted(true);
    toast.success("Aanvraag ontvangen! We nemen snel contact op.");
  };

  const problems = [
    { icon: XCircle, text: "Nog een platform om woningen handmatig te plaatsen?" },
    { icon: XCircle, text: "Dubbel werk in meerdere systemen?" },
    { icon: XCircle, text: "Tijd kwijt aan invoeren?" },
  ];

  const solutions = [
    { icon: Check, text: "1 koppeling = alles automatisch" },
    { icon: Check, text: "Realtime updates" },
    { icon: Check, text: "Geen extra werk voor jouw kantoor" },
  ];

  const steps = [
    { icon: ClipboardList, title: "Vul je gegevens in", desc: "Laat je kantoorinfo en feed URL achter." },
    { icon: Link2, title: "Voeg je XML feed of CRM toe", desc: "Wij koppelen jouw systeem aan WoonPeek." },
    { icon: Rocket, title: "Je woningen staan automatisch live", desc: "Alles wordt realtime bijgewerkt." },
  ];

  const voordelen = [
    { icon: Zap, text: "Geen handmatig invoeren" },
    { icon: RefreshCw, text: "Automatische woningupdates" },
    { icon: Globe, text: "Extra bereik voor je aanbod" },
    { icon: Users, text: "Meer leads van kopers en huurders" },
    { icon: Shield, text: "Werkt met bestaande makelaarssoftware" },
    { icon: BarChart3, text: "Inzicht in prestaties van je woningen" },
  ];

  const systemen = [
    "XML feeds", "JSON API", "Realworks", "Kolibri", "Skarabee", "Whise", "Tiara", "Ziggo", "Andere CRM systemen",
  ];

  const faqs = [
    { q: "Moet ik woningen handmatig invoeren?", a: "Nee, alles gaat automatisch via je feed of CRM. Na de koppeling hoef je niets meer te doen." },
    { q: "Hoe snel staan mijn woningen live?", a: "Meestal binnen korte tijd na koppeling. Zodra je feed is gekoppeld, worden je woningen automatisch geïmporteerd." },
    { q: "Kost dit extra werk?", a: "Nee, na de eenmalige koppeling loopt alles automatisch. Je hoeft niets te veranderen aan je huidige workflow." },
    { q: "Wat heb ik nodig?", a: "Een XML feed URL, API endpoint of de naam van je CRM software. Wij regelen de rest." },
    { q: "Is dit gratis?", a: "Ja, het koppelen van je woningaanbod is gratis. Je woningen krijgen direct extra bereik." },
  ];

  return (
    <>
      <Helmet>
        <title>Makelaar woningen koppelen – Automatisch plaatsen op WoonPeek</title>
        <meta
          name="description"
          content="Koppel je XML feed of makelaarssoftware en toon al je woningen automatisch op WoonPeek. Geen handmatig invoeren, binnen 2 minuten geregeld."
        />
      </Helmet>
      <Header />

      <main className="min-h-screen">
        {/* HERO */}
        <section className="relative overflow-hidden bg-primary">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(145_55%_35%/0.15),transparent_60%)]" />
          <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-6 bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30 text-sm px-4 py-1.5">
                Voor makelaars
              </Badge>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
                Plaats je woningaanbod{" "}
                <span className="text-accent">automatisch</span> op WoonPeek
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Koppel je XML feed of API en toon al je woningen automatisch.
                Geen handmatig invoeren.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={scrollToForm}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 rounded-xl shadow-lg"
                >
                  Gratis koppelen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <p className="text-primary-foreground/60 text-sm mt-4">
                ✓ Binnen 2 minuten geregeld &nbsp;·&nbsp; ✓ Gratis &nbsp;·&nbsp; ✓ Geen extra werk
              </p>
            </div>
          </div>
        </section>

        {/* PROBLEEM → OPLOSSING */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 max-w-5xl mx-auto">
              {/* Probleem */}
              <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-8">
                <p className="text-sm font-semibold text-destructive uppercase tracking-wider mb-6">
                  Het probleem
                </p>
                <ul className="space-y-5">
                  {problems.map((p, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <p.icon className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      <span className="text-foreground font-medium">{p.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Oplossing */}
              <div className="bg-accent/5 border border-accent/15 rounded-2xl p-8">
                <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-6">
                  De oplossing
                </p>
                <ul className="space-y-5">
                  {solutions.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center mt-0.5 shrink-0">
                        <s.icon className="h-3 w-3 text-accent-foreground" />
                      </div>
                      <span className="text-foreground font-medium">{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HOE HET WERKT */}
        <section className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                Hoe het werkt
              </h2>
              <p className="text-muted-foreground text-lg">
                In 3 simpele stappen ben je klaar
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl p-8 text-center shadow-[var(--shadow-md)] border border-border relative"
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <step.icon className="h-10 w-10 text-accent mx-auto mb-4 mt-2" />
                  <h3 className="font-semibold text-foreground text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-10 text-sm">
              Je hoeft niets handmatig in te voeren
            </p>
          </div>
        </section>

        {/* VOORDELEN */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground text-center mb-12">
              Waarom makelaars voor WoonPeek kiezen
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {voordelen.map((v, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-card border border-border rounded-xl p-6 shadow-[var(--shadow-sm)]"
                >
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <v.icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-foreground font-medium pt-2">{v.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ONDERSTEUNDE SYSTEMEN */}
        <section className="py-16 md:py-20 bg-secondary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ondersteunde systemen
            </h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
              Gebruik je al een CRM? Dan kunnen we meestal direct koppelen.
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {systemen.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="text-sm px-5 py-2.5 rounded-lg font-medium bg-card border border-border text-foreground"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* FORMULIER */}
        <section ref={formRef} id="koppelen" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                  Start je koppeling
                </h2>
                <p className="text-muted-foreground">
                  Vul onderstaand formulier in en wij regelen de rest.
                </p>
              </div>

              {submitted ? (
                <div className="bg-accent/10 border border-accent/20 rounded-2xl p-10 text-center">
                  <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
                    <Check className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Aanvraag ontvangen!
                  </h3>
                  <p className="text-muted-foreground">
                    Wij nemen zo snel mogelijk contact op om de koppeling in te richten.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-[var(--shadow-lg)] space-y-5"
                >
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="kantoornaam">Kantoornaam *</Label>
                      <Input
                        id="kantoornaam"
                        placeholder="Bijv. Makelaardij De Vries"
                        value={form.kantoornaam}
                        onChange={(e) => handleChange("kantoornaam", e.target.value)}
                        required
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactpersoon">Contactpersoon *</Label>
                      <Input
                        id="contactpersoon"
                        placeholder="Naam contactpersoon"
                        value={form.contactpersoon}
                        onChange={(e) => handleChange("contactpersoon", e.target.value)}
                        required
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mailadres *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@voorbeeld.nl"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                        maxLength={255}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefoon">Telefoonnummer</Label>
                      <Input
                        id="telefoon"
                        type="tel"
                        placeholder="+31 6 12345678"
                        value={form.telefoon}
                        onChange={(e) => handleChange("telefoon", e.target.value)}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://www.jouwmakelaardij.nl"
                      value={form.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      maxLength={255}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="koppeling_type">Type koppeling</Label>
                      <Select
                        value={form.koppeling_type}
                        onValueChange={(v) => handleChange("koppeling_type", v)}
                      >
                        <SelectTrigger id="koppeling_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xml">XML feed</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="crm">CRM koppeling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crm_software">CRM software (optioneel)</Label>
                      <Input
                        id="crm_software"
                        placeholder="Bijv. Realworks, Kolibri"
                        value={form.crm_software}
                        onChange={(e) => handleChange("crm_software", e.target.value)}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feed_url">Feed URL (optioneel)</Label>
                    <Input
                      id="feed_url"
                      placeholder="https://www.jouwsite.nl/feed.xml"
                      value={form.feed_url}
                      onChange={(e) => handleChange("feed_url", e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opmerking">Opmerking</Label>
                    <Textarea
                      id="opmerking"
                      placeholder="Heb je nog vragen of opmerkingen?"
                      value={form.opmerking}
                      onChange={(e) => handleChange("opmerking", e.target.value)}
                      maxLength={1000}
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 rounded-xl"
                  >
                    {loading ? "Bezig met versturen..." : "Start automatische koppeling"}
                    {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                  <p className="text-center text-muted-foreground text-sm">
                    Wij nemen contact op en regelen de rest
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-14 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 text-center">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-foreground">1.000+</p>
                <p className="text-muted-foreground text-sm mt-1">
                  woningen automatisch gekoppeld
                </p>
              </div>
              <div className="h-10 w-px bg-border hidden md:block" />
              <div>
                <p className="text-3xl md:text-4xl font-bold text-foreground">Dagelijks</p>
                <p className="text-muted-foreground text-sm mt-1">
                  automatisch bijgewerkt
                </p>
              </div>
              <div className="h-10 w-px bg-border hidden md:block" />
              <div>
                <p className="text-3xl md:text-4xl font-bold text-foreground">0 min</p>
                <p className="text-muted-foreground text-sm mt-1">
                  handmatig werk na koppeling
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-bold text-foreground text-center mb-10">
                Veelgestelde vragen
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="bg-card border border-border rounded-xl px-6 overflow-hidden"
                  >
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-16 md:py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Klaar om je woningen automatisch te plaatsen?
            </h2>
            <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
              Geen handmatig invoeren. Geen extra werk. Gewoon koppelen en klaar.
            </p>
            <Button
              size="lg"
              onClick={scrollToForm}
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 rounded-xl"
            >
              Gratis koppelen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default MakelaarKoppelen;
