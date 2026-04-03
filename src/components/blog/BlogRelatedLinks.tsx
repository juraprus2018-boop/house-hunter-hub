import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CITY_LINKS = [
  { label: "Amsterdam", href: "/woningen-amsterdam" },
  { label: "Rotterdam", href: "/woningen-rotterdam" },
  { label: "Utrecht", href: "/woningen-utrecht" },
  { label: "Den Haag", href: "/woningen-den-haag" },
  { label: "Eindhoven", href: "/woningen-eindhoven" },
  { label: "Groningen", href: "/woningen-groningen" },
];

const CATEGORY_LINKS = [
  { label: "Huurwoningen", href: "/huurwoningen" },
  { label: "Koopwoningen", href: "/koopwoningen" },
  { label: "Appartementen", href: "/appartementen" },
  { label: "Kamers", href: "/kamers" },
  { label: "Nieuw aanbod", href: "/nieuw-aanbod" },
  { label: "Dagelijkse alert", href: "/dagelijkse-alert" },
];

const TOOL_LINKS = [
  { label: "Woningen zoeken", href: "/zoeken" },
  { label: "Budget tool", href: "/budget-tool" },
  { label: "Huurprijsmonitor", href: "/huurprijsmonitor" },
  { label: "Alle steden", href: "/steden" },
];

const BlogRelatedLinks = () => {
  return (
    <aside className="border-t py-10">
      <div className="container max-w-4xl">
        <h2 className="font-display text-xl font-bold text-foreground mb-6">
          Meer op WoonPeek
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Cities */}
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">
              Populaire steden
            </h3>
            <ul className="space-y-2 text-sm">
              {CITY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    Woningen in {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/steden"
                  className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline"
                >
                  Alle steden <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">
              Categorieën
            </h3>
            <ul className="space-y-2 text-sm">
              {CATEGORY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">
              Handige tools
            </h3>
            <ul className="space-y-2 text-sm">
              {TOOL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline"
                >
                  Meer artikelen <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default BlogRelatedLinks;
