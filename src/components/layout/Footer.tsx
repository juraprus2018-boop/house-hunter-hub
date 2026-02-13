import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <span className="font-display text-2xl font-semibold text-foreground">
                Woon<span className="text-accent">Peek</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vind jouw droomwoning of plaats je eigen woning op WoonPeek. 
              Eenvoudig, snel en betrouwbaar.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground">Snelle links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/zoeken" className="text-muted-foreground transition-colors hover:text-foreground">
                  Woningen zoeken
                </Link>
              </li>
              <li>
                <Link to="/plaatsen" className="text-muted-foreground transition-colors hover:text-foreground">
                  Woning plaatsen
                </Link>
              </li>
              <li>
                <Link to="/favorieten" className="text-muted-foreground transition-colors hover:text-foreground">
                  Mijn favorieten
                </Link>
              </li>
              <li>
                <Link to="/alerts" className="text-muted-foreground transition-colors hover:text-foreground">
                  Zoekalerts
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground">Ondersteuning</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/help" className="text-muted-foreground transition-colors hover:text-foreground">
                  Help & FAQ
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
                <Link to="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                info@woonpeek.nl
              </li>
              <li className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                020 - 123 4567
              </li>
              <li className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Herengracht 100<br />1015 BS Amsterdam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-border/60 pt-6">
          <p className="text-center text-xs text-muted-foreground tracking-wide">
            © {new Date().getFullYear()} WoonPeek. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
