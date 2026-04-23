import { Link } from "react-router-dom";
import { Mail, Facebook, Linkedin, Instagram } from "lucide-react";
import logoWoonpeek from "@/assets/logo-woonpeek-v2.png";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoWoonpeek} alt="Logo WoonPeek" className="h-[250px]" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Vind jouw droomwoning of plaats je eigen woning op WoonPeek. 
              Eenvoudig, snel en betrouwbaar.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display text-sm font-semibold">Snelle links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/zoeken" className="text-muted-foreground transition-colors hover:text-foreground">Woningen zoeken</Link></li>
              <li><Link to="/huurwoningen" className="text-muted-foreground transition-colors hover:text-foreground">Huurwoningen</Link></li>
              <li><Link to="/koopwoningen" className="text-muted-foreground transition-colors hover:text-foreground">Koopwoningen</Link></li>
              <li><Link to="/appartementen" className="text-muted-foreground transition-colors hover:text-foreground">Appartementen</Link></li>
              <li><Link to="/kamers" className="text-muted-foreground transition-colors hover:text-foreground">Kamers</Link></li>
              <li><Link to="/steden" className="text-muted-foreground transition-colors hover:text-foreground">Alle steden</Link></li>
              <li><Link to="/nieuw-aanbod" className="text-muted-foreground transition-colors hover:text-foreground">Nieuw aanbod</Link></li>
              <li><Link to="/woning-plaatsen" className="text-muted-foreground transition-colors hover:text-foreground">Woning plaatsen</Link></li>
              <li><Link to="/blog" className="text-muted-foreground transition-colors hover:text-foreground">Blog</Link></li>
            </ul>
          </div>

          {/* Popular searches */}
          <div className="space-y-4">
            <h4 className="font-display text-sm font-semibold">Populaire zoekopdrachten</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/appartementen/amsterdam" className="text-muted-foreground transition-colors hover:text-foreground">Appartementen Amsterdam</Link></li>
              <li><Link to="/huurwoningen/rotterdam" className="text-muted-foreground transition-colors hover:text-foreground">Huurwoningen Rotterdam</Link></li>
              <li><Link to="/appartementen/utrecht" className="text-muted-foreground transition-colors hover:text-foreground">Appartementen Utrecht</Link></li>
              <li><Link to="/kamers/eindhoven" className="text-muted-foreground transition-colors hover:text-foreground">Kamers Eindhoven</Link></li>
              <li><Link to="/woningen/den-haag/onder-1000" className="text-muted-foreground transition-colors hover:text-foreground">Den Haag onder €1.000</Link></li>
              <li><Link to="/woningen/amsterdam/2-kamers" className="text-muted-foreground transition-colors hover:text-foreground">Amsterdam 2 kamers</Link></li>
              <li><Link to="/huurwoningen/groningen" className="text-muted-foreground transition-colors hover:text-foreground">Huurwoningen Groningen</Link></li>
              <li><Link to="/dagelijkse-alert" className="text-muted-foreground transition-colors hover:text-foreground">Wekelijkse alert</Link></li>
            </ul>
          </div>

          {/* Stadsgidsen & budget landingspaginas */}
          <div className="space-y-4">
            <h4 className="font-display text-sm font-semibold">Stadsgidsen & budget</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/verhuizen-naar-amsterdam" className="text-muted-foreground transition-colors hover:text-foreground">Verhuizen naar Amsterdam</Link></li>
              <li><Link to="/verhuizen-naar-rotterdam" className="text-muted-foreground transition-colors hover:text-foreground">Verhuizen naar Rotterdam</Link></li>
              <li><Link to="/verhuizen-naar-utrecht" className="text-muted-foreground transition-colors hover:text-foreground">Verhuizen naar Utrecht</Link></li>
              <li><Link to="/huurwoningen-onder-1000-amsterdam" className="text-muted-foreground transition-colors hover:text-foreground">Huur onder €1.000 Amsterdam</Link></li>
              <li><Link to="/huurwoningen-onder-1500-rotterdam" className="text-muted-foreground transition-colors hover:text-foreground">Huur onder €1.500 Rotterdam</Link></li>
              <li><Link to="/koopwoningen-onder-300000-utrecht" className="text-muted-foreground transition-colors hover:text-foreground">Koop onder €300k Utrecht</Link></li>
              <li><Link to="/koopwoningen-onder-500000-amsterdam" className="text-muted-foreground transition-colors hover:text-foreground">Koop onder €500k Amsterdam</Link></li>
              <li><Link to="/budget-tool" className="text-muted-foreground transition-colors hover:text-foreground">Budget tool</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-display text-sm font-semibold">Ondersteuning</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/veelgestelde-vragen" className="text-muted-foreground transition-colors hover:text-foreground">
                  Veelgestelde vragen
                </Link>
              </li>
              <li>
                <Link to="/voorwaarden" className="text-muted-foreground transition-colors hover:text-foreground">
                  Algemene voorwaarden
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
                  Privacybeleid
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-muted-foreground transition-colors hover:text-foreground">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/over-woonpeek" className="text-muted-foreground transition-colors hover:text-foreground">
                  Over WoonPeek
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/samenwerking" className="text-muted-foreground transition-colors hover:text-foreground">
                  Samenwerking
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display text-sm font-semibold">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                info@woonpeek.nl
              </li>
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61588380235270"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/woonpeek"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/woonpeek/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Popular cities row for SEO crawlability */}
        <div className="mt-8 border-t pt-6">
          <h4 className="font-display text-sm font-semibold mb-3">Woningen per stad</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {[
              { label: "Amsterdam", href: "/woningen-amsterdam" },
              { label: "Rotterdam", href: "/woningen-rotterdam" },
              { label: "Utrecht", href: "/woningen-utrecht" },
              { label: "Den Haag", href: "/woningen-den-haag" },
              { label: "Eindhoven", href: "/woningen-eindhoven" },
              { label: "Groningen", href: "/woningen-groningen" },
              { label: "Tilburg", href: "/woningen-tilburg" },
              { label: "Almere", href: "/woningen-almere" },
              { label: "Breda", href: "/woningen-breda" },
              { label: "Nijmegen", href: "/woningen-nijmegen" },
              { label: "Arnhem", href: "/woningen-arnhem" },
              { label: "Haarlem", href: "/woningen-haarlem" },
              { label: "Leiden", href: "/woningen-leiden" },
              { label: "Maastricht", href: "/woningen-maastricht" },
              { label: "Delft", href: "/woningen-delft" },
              { label: "Zwolle", href: "/woningen-zwolle" },
              { label: "Apeldoorn", href: "/woningen-apeldoorn" },
              { label: "Amersfoort", href: "/woningen-amersfoort" },
            ].map((city) => (
              <Link key={city.href} to={city.href} className="transition-colors hover:text-foreground">
                {city.label}
              </Link>
            ))}
            <Link to="/steden" className="text-primary transition-colors hover:text-primary/80">
              Alle steden →
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} WoonPeek. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
