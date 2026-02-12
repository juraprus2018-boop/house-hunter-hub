import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse optional source_site filter
  let sourceSite: string | null = null;
  try {
    const body = await req.json();
    sourceSite = body.source_site || null;
  } catch {
    // No body or invalid JSON — reset all
  }

  try {
    if (sourceSite) {
      // === Per-source reset ===

      // 1. Delete scraped_properties for this source
      const { error: e1 } = await supabase
        .from("scraped_properties")
        .delete()
        .eq("source_site", sourceSite);
      if (e1) console.error("Delete scraped_properties error:", e1.message);

      // 2. Delete active properties for this source (keep inactief/verlopen)
      const { data: deletedActive, error: e2 } = await supabase
        .from("properties")
        .delete()
        .eq("source_site", sourceSite)
        .in("status", ["actief", "verkocht", "verhuurd"])
        .select("id");
      if (e2) console.error("Delete properties error:", e2.message);

      // 3. Reset properties_found for matching scraper
      const { error: e3 } = await supabase
        .from("scrapers")
        .update({ properties_found: 0 })
        .ilike("name", `%${sourceSite}%`);
      if (e3) console.error("Reset scraper error:", e3.message);

      // 4. Delete logs for matching scraper
      const { data: matchingScrapers } = await supabase
        .from("scrapers")
        .select("id")
        .ilike("name", `%${sourceSite}%`);
      
      if (matchingScrapers && matchingScrapers.length > 0) {
        for (const s of matchingScrapers) {
          await supabase.from("scraper_logs").delete().eq("scraper_id", s.id);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          source: sourceSite,
          active_deleted: deletedActive?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // === Full reset ===

      // 1. Reset properties_found on all scrapers
      const { error: e1 } = await supabase
        .from("scrapers")
        .update({ properties_found: 0 })
        .gte("properties_found", 0);
      if (e1) console.error("Reset scrapers error:", e1.message);

      // 2. Delete all scraped_properties
      const { error: e2 } = await supabase
        .from("scraped_properties")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e2) console.error("Delete scraped_properties error:", e2.message);

      // 3. Delete active properties (keep inactief/verlopen)
      const { data: deletedActive, error: e3 } = await supabase
        .from("properties")
        .delete()
        .in("status", ["actief", "verkocht", "verhuurd"])
        .select("id");
      if (e3) console.error("Delete active properties error:", e3.message);

      // 4. Clear scraper logs
      const { error: e4 } = await supabase
        .from("scraper_logs")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e4) console.error("Delete scraper_logs error:", e4.message);

      return new Response(
        JSON.stringify({
          success: true,
          scrapers_reset: true,
          scraped_properties_cleared: true,
          active_deleted: deletedActive?.length || 0,
          logs_cleared: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
