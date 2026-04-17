import { useEffect, useRef } from "react";
import { useAdSlot, type AdSlotKey } from "@/hooks/useAdSlot";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  slotKey: AdSlotKey;
  className?: string;
}

/**
 * Renders an admin-managed Google Ads (AdSense) snippet for a given slot.
 * - Returns nothing if the slot is empty or inactive.
 * - Re-executes inline <script> tags after injection so AdSense can initialize.
 */
const AdSlot = ({ slotKey, className }: AdSlotProps) => {
  const { data } = useAdSlot(slotKey);
  const containerRef = useRef<HTMLDivElement>(null);
  const code = data?.ad_code?.trim();

  useEffect(() => {
    if (!containerRef.current || !code) return;
    const container = containerRef.current;
    container.innerHTML = code;

    // Re-run any <script> tags so AdSense / external ad code actually executes.
    const scripts = Array.from(container.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value),
      );
      newScript.text = oldScript.text;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [code]);

  if (!code) return null;

  return (
    <div className={cn("my-6 flex w-full justify-center", className)} aria-label="Advertentie">
      <div ref={containerRef} className="w-full max-w-3xl" />
    </div>
  );
};

export default AdSlot;
