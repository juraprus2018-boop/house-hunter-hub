import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city } = await req.json();
    if (!city || typeof city !== "string" || city.length < 2) {
      return new Response(JSON.stringify({ error: "City is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(JSON.stringify({ error: "Google Places API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we already have realtors for this city (cached within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("city_realtors")
      .select("*")
      .ilike("city", `%${city}%`)
      .gte("updated_at", thirtyDaysAgo)
      .limit(10);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ realtors: existing, source: "cache" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch from Google Places API (Text Search)
    const query = `makelaar ${city} Nederland`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=nl&key=${GOOGLE_PLACES_API_KEY}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.status !== "OK" || !searchData.results?.length) {
      return new Response(JSON.stringify({ realtors: [], source: "google", message: "No results found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Take top 10 results
    const results = searchData.results.slice(0, 10);

    // For each result, try to get details (phone, website)
    const realtors = [];
    for (const place of results) {
      let phone = null;
      let website = null;

      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website&language=nl&key=${GOOGLE_PLACES_API_KEY}`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        if (detailData.result) {
          phone = detailData.result.formatted_phone_number || null;
          website = detailData.result.website || null;
        }
      } catch {
        // Continue without details
      }

      const realtor = {
        city: city,
        name: place.name,
        address: place.formatted_address || null,
        phone,
        website,
        rating: place.rating || null,
        reviews_count: place.user_ratings_total || 0,
        place_id: place.place_id,
        photo_url: place.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          : null,
      };

      realtors.push(realtor);
    }

    // Upsert into database
    if (realtors.length > 0) {
      const { error: upsertError } = await supabase
        .from("city_realtors")
        .upsert(realtors, { onConflict: "place_id" });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
      }
    }

    return new Response(JSON.stringify({ realtors, source: "google" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
