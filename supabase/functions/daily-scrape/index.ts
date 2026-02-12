import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_USER_ID = "0d02a609-fde3-435a-9154-078fdce7ed34";
const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: Record<string, string> = {};

  try {
    // 1. Get all active scrapers
    const { data: scrapers, error: scrapersError } = await supabase
      .from("scrapers")
      .select("*")
      .eq("is_active", true);

    if (scrapersError) throw scrapersError;

    console.log(`Found ${scrapers?.length || 0} active scrapers`);

    // 2. Run each scraper via the run-scraper function
    for (const scraper of scrapers || []) {
      try {
        console.log(`Running scraper: ${scraper.name}`);
        const response = await fetch(`${supabaseUrl}/functions/v1/run-scraper`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ scraper_id: scraper.id }),
        });

        const result = await response.json();
        results[scraper.name] = `${result.properties_scraped || 0} scraped`;
        console.log(`${scraper.name}: ${JSON.stringify(result)}`);
      } catch (e) {
        results[scraper.name] = `error: ${e instanceof Error ? e.message : "unknown"}`;
        console.error(`Error running ${scraper.name}:`, e);
      }
    }

    // 3. Auto-publish all pending scraped properties
    const { data: pending, error: pendingError } = await supabase
      .from("scraped_properties")
      .select("*")
      .eq("status", "pending");

    if (pendingError) throw pendingError;

    let published = 0;
    let skipped = 0;

    for (const sp of pending || []) {
      // Skip if missing required fields
      if (!sp.title || !sp.city || !sp.street || !sp.house_number || !sp.postal_code || !sp.price) {
        skipped++;
        continue;
      }

      // Check for duplicate by source_url in already-published properties
      const { data: existing } = await supabase
        .from("scraped_properties")
        .select("id")
        .eq("source_url", sp.source_url)
        .eq("status", "approved")
        .limit(1);

      if (existing && existing.length > 0) {
        // Already published, just update last_seen_at
        await supabase
          .from("scraped_properties")
          .update({ status: "approved", last_seen_at: new Date().toISOString() })
          .eq("id", sp.id);
        continue;
      }

      // Map property_type to valid enum
      let propertyType = "appartement";
      if (["appartement", "huis", "studio", "kamer"].includes(sp.property_type || "")) {
        propertyType = sp.property_type!;
      }

      let listingType = "huur";
      if (["huur", "koop"].includes(sp.listing_type || "")) {
        listingType = sp.listing_type!;
      }

      // Extract extra fields from raw_data
      const rawData = (sp.raw_data || {}) as Record<string, unknown>;
      
      // Energy label mapping
      const validEnergyLabels = ["A++", "A+", "A", "B", "C", "D", "E", "F", "G"];
      let energyLabel: string | null = null;
      const rawEnergyLabel = (rawData.energy_label || "") as string;
      if (rawEnergyLabel) {
        // Clean up: "Energielabel A++" -> "A++", "A" -> "A"
        const cleaned = rawEnergyLabel.replace(/energielabel\s*/i, "").trim().toUpperCase();
        if (validEnergyLabels.includes(cleaned)) {
          energyLabel = cleaned;
        }
      }
      
      // Build year
      const buildYear = rawData.build_year ? Number(rawData.build_year) : null;
      
      // Bathrooms from raw_data or scraped_properties
      const bathrooms = sp.bathrooms || (rawData.bathrooms ? Number(rawData.bathrooms) : null);

      // Geocode address
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const address = `${sp.street} ${sp.house_number}, ${sp.postal_code} ${sp.city}, Netherlands`;
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          { headers: { "User-Agent": "WoningPlatform/1.0" } }
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          latitude = parseFloat(geoData[0].lat);
          longitude = parseFloat(geoData[0].lon);
        }
      } catch (e) {
        console.warn(`Geocoding failed for ${sp.title}:`, e);
      }

      // Insert into properties
      const { data: newProp, error: insertError } = await supabase
        .from("properties")
        .insert({
          title: sp.title,
          description: sp.description || null,
          price: sp.price,
          city: sp.city,
          street: sp.street,
          house_number: sp.house_number,
          postal_code: sp.postal_code,
          property_type: propertyType,
          listing_type: listingType,
          bedrooms: sp.bedrooms || null,
          bathrooms: bathrooms,
          surface_area: sp.surface_area || null,
          images: sp.images || [],
          user_id: SYSTEM_USER_ID,
          status: "actief",
          latitude,
          longitude,
          energy_label: energyLabel,
          build_year: buildYear && buildYear > 1800 && buildYear < 2030 ? buildYear : null,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(`Failed to publish ${sp.title}:`, insertError.message);
        skipped++;
        continue;
      }

      // Mark scraped property as approved
      await supabase
        .from("scraped_properties")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: SYSTEM_USER_ID,
          published_property_id: newProp.id,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", sp.id);

      published++;
    }

    console.log(`Auto-publish: ${published} published, ${skipped} skipped`);

    // 4. Deactivate properties not seen for 3+ weeks
    const threeWeeksAgo = new Date(Date.now() - THREE_WEEKS_MS).toISOString();

    // Find scraped properties that haven't been seen for 3 weeks
    const { data: staleScraped } = await supabase
      .from("scraped_properties")
      .select("published_property_id")
      .eq("status", "approved")
      .lt("last_seen_at", threeWeeksAgo)
      .not("published_property_id", "is", null);

    let deactivated = 0;
    if (staleScraped && staleScraped.length > 0) {
      const staleIds = staleScraped
        .map((s) => s.published_property_id)
        .filter(Boolean) as string[];

      if (staleIds.length > 0) {
        const { error: deactivateError } = await supabase
          .from("properties")
          .update({ status: "inactief" })
          .in("id", staleIds)
          .eq("status", "actief");

        if (!deactivateError) {
          deactivated = staleIds.length;
        }
        console.log(`Deactivated ${deactivated} stale properties`);
      }
    }

    // 5. Update last_seen_at for properties that ARE still in the current scrape
    // (already handled during insert - new ones get current timestamp)

    return new Response(
      JSON.stringify({
        success: true,
        scrapers: results,
        auto_published: published,
        skipped,
        deactivated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in daily-scrape:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
