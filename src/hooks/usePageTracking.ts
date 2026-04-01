import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const getSessionId = () => {
  let sid = sessionStorage.getItem("wp_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("wp_session_id", sid);
  }
  return sid;
};

export const usePageTracking = () => {
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    if (fullPath === lastPath.current) return;

    // Skip admin pages, preview params, and Lovable internal routes
    if (
      location.pathname.startsWith("/admin") ||
      location.search.includes("forceHideBadge") ||
      location.pathname.includes("lovable")
    ) return;

    lastPath.current = fullPath;

    const sessionId = getSessionId();
    supabase.from("page_views").insert({
      session_id: sessionId,
      page_url: fullPath,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    } as any).then(() => {});
  }, [location.pathname, location.search]);
};

export const trackDaisyconClick = async (propertyId: string, sourceUrl: string, sourceSite: string | null) => {
  const sessionId = sessionStorage.getItem("wp_session_id") || "unknown";
  await supabase.from("daisycon_clicks").insert({
    property_id: propertyId,
    session_id: sessionId,
    source_url: sourceUrl,
    source_site: sourceSite,
    page_url: window.location.pathname,
  } as any);
};
