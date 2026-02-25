import { Link } from "react-router-dom";
import { Home, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-semibold">WoonPeek</span>
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
              <li>
                <Link to="/zoeken" className="text-muted-foreground transition-colors hover:text-foreground">
                  Woningen zoeken
                </Link>
              </li>
              <li>
                <Link to="/huurwoningen" className="text-muted-foreground transition-colors hover:text-foreground">
                  Huurwoningen
                </Link>
              </li>
              <li>
                <Link to="/koopwoningen" className="text-muted-foreground transition-colors hover:text-foreground">
                  Koopwoningen
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
                <Link to="/zoekalerts" className="text-muted-foreground transition-colors hover:text-foreground">
                  Zoekalerts
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground transition-colors hover:text-foreground">
                  Blog
                </Link>
              </li>
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
                <Link to="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contact
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
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                020 - 123 4567
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Herengracht 100<br />1015 BS Amsterdam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} WoonPeek. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
