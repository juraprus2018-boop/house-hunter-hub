import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScrapedProperty {
  source_url: string;
  source_site: string;
  title: string;
  price: number | null;
  city: string | null;
  postal_code: string | null;
  street: string | null;
  house_number: string | null;
  surface_area: number | null;
  bedrooms: number | null;
  property_type: string | null;
  listing_type: string | null;
  description: string | null;
  images: string[];
  raw_data: Record<string, unknown>;
}

// Wooniezie scraper implementation
async function scrapeWooniezie(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  
  try {
    // Fetch both rental and sale listings
    const urls = [
      "https://www.wooniezie.nl/huurwoningen",
      "https://www.wooniezie.nl/koopwoningen",
    ];

    for (const baseUrl of urls) {
      const listingType = baseUrl.includes("huurwoningen") ? "huur" : "koop";
      
      console.log(`Fetching ${listingType} listings from Wooniezie...`);
      
      const response = await fetch(baseUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${baseUrl}: ${response.status}`);
        continue;
      }

      const html = await response.text();
      
      // Extract property listings using regex patterns
      // Look for property cards with data
      const propertyMatches = html.matchAll(
        /<a[^>]*href="(\/woning\/[^"]+)"[^>]*>[\s\S]*?<\/a>/gi
      );

      for (const match of propertyMatches) {
        const propertyUrl = match[1];
        const fullUrl = `https://www.wooniezie.nl${propertyUrl}`;
        
        // Extract property details from the card
        const cardHtml = match[0];
        
        // Try to extract title
        const titleMatch = cardHtml.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i);
        const title = titleMatch ? titleMatch[1].trim() : "Woning op Wooniezie";

        // Try to extract price
        const priceMatch = cardHtml.match(/€\s*([\d.,]+)/);
        let price: number | null = null;
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(/\./g, "").replace(",", "."));
        }

        // Try to extract city from address
        const cityMatch = cardHtml.match(/(?:in|te)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        const city = cityMatch ? cityMatch[1] : null;

        // Try to extract surface area
        const surfaceMatch = cardHtml.match(/(\d+)\s*m[²2]/);
        const surfaceArea = surfaceMatch ? parseInt(surfaceMatch[1]) : null;

        // Try to extract bedrooms
        const bedroomsMatch = cardHtml.match(/(\d+)\s*(?:slaapkamer|kamer)/i);
        const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : null;

        // Try to extract images
        const imageMatches = cardHtml.matchAll(/src="([^"]+(?:\.jpg|\.png|\.webp)[^"]*)"/gi);
        const images: string[] = [];
        for (const imgMatch of imageMatches) {
          if (!imgMatch[1].includes("placeholder") && !imgMatch[1].includes("logo")) {
            images.push(imgMatch[1]);
          }
        }

        properties.push({
          source_url: fullUrl,
          source_site: "wooniezie",
          title,
          price,
          city,
          postal_code: null,
          street: null,
          house_number: null,
          surface_area: surfaceArea,
          bedrooms,
          property_type: null,
          listing_type: listingType,
          description: null,
          images,
          raw_data: { card_html: cardHtml.substring(0, 1000) },
        });
      }
    }

    console.log(`Scraped ${properties.length} properties from Wooniezie`);
  } catch (error) {
    console.error("Error scraping Wooniezie:", error);
    throw error;
  }

  return properties;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const { scraper_id } = await req.json();

    if (!scraper_id) {
      return new Response(
        JSON.stringify({ success: false, error: "scraper_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get scraper details
    const { data: scraper, error: scraperError } = await supabase
      .from("scrapers")
      .select("*")
      .eq("id", scraper_id)
      .single();

    if (scraperError || !scraper) {
      return new Response(
        JSON.stringify({ success: false, error: "Scraper not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting scraper: ${scraper.name}`);

    let properties: ScrapedProperty[] = [];
    let errorMessage: string | null = null;

    try {
      // Route to appropriate scraper based on name
      if (scraper.name.toLowerCase() === "wooniezie") {
        properties = await scrapeWooniezie();
      } else {
        // Placeholder for other scrapers
        console.log(`No implementation for scraper: ${scraper.name}`);
        properties = [];
      }
    } catch (scrapeError) {
      errorMessage = scrapeError instanceof Error ? scrapeError.message : "Unknown scrape error";
      console.error("Scrape error:", errorMessage);
    }

    const durationMs = Date.now() - startTime;

    // Insert scraped properties into review queue
    if (properties.length > 0) {
      const { error: insertError } = await supabase
        .from("scraped_properties")
        .insert(
          properties.map((p) => ({
            ...p,
            scraper_id,
          }))
        );

      if (insertError) {
        console.error("Error inserting scraped properties:", insertError);
        errorMessage = insertError.message;
      }
    }

    // Log the run
    const logStatus = errorMessage ? "error" : "success";
    const { error: logError } = await supabase.from("scraper_logs").insert({
      scraper_id,
      status: logStatus,
      message: errorMessage || `Scraped ${properties.length} properties`,
      properties_scraped: properties.length,
      duration_ms: durationMs,
    });

    if (logError) {
      console.error("Error creating log:", logError);
    }

    // Update scraper stats
    const { error: updateError } = await supabase
      .from("scrapers")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: logStatus,
        properties_found: (scraper.properties_found || 0) + properties.length,
      })
      .eq("id", scraper_id);

    if (updateError) {
      console.error("Error updating scraper:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: !errorMessage,
        properties_scraped: properties.length,
        duration_ms: durationMs,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in run-scraper:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
