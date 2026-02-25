import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, Heart, PlusCircle, User, Menu, LogOut, Shield, Map, Bell, MapPin } from "lucide-react";
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

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/zoeken", label: "Zoeken", icon: Search },
    { to: "/verkennen", label: "Kaart", icon: Map },
    { to: "/steden", label: "Steden", icon: MapPin },
    { to: "/favorieten", label: "Favorieten", icon: Heart },
    { to: "/plaatsen", label: "Woning plaatsen", icon: PlusCircle },
  ];

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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            WoonPeek
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button variant="ghost" className="gap-2">
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-2 md:flex">
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
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" />
                  Inloggen
                </Button>
              </Link>
              <Link to="/registreren">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Registreren
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu openen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-4 pt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-muted"
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
              <div className="my-4 border-t" />
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <Link
                    to="/mijn-woningen"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-muted"
                  >
                    Mijn woningen
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-destructive transition-colors hover:bg-muted"
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
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-colors hover:bg-muted"
                  >
                    <User className="h-5 w-5" />
                    Inloggen
                  </Link>
                  <Link to="/registreren" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
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
