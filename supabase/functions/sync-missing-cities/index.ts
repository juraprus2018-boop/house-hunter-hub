import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { citySlug } from "./citySlug.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Snapshot of frontend lists (generated; regenerate when src/lib/dutchCities.ts
// or src/lib/municipalities.ts changes).
import knownPlaces from "./known-places.json" with { type: "json" };
const DUTCH_CITIES = knownPlaces.DUTCH_CITIES as string[];
const MUNICIPALITY_KERNEN = knownPlaces.MUNICIPALITY_KERNEN as Record<
  string,
  string[]
>;

interface SyncBody {
  triggered_by?: string;
  auto_add?: boolean;
}

const norm = citySlug;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let body: SyncBody = {};
    try {
      body = await req.json();
    } catch (_) {
      // empty body is fine
    }
    const triggeredBy = body.triggered_by ?? "manual";
    const autoAdd = body.auto_add !== false; // default true

    // 1) Build set of known places (gemeentes + kernen + extra_cities).
    const known = new Set<string>();
    DUTCH_CITIES.forEach((c) => known.add(norm(c)));
    Object.entries(MUNICIPALITY_KERNEN).forEach(([m, kernen]) => {
      known.add(norm(m));
      kernen.forEach((k) => known.add(norm(k)));
    });

    const { data: existingExtra, error: extraErr } = await supabase
      .from("extra_cities")
      .select("id, name");
    if (extraErr) throw extraErr;
    // Map slug -> canonical naam zodat we duplicaten met afwijkende spelling
    // kunnen detecteren én opruimen.
    const extraBySlug = new Map<string, { id: string; name: string }>();
    for (const row of existingExtra ?? []) {
      const key = norm(row.name);
      if (!key) continue;
      if (!extraBySlug.has(key)) {
        extraBySlug.set(key, row);
        known.add(key);
      }
    }

    // 2) Fetch unique cities from active properties (batched, > 1000 default limit).
    const cityCounts = new Map<string, number>();
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("properties")
        .select("city")
        .eq("status", "actief")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const row of data) {
        const city = (row.city ?? "").trim();
        if (!city) continue;
        cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }

    // 3) Bepaal ontbrekende plaatsen — gededupliceerd op slug, anders zou
    //    dezelfde plaats met verschillende spelling meerdere keren opduiken.
    const missingBySlug = new Map<string, { name: string; count: number }>();
    for (const [city, count] of cityCounts.entries()) {
      const key = norm(city);
      if (!key || known.has(key)) continue;
      const existing = missingBySlug.get(key);
      if (existing) {
        existing.count += count;
      } else {
        missingBySlug.set(key, { name: city, count });
      }
    }
    const missing = Array.from(missingBySlug.values()).sort(
      (a, b) => b.count - a.count,
    );

    // 4) Optionally auto-add to extra_cities (upsert by name).
    let added: { name: string; count: number }[] = [];
    if (autoAdd && missing.length > 0) {
      const rows = missing.map((m) => ({
        name: m.name,
        source: triggeredBy === "cron" ? "auto-cron" : "auto-manual",
        property_count: m.count,
        is_visible: true,
      }));
      // Upsert op slug (gegenereerde kolom met UNIQUE-index) zodat varianten
      // van dezelfde plaatsnaam ("'s-Heerenberg" / "S Heerenberg") nooit
      // dubbel landen.
      const { data: upserted, error: upErr } = await supabase
        .from("extra_cities")
        .upsert(rows, { onConflict: "slug" })
        .select("name, property_count");
      if (upErr) throw upErr;
      added = (upserted ?? []).map((r) => ({
        name: r.name,
        count: r.property_count ?? 0,
      }));
    }

    // 5) Log the run.
    const { error: logErr } = await supabase.from("missing_cities_log").insert({
      triggered_by: triggeredBy,
      total_unique_cities: cityCounts.size,
      missing_count: missing.length,
      added_count: added.length,
      missing_cities: missing,
      added_cities: added,
    });
    if (logErr) throw logErr;

    return new Response(
      JSON.stringify({
        ok: true,
        triggered_by: triggeredBy,
        total_unique_cities: cityCounts.size,
        missing_count: missing.length,
        added_count: added.length,
        missing,
        added,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});