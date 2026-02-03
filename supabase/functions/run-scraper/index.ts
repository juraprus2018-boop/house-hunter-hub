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

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function extractPrice(text: string): number | null {
  const match = text.match(/€\s*([\d.,]+)/);
  if (match) {
    return parseFloat(match[1].replace(/\./g, "").replace(",", "."));
  }
  return null;
}

function extractSurface(text: string): number | null {
  const match = text.match(/(\d+)\s*m[²2]/);
  return match ? parseInt(match[1]) : null;
}

function extractBedrooms(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:slaapkamer|kamer|bedroom)/i);
  return match ? parseInt(match[1]) : null;
}

function extractImages(html: string): string[] {
  const images: string[] = [];
  const matches = html.matchAll(/src="([^"]+(?:\.jpg|\.jpeg|\.png|\.webp)[^"]*)"/gi);
  for (const m of matches) {
    if (!m[1].includes("placeholder") && !m[1].includes("logo") && !m[1].includes("icon")) {
      images.push(m[1]);
    }
  }
  return [...new Set(images)].slice(0, 10);
}

// ============ SCRAPER IMPLEMENTATIONS ============

async function scrapeWooniezie(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  const urls = ["https://www.wooniezie.nl/huurwoningen", "https://www.wooniezie.nl/koopwoningen"];

  for (const baseUrl of urls) {
    const listingType = baseUrl.includes("huurwoningen") ? "huur" : "koop";
    try {
      const html = await fetchPage(baseUrl);
      const matches = html.matchAll(/<a[^>]*href="(\/woning\/[^"]+)"[^>]*>[\s\S]*?<\/a>/gi);
      
      for (const match of matches) {
        const cardHtml = match[0];
        const titleMatch = cardHtml.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i);
        
        properties.push({
          source_url: `https://www.wooniezie.nl${match[1]}`,
          source_site: "wooniezie",
          title: titleMatch ? titleMatch[1].trim() : "Woning Wooniezie",
          price: extractPrice(cardHtml),
          city: null,
          postal_code: null,
          street: null,
          house_number: null,
          surface_area: extractSurface(cardHtml),
          bedrooms: extractBedrooms(cardHtml),
          property_type: null,
          listing_type: listingType,
          description: null,
          images: extractImages(cardHtml),
          raw_data: {},
        });
      }
    } catch (e) {
      console.error(`Error scraping Wooniezie ${listingType}:`, e);
    }
  }
  return properties;
}

async function scrapeFunda(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  const urls = [
    "https://www.funda.nl/zoeken/huur/",
    "https://www.funda.nl/zoeken/koop/",
  ];

  for (const baseUrl of urls) {
    const listingType = baseUrl.includes("/huur") ? "huur" : "koop";
    try {
      const html = await fetchPage(baseUrl);
      // Funda uses data-test-id attributes
      const matches = html.matchAll(/href="(\/(?:huur|koop)\/[^"]+\/\d+[^"]*)"/gi);
      
      for (const match of matches) {
        const url = match[1];
        if (!url.includes("/zoeken/")) {
          properties.push({
            source_url: `https://www.funda.nl${url}`,
            source_site: "funda",
            title: `Woning Funda`,
            price: null,
            city: null,
            postal_code: null,
            street: null,
            house_number: null,
            surface_area: null,
            bedrooms: null,
            property_type: null,
            listing_type: listingType,
            description: null,
            images: [],
            raw_data: { url },
          });
        }
      }
    } catch (e) {
      console.error(`Error scraping Funda ${listingType}:`, e);
    }
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapePararius(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.pararius.nl/huurwoningen/nederland");
    const matches = html.matchAll(/href="(\/huurwoningen\/[^"]+\/[^"]+)"[^>]*>/gi);
    
    for (const match of matches) {
      const url = match[1];
      if (!url.includes("/pagina/") && !url.endsWith("/nederland")) {
        properties.push({
          source_url: `https://www.pararius.nl${url}`,
          source_site: "pararius",
          title: "Huurwoning Pararius",
          price: null,
          city: null,
          postal_code: null,
          street: null,
          house_number: null,
          surface_area: null,
          bedrooms: null,
          property_type: null,
          listing_type: "huur",
          description: null,
          images: [],
          raw_data: {},
        });
      }
    }
  } catch (e) {
    console.error("Error scraping Pararius:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeJaap(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  const urls = [
    "https://www.jaap.nl/te-huur/",
    "https://www.jaap.nl/te-koop/",
  ];

  for (const baseUrl of urls) {
    const listingType = baseUrl.includes("te-huur") ? "huur" : "koop";
    try {
      const html = await fetchPage(baseUrl);
      const matches = html.matchAll(/href="(https:\/\/www\.jaap\.nl\/(?:te-huur|te-koop)\/[^"]+)"/gi);
      
      for (const match of matches) {
        if (!match[1].includes("/pagina/")) {
          properties.push({
            source_url: match[1],
            source_site: "jaap",
            title: `Woning Jaap.nl`,
            price: null,
            city: null,
            postal_code: null,
            street: null,
            house_number: null,
            surface_area: null,
            bedrooms: null,
            property_type: null,
            listing_type: listingType,
            description: null,
            images: [],
            raw_data: {},
          });
        }
      }
    } catch (e) {
      console.error(`Error scraping Jaap ${listingType}:`, e);
    }
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeKamernet(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.kamernet.nl/huren/kamers-nederland");
    const matches = html.matchAll(/href="(\/huren\/kamer-[^"]+)"/gi);
    
    for (const match of matches) {
      properties.push({
        source_url: `https://www.kamernet.nl${match[1]}`,
        source_site: "kamernet",
        title: "Kamer Kamernet",
        price: null,
        city: null,
        postal_code: null,
        street: null,
        house_number: null,
        surface_area: null,
        bedrooms: 1,
        property_type: "kamer",
        listing_type: "huur",
        description: null,
        images: [],
        raw_data: {},
      });
    }
  } catch (e) {
    console.error("Error scraping Kamernet:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrape123Wonen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.123wonen.nl/huurwoningen");
    const matches = html.matchAll(/href="(\/huurwoning\/[^"]+)"/gi);
    
    for (const match of matches) {
      properties.push({
        source_url: `https://www.123wonen.nl${match[1]}`,
        source_site: "123wonen",
        title: "Huurwoning 123Wonen",
        price: null,
        city: null,
        postal_code: null,
        street: null,
        house_number: null,
        surface_area: null,
        bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null,
        images: [],
        raw_data: {},
      });
    }
  } catch (e) {
    console.error("Error scraping 123Wonen:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeDirectWonen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.directwonen.nl/huurwoningen");
    const matches = html.matchAll(/href="(\/huurwoning\/[^"]+)"/gi);
    
    for (const match of matches) {
      properties.push({
        source_url: `https://www.directwonen.nl${match[1]}`,
        source_site: "directwonen",
        title: "Huurwoning DirectWonen",
        price: null,
        city: null,
        postal_code: null,
        street: null,
        house_number: null,
        surface_area: null,
        bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null,
        images: [],
        raw_data: {},
      });
    }
  } catch (e) {
    console.error("Error scraping DirectWonen:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeHuurwoningen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.huurwoningen.nl/aanbod-huurwoningen/");
    const matches = html.matchAll(/href="(\/woning-te-huur\/[^"]+)"/gi);
    
    for (const match of matches) {
      properties.push({
        source_url: `https://www.huurwoningen.nl${match[1]}`,
        source_site: "huurwoningen",
        title: "Huurwoning Huurwoningen.nl",
        price: null,
        city: null,
        postal_code: null,
        street: null,
        house_number: null,
        surface_area: null,
        bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null,
        images: [],
        raw_data: {},
      });
    }
  } catch (e) {
    console.error("Error scraping Huurwoningen.nl:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeHousingAnywhere(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://housinganywhere.com/s/Netherlands");
    const matches = html.matchAll(/href="(\/en\/[^"]*\/[^"]+)"/gi);
    
    for (const match of matches) {
      if (match[1].includes("/room/") || match[1].includes("/apartment/") || match[1].includes("/studio/")) {
        properties.push({
          source_url: `https://housinganywhere.com${match[1]}`,
          source_site: "housinganywhere",
          title: "Woning HousingAnywhere",
          price: null,
          city: null,
          postal_code: null,
          street: null,
          house_number: null,
          surface_area: null,
          bedrooms: null,
          property_type: null,
          listing_type: "huur",
          description: null,
          images: [],
          raw_data: {},
        });
      }
    }
  } catch (e) {
    console.error("Error scraping HousingAnywhere:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeNederwoon(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.nederwoon.nl/huurwoningen/");
    const matches = html.matchAll(/href="(https:\/\/www\.nederwoon\.nl\/huurwoning\/[^"]+)"/gi);
    
    for (const match of matches) {
      properties.push({
        source_url: match[1],
        source_site: "nederwoon",
        title: "Huurwoning Nederwoon",
        price: null,
        city: null,
        postal_code: null,
        street: null,
        house_number: null,
        surface_area: null,
        bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null,
        images: [],
        raw_data: {},
      });
    }
  } catch (e) {
    console.error("Error scraping Nederwoon:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeVesteda(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.vesteda.com/nl/huurwoningen");
    const matches = html.matchAll(/href="(\/nl\/huurwoning\/[^"]+)"/gi);
    
    for (const match of matches) {
      properties.push({
        source_url: `https://www.vesteda.com${match[1]}`,
        source_site: "vesteda",
        title: "Huurwoning Vesteda",
        price: null,
        city: null,
        postal_code: null,
        street: null,
        house_number: null,
        surface_area: null,
        bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null,
        images: [],
        raw_data: {},
      });
    }
  } catch (e) {
    console.error("Error scraping Vesteda:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeDeKey(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.dekey.nl/ik-zoek-een-woning/direct-te-huur");
    const matches = html.matchAll(/href="(\/ik-zoek-een-woning\/woningaanbod\/[^"]+)"/gi);
    
    for (const match of matches) {
      properties.push({
        source_url: `https://www.dekey.nl${match[1]}`,
        source_site: "dekey",
        title: "Huurwoning De Key",
        price: null,
        city: "Amsterdam",
        postal_code: null,
        street: null,
        house_number: null,
        surface_area: null,
        bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null,
        images: [],
        raw_data: {},
      });
    }
  } catch (e) {
    console.error("Error scraping De Key:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeRochdale(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.rochdale.nl/woningaanbod");
    const matches = html.matchAll(/href="(\/woningaanbod\/[^"]+)"/gi);
    
    for (const match of matches) {
      if (!match[1].includes("?")) {
        properties.push({
          source_url: `https://www.rochdale.nl${match[1]}`,
          source_site: "rochdale",
          title: "Huurwoning Rochdale",
          price: null,
          city: "Amsterdam",
          postal_code: null,
          street: null,
          house_number: null,
          surface_area: null,
          bedrooms: null,
          property_type: null,
          listing_type: "huur",
          description: null,
          images: [],
          raw_data: {},
        });
      }
    }
  } catch (e) {
    console.error("Error scraping Rochdale:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeWoonbron(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.woonbron.nl/woningaanbod");
    const matches = html.matchAll(/href="(\/woningaanbod\/woning\/[^"]+)"/gi);
    
    for (const match of matches) {
      properties.push({
        source_url: `https://www.woonbron.nl${match[1]}`,
        source_site: "woonbron",
        title: "Huurwoning Woonbron",
        price: null,
        city: "Rotterdam",
        postal_code: null,
        street: null,
        house_number: null,
        surface_area: null,
        bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null,
        images: [],
        raw_data: {},
      });
    }
  } catch (e) {
    console.error("Error scraping Woonbron:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

async function scrapeWoonstadRotterdam(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.woonstadrotterdam.nl/woningaanbod/");
    const matches = html.matchAll(/href="(https:\/\/www\.woonstadrotterdam\.nl\/woningaanbod\/[^"]+)"/gi);
    
    for (const match of matches) {
      if (!match[1].includes("?")) {
        properties.push({
          source_url: match[1],
          source_site: "woonstad_rotterdam",
          title: "Huurwoning Woonstad Rotterdam",
          price: null,
          city: "Rotterdam",
          postal_code: null,
          street: null,
          house_number: null,
          surface_area: null,
          bedrooms: null,
          property_type: null,
          listing_type: "huur",
          description: null,
          images: [],
          raw_data: {},
        });
      }
    }
  } catch (e) {
    console.error("Error scraping Woonstad Rotterdam:", e);
  }
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

// ============ MAIN HANDLER ============

const scraperMap: Record<string, () => Promise<ScrapedProperty[]>> = {
  "wooniezie": scrapeWooniezie,
  "funda": scrapeFunda,
  "pararius": scrapePararius,
  "jaap.nl": scrapeJaap,
  "kamernet": scrapeKamernet,
  "123wonen": scrape123Wonen,
  "directwonen": scrapeDirectWonen,
  "huurwoningen.nl": scrapeHuurwoningen,
  "housinganywhere": scrapeHousingAnywhere,
  "nederwoon": scrapeNederwoon,
  "vesteda": scrapeVesteda,
  "de key": scrapeDeKey,
  "rochdale": scrapeRochdale,
  "woonbron": scrapeWoonbron,
  "woonstad rotterdam": scrapeWoonstadRotterdam,
};

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
      const scraperName = scraper.name.toLowerCase();
      const scraperFn = scraperMap[scraperName];
      
      if (scraperFn) {
        properties = await scraperFn();
        console.log(`Scraped ${properties.length} properties from ${scraper.name}`);
      } else {
        console.log(`No implementation for scraper: ${scraper.name}`);
        errorMessage = `Geen implementatie gevonden voor: ${scraper.name}`;
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
    await supabase.from("scraper_logs").insert({
      scraper_id,
      status: logStatus,
      message: errorMessage || `Scraped ${properties.length} properties`,
      properties_scraped: properties.length,
      duration_ms: durationMs,
    });

    // Update scraper stats
    await supabase
      .from("scrapers")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: logStatus,
        properties_found: (scraper.properties_found || 0) + properties.length,
      })
      .eq("id", scraper_id);

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
