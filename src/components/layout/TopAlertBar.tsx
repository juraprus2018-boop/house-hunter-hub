import { Link } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useState } from "react";

const TopAlertBar = () => {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem("hideAlertBar") !== "1";
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem("hideAlertBar", "1");
    } catch {}
  };

  return (
    <div className="relative bg-accent text-accent-foreground">
      <div className="container flex items-center justify-center gap-2 py-2 text-sm font-medium">
        <Bell className="h-4 w-4 shrink-0 animate-[wiggle_1s_ease-in-out_infinite]" />
        <span className="hidden sm:inline">
          Mis geen nieuwe woning meer!{" "}
        </span>
        <Link
          to="/dagelijkse-alert"
          className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
        >
          Stel een gratis woningalert in
        </Link>
        <button
          onClick={handleDismiss}
          className="absolute right-3 rounded-full p-1 transition-colors hover:bg-accent-foreground/10"
          aria-label="Sluiten"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default TopAlertBar;
