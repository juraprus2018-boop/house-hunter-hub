/**
 * Gedeelde TikTok helpers: caption + hashtags + token refresh.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface TikTokTokenRow {
  id: string;
  open_id: string;
  display_name: string | null;
  access_token: string;
  refresh_token: string;
  scope: string | null;
  expires_at: string;
  refresh_expires_at: string | null;
}

export function fmtPriceNL(price: number, listingType: string): string {
  const v = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return listingType === "huur" ? `${v}/mnd` : v;
}

export function buildCaption(p: {
  city: string;
  price: number;
  listing_type: string;
  surface_area?: number | null;
  bedrooms?: number | null;
  property_type?: string | null;
}): string {
  const cleanCity = p.city.toLowerCase().replace(/[^a-z0-9]/g, "");
  const tags = [
    "#woonpeek",
    "#woningnederland",
    p.listing_type === "huur" ? "#huurwoning" : "#koopwoning",
    p.listing_type === "huur" ? "#tehuur" : "#tekoop",
    `#${cleanCity}`,
    `#wonenin${cleanCity}`,
    "#nederland",
    "#vastgoed",
    "#dreamhome",
    "#fyp",
  ].join(" ");
  const type = p.listing_type === "huur" ? "Te huur" : "Te koop";
  return [
    `🏡 ${type} in ${p.city}`,
    `💰 ${fmtPriceNL(p.price, p.listing_type)}${p.surface_area ? ` · ${p.surface_area} m²` : ""}${p.bedrooms != null ? ` · ${p.bedrooms} slpk` : ""}`,
    "",
    "👉 Volledige info via WoonPeek.nl (link in bio)",
    "",
    tags,
  ].join("\n");
}

/**
 * Haalt huidige token op en ververst automatisch als verlopen (of binnen 5 min).
 */
export async function getValidTikTokToken(supabaseUrl: string, serviceKey: string): Promise<TikTokTokenRow> {
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("tiktok_oauth_tokens")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`DB error: ${error.message}`);
  if (!data) throw new Error("No TikTok account connected. Visit /admin/tiktok to connect.");

  const expiresMs = new Date(data.expires_at).getTime();
  const needsRefresh = expiresMs - Date.now() < 5 * 60 * 1000;

  if (!needsRefresh) return data as TikTokTokenRow;

  // Refresh
  const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
  const clientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET");
  if (!clientKey || !clientSecret) throw new Error("TIKTOK_CLIENT_KEY/SECRET not configured");

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: data.refresh_token,
  });

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`TikTok refresh failed: ${JSON.stringify(json)}`);
  }

  const updated = {
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? data.refresh_token,
    scope: json.scope ?? data.scope,
    expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    refresh_expires_at: json.refresh_expires_in
      ? new Date(Date.now() + json.refresh_expires_in * 1000).toISOString()
      : data.refresh_expires_at,
  };

  const { data: row, error: upErr } = await sb
    .from("tiktok_oauth_tokens")
    .update(updated)
    .eq("id", data.id)
    .select()
    .single();

  if (upErr) throw new Error(`Failed to save refreshed token: ${upErr.message}`);
  return row as TikTokTokenRow;
}