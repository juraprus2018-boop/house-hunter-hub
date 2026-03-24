import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PDOK_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

async function geocodeAddress(street: string, houseNumber: string, city: string, postalCode: string): Promise<{ lat: number; lng: number } | null> {
  const hasHouseNumber = houseNumber && houseNumber !== "-";
  
  // Build search queries in order of precision
  const queries: { q: string; filter: string }[] = [];
  
  if (postalCode && postalCode !== "0000AA" && hasHouseNumber) {
    queries.push({ q: `${postalCode} ${houseNumber} ${city}`.trim(), filter: "type:adres" });
  }
  if (street && hasHouseNumber && city) {
    queries.push({ q: `${street} ${houseNumber} ${city}`.trim(), filter: "type:adres" });
  }
  // Fallback: street-level (no house number)
  if (street && city) {
    queries.push({ q: `${street} ${city}`.trim(), filter: "type:weg" });
  }
  // Fallback: postal code area
  if (postalCode && postalCode !== "0000AA") {
    queries.push({ q: `${postalCode} ${city}`.trim(), filter: "type:postcode" });
  }

  for (const { q, filter } of queries) {
    if (!q || q.length < 3) continue;
    try {
      const url = `${PDOK_URL}?q=${encodeURIComponent(q)}&rows=1&fq=${filter}`;
      const resp = await fetch(url);
      if (!resp.ok) continue;

      const data = await resp.json();
      const doc = data?.response?.docs?.[0];
      if (!doc?.centroide_ll) continue;

      const match = doc.centroide_ll.match(/POINT\(([\d.]+)\s+([\d.]+)\)/);
      if (!match) continue;

      return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
    } catch {
      continue;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 200;

    // Get properties without coordinates
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, street, house_number, city, postal_code")
      .is("latitude", null)
      .eq("status", "actief")
      .limit(batchSize);

    if (error) throw error;
    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Alle woningen hebben al coördinaten", geocoded: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let geocoded = 0;
    let failed = 0;

    for (const prop of properties) {
      const result = await geocodeAddress(prop.street, prop.house_number, prop.city, prop.postal_code);
      if (result) {
        await supabase
          .from("properties")
          .update({ latitude: result.lat, longitude: result.lng, updated_at: new Date().toISOString() })
          .eq("id", prop.id);
        geocoded++;
      } else {
        // Set lat/lng to 0 to mark as "tried but failed" so we don't retry
        await supabase
          .from("properties")
          .update({ latitude: 0, longitude: 0, updated_at: new Date().toISOString() })
          .eq("id", prop.id);
        failed++;
      }

      // Small delay to be nice to PDOK API (they allow ~10 req/s)
      if (geocoded % 10 === 0) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // Check remaining
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .is("latitude", null)
      .eq("status", "actief");

    return new Response(
      JSON.stringify({
        success: true,
        geocoded,
        failed,
        remaining: count || 0,
        message: `${geocoded} woningen geocoded, ${failed} mislukt, ${count || 0} resterend`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Geocoding error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
