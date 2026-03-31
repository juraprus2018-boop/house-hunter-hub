import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Search, Heart, PlusCircle, User, Menu, LogOut, Shield, Map, Bell,
  MapPin, CalendarDays, Home, Building2, DoorOpen, BedDouble, ChevronDown,
  ChevronRight, Handshake, MessageCircle
} from "lucide-react";
import logoWoonpeek from "@/assets/logo-woonpeek-v2.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cityToSlug } from "@/lib/cities";

const topCities = [
  "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven",
  "Groningen", "Leiden", "Breda", "Tilburg", "Nijmegen",
  "Arnhem", "Haarlem",
];

const woningCategories = [
  {
    label: "Huurwoningen",
    href: "/huurwoningen",
    icon: Home,
    description: "Alle huurwoningen in Nederland",
    cityPrefix: "/huurwoningen",
  },
  {
    label: "Koopwoningen",
    href: "/koopwoningen",
    icon: Home,
    description: "Alle koopwoningen in Nederland",
    cityPrefix: "/koopwoningen",
  },
  {
    label: "Appartementen",
    href: "/appartementen",
    icon: Building2,
    description: "Appartementen huren & kopen",
    cityPrefix: "/appartementen",
  },
  {
    label: "Huizen",
    href: "/huizen",
    icon: Home,
    description: "Eengezinswoningen & villa's",
    cityPrefix: "/huizen",
  },
  {
    label: "Kamers",
    href: "/kamers",
    icon: DoorOpen,
    description: "Kamers voor studenten & starters",
    cityPrefix: "/kamers",
  },
  {
    label: "Studio's",
    href: "/studios",
    icon: BedDouble,
    description: "Compacte zelfstandige woonruimtes",
    cityPrefix: "/studios",
  },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openMobileCategory, setOpenMobileCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState(woningCategories[0]);
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src={logoWoonpeek} alt="Logo WoonPeek" className="h-[55px]" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-0.5 lg:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-0">
              {/* Woningen Mega Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="gap-1.5 bg-transparent text-sm font-medium">
                  <Search className="h-4 w-4" />
                  Woningen
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[540px] grid-cols-2 gap-0 p-0">
                    {/* Left column: Categories */}
                    <div className="border-r p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Woningtype
                      </p>
                      <ul className="space-y-1">
                        {woningCategories.map((cat) => (
                          <li key={cat.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={cat.href}
                                onMouseEnter={() => setHoveredCategory(cat)}
                                className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted ${hoveredCategory.href === cat.href ? 'bg-muted' : ''}`}
                              >
                                <cat.icon className={`h-4 w-4 transition-colors ${hoveredCategory.href === cat.href ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                                <div>
                                  <span className="font-medium">{cat.label}</span>
                                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Right column: Dynamic cities based on hovered category */}
                    <div className="p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Populaire steden
                      </p>
                      <ul className="space-y-0.5">
                        {topCities.map((city) => (
                          <li key={city}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={`${hoveredCategory.cityPrefix}/${cityToSlug(city)}`}
                                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                              >
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>{hoveredCategory.label} {city}</span>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/steden"
                        className="mt-3 flex items-center gap-1 px-3 text-xs font-medium text-primary hover:underline"
                      >
                        Alle steden bekijken
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Nieuw aanbod */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/nieuw-aanbod"
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <CalendarDays className="mr-1.5 h-4 w-4" />
                    Nieuw aanbod
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Kaart */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/verkennen"
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <Map className="mr-1.5 h-4 w-4" />
                    Kaart
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Steden */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/steden"
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <MapPin className="mr-1.5 h-4 w-4" />
                    Steden
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Alert */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/dagelijkse-alert"
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <Bell className="mr-1.5 h-4 w-4" />
                    Alert
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Voor makelaars */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/makelaar-koppelen"
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <Handshake className="mr-1.5 h-4 w-4" />
                    Voor makelaars
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Woning plaatsen CTA */}
          <Link to="/woning-plaatsen">
            <Button
              variant={!user ? "default" : "ghost"}
              size="sm"
              className={!user ? "ml-1 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90" : "ml-1 gap-1.5"}
            >
              <PlusCircle className="h-4 w-4" />
              Woning plaatsen
            </Button>
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-2 lg:flex" style={{ minHeight: '40px' }}>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.email || "U")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-muted-foreground text-sm">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/mijn-woningen">Mijn woningen</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favorieten">Mijn favorieten</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/zoekalerts" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Zoekalerts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/berichten" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Berichten
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profiel" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Mijn profiel
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/inloggen">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <User className="h-4 w-4" />
                  Inloggen
                </Button>
              </Link>
              <Link to="/registreren">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Registreren
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu openen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto">
            <nav className="flex flex-col gap-1 pt-8">
              {/* Search */}
              <Link
                to="/zoeken"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
              >
                <Search className="h-5 w-5" />
                Woning zoeken
              </Link>

              {/* Woningtypes with collapsible city lists */}
              {woningCategories.map((cat) => (
                <Collapsible
                  key={cat.href}
                  open={openMobileCategory === cat.href}
                  onOpenChange={(open) => setOpenMobileCategory(open ? cat.href : null)}
                >
                  <div className="flex items-center">
                    <Link
                      to={cat.href}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
                    >
                      <cat.icon className="h-5 w-5" />
                      {cat.label}
                    </Link>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <ChevronDown className={`h-4 w-4 transition-transform ${openMobileCategory === cat.href ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="ml-8 space-y-0.5 pb-2">
                      {topCities.slice(0, 8).map((city) => (
                        <Link
                          key={city}
                          to={`${cat.cityPrefix}/${cityToSlug(city)}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <MapPin className="h-3 w-3" />
                          {city}
                        </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}

              <div className="my-2 border-t" />

              {/* Other links */}
              <Link
                to="/nieuw-aanbod"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
              >
                <CalendarDays className="h-5 w-5" />
                Nieuw aanbod
              </Link>
              <Link
                to="/verkennen"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
              >
                <Map className="h-5 w-5" />
                Kaart
              </Link>
              <Link
                to="/steden"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
              >
                <MapPin className="h-5 w-5" />
                Steden
              </Link>
              <Link
                to="/dagelijkse-alert"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
              >
                <Bell className="h-5 w-5" />
                Woningalert
              </Link>
              <Link
                to="/favorieten"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
              >
                <Heart className="h-5 w-5" />
                Favorieten
              </Link>

              <Link
                to="/makelaar-koppelen"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
              >
                <Handshake className="h-5 w-5" />
                Voor makelaars
              </Link>

              <Link
                to="/woning-plaatsen"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2.5 font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <PlusCircle className="h-5 w-5" />
                Woning plaatsen
              </Link>

              <div className="my-2 border-t" />

              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <Link
                    to="/mijn-woningen"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
                  >
                    Mijn woningen
                  </Link>
                  <Link
                    to="/profiel"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
                  >
                    <User className="h-5 w-5" />
                    Mijn profiel
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
                    >
                      <Shield className="h-5 w-5" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-destructive transition-colors hover:bg-muted"
                  >
                    <LogOut className="h-5 w-5" />
                    Uitloggen
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/inloggen"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
                  >
                    <User className="h-5 w-5" />
                    Inloggen
                  </Link>
                  <Link to="/registreren" onClick={() => setIsOpen(false)}>
                    <Button className="mt-1 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Registreren
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
