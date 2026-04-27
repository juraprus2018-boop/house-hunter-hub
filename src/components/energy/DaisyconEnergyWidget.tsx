import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://daisycon.tools/energy-nl/app.js";
const SCRIPT_ID = "daisycon-energy-nl-script";

interface DaisyconEnergyWidgetProps {
  /** Daisycon mediaId – default is WoonPeek's account. */
  mediaId?: number;
  /** Locale, default nl-NL. */
  locale?: string;
  className?: string;
}

/**
 * Embed Daisycon's energy comparison tool. The Daisycon script is loaded
 * once and shared across mount points; on remount we re-trigger init so
 * SPA navigation keeps working.
 */
const DaisyconEnergyWidget = ({
  mediaId = 418821,
  locale = "nl-NL",
  className,
}: DaisyconEnergyWidgetProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const reInit = () => {
      // Daisycon exposes a global initializer; if the script has been loaded
      // before, calling it again re-renders the widget for new mounts.
      const w = window as unknown as {
        Daisycon?: { init?: () => void };
        daisycon?: { init?: () => void };
      };
      try {
        w.Daisycon?.init?.();
        w.daisycon?.init?.();
      } catch {
        // No-op: the script auto-binds new .dc-tool nodes on load anyway.
      }
    };

    if (existing) {
      reInit();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Keep the script cached for subsequent mounts; do not remove.
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      // The widget renders inside this div via Daisycon's bootstrap.
      data-daisycon-energy="true"
    >
      <div
        className="dc-tool dc-energy-tool"
        data-config={JSON.stringify({ mediaId, locale })}
      />
    </div>
  );
};

export default DaisyconEnergyWidget;