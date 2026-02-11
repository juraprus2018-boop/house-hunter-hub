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
  console.log(`Fetching: ${url}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    console.log(`Response status for ${url}: ${response.status}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    const html = await response.text();
    console.log(`Fetched ${html.length} characters from ${url}`);
    return html;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function extractPrice(text: string): number | null {
  const match = text.match(/€\s*([\d.,]+)/);
  if (match) {
    const numStr = match[1].replace(/\./g, "").replace(",", ".");
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }
  return null;
}

function deduplicateUrls(properties: ScrapedProperty[]): ScrapedProperty[] {
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

// ============ WORKING SCRAPERS ============

async function scrapePararius(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.pararius.nl/huurwoningen/nederland");

    const listingMatches = html.matchAll(/href="(\/(?:huis|appartement|studio|kamer)-te-huur\/[^"]+\/[a-f0-9-]+\/[^"]+)"/gi);

    for (const match of listingMatches) {
      const url = match[1];
      if (url.includes("/pagina/") || url.includes("?") || url.endsWith("/nederland")) continue;

      const fullUrl = `https://www.pararius.nl${url}`;
      let propertyType = null;
      if (url.includes("/huis-")) propertyType = "huis";
      else if (url.includes("/appartement-")) propertyType = "appartement";
      else if (url.includes("/studio-")) propertyType = "studio";
      else if (url.includes("/kamer-")) propertyType = "kamer";

      const pathParts = url.split("/");
      const city = pathParts.length >= 3 ? pathParts[2] : null;

      properties.push({
        source_url: fullUrl,
        source_site: "pararius",
        title: `Huurwoning ${city || "Pararius"}`,
        price: null,
        city: city ? city.charAt(0).toUpperCase() + city.slice(1) : null,
        postal_code: null, street: null, house_number: null,
        surface_area: null, bedrooms: null,
        property_type: propertyType,
        listing_type: "huur",
        description: null, images: [],
        raw_data: { url },
      });
    }

    console.log(`Pararius: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Pararius:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeKamernet(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://kamernet.nl/huren/kamers-nederland");

    const patterns = [
      /href="(\/huren\/kamer-[^"]+)"/gi,
      /href="(\/en\/for-rent\/room-[^"]+)"/gi,
      /href="(https:\/\/kamernet\.nl\/huren\/kamer-[^"]+)"/gi,
    ];

    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        if (!url.startsWith("http")) url = `https://kamernet.nl${url}`;

        properties.push({
          source_url: url,
          source_site: "kamernet",
          title: "Kamer Kamernet",
          price: null,
          city: null, postal_code: null, street: null, house_number: null,
          surface_area: null, bedrooms: 1,
          property_type: "kamer",
          listing_type: "huur",
          description: null, images: [],
          raw_data: {},
        });
      }
    }

    console.log(`Kamernet: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Kamernet:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeHuurwoningen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.huurwoningen.nl/aanbod-huurwoningen/");

    // Pattern: href="https://www.huurwoningen.nl/huren/amsterdam/98dec08b/haarlemmerweg/"
    const listingMatches = html.matchAll(/href="(https:\/\/www\.huurwoningen\.nl\/huren\/([^\/]+)\/([^\/]+)\/([^\/]+)\/)"/gi);

    for (const match of listingMatches) {
      const fullUrl = match[1];
      const city = match[2];
      const listingId = match[3];
      const street = match[4];

      // Skip duplicates from images + title links
      properties.push({
        source_url: fullUrl,
        source_site: "huurwoningen",
        title: `${street.replace(/-/g, " ")} - ${city}`,
        price: null,
        city: city.charAt(0).toUpperCase() + city.slice(1),
        postal_code: null,
        street: street.replace(/-/g, " "),
        house_number: null,
        surface_area: null, bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null, images: [],
        raw_data: { listingId },
      });
    }

    // Try to extract prices from listing cards
    const priceMatches = html.matchAll(/listing-search-item__price-main[^>]*>([^<]+)</gi);
    const prices: number[] = [];
    for (const pm of priceMatches) {
      const price = extractPrice(pm[1]);
      if (price) prices.push(price);
    }
    // Assign prices to properties in order
    for (let i = 0; i < Math.min(prices.length, properties.length); i++) {
      properties[i].price = prices[i];
    }

    console.log(`Huurwoningen.nl: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Huurwoningen.nl:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeDirectWonen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    // Correct URL: /huurwoningen-huren/nederland (not /huurwoningen which is homepage)
    const html = await fetchPage("https://directwonen.nl/huurwoningen-huren/nederland");

    // Pattern: href="https://directwonen.nl/huurwoningen-huren/amsterdam/ruysdaelkade/appartement-509773"
    const listingMatches = html.matchAll(/href="(https:\/\/directwonen\.nl\/huurwoningen-huren\/([^\/]+)\/([^\/]+)\/([\w]+-\d+))"/gi);

    for (const match of listingMatches) {
      const fullUrl = match[1];
      const city = match[2];
      const street = match[3];
      const typeId = match[4];

      // Skip city-only links (like /huurwoningen-huren/amsterdam)
      if (!street || !typeId) continue;

      // Extract property type from typeId (e.g. "appartement-509773")
      const typePart = typeId.split("-")[0];
      let propertyType = null;
      if (typePart === "appartement") propertyType = "appartement";
      else if (typePart === "woning" || typePart === "huis") propertyType = "huis";
      else if (typePart === "studio") propertyType = "studio";
      else if (typePart === "kamer") propertyType = "kamer";

      properties.push({
        source_url: fullUrl,
        source_site: "directwonen",
        title: `${street.replace(/-/g, " ")}, ${city}`,
        price: null,
        city: city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, " "),
        postal_code: null,
        street: street.replace(/-/g, " "),
        house_number: null,
        surface_area: null, bedrooms: null,
        property_type: propertyType,
        listing_type: "huur",
        description: null, images: [],
        raw_data: { typeId },
      });
    }

    // Extract prices from listing cards: class="advert-location-price"> € 3700
    const priceMatches = html.matchAll(/advert-location-price[^>]*>\s*([^<]+)/gi);
    const prices: number[] = [];
    for (const pm of priceMatches) {
      const price = extractPrice(pm[1]);
      if (price) prices.push(price);
    }
    for (let i = 0; i < Math.min(prices.length, properties.length); i++) {
      properties[i].price = prices[i];
    }

    console.log(`DirectWonen: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping DirectWonen:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeVesteda(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    // Vesteda SSR search page
    const html = await fetchPage("https://www.vesteda.com/nl/huurwoningen");

    // Pattern: href="https://www.vesteda.com/nl/huurwoningen-huizen/huizermaat/herik-6-huizen-1163"
    const listingMatches = html.matchAll(/href="(https:\/\/www\.vesteda\.com\/nl\/huurwoningen-[^"]+\/[^"]+\/[^"]+)"/gi);

    for (const match of listingMatches) {
      const fullUrl = match[1];
      // Skip non-listing links
      if (fullUrl.includes("?") || fullUrl.endsWith("/huurwoningen")) continue;

      properties.push({
        source_url: fullUrl,
        source_site: "vesteda",
        title: "Huurwoning Vesteda",
        price: null,
        city: null, postal_code: null, street: null, house_number: null,
        surface_area: null, bedrooms: null,
        property_type: null,
        listing_type: "huur",
        description: null, images: [],
        raw_data: {},
      });
    }

    // Extract rich data from listing cards
    // Title: <span class="js--map__summary">Herik 6</span>
    const titles = [...html.matchAll(/js--map__summary[^>]*>([^<]+)</gi)].map(m => m[1].trim());
    // Price: <span class="h5 u-bold js--map__price">€ 1430</span>
    const prices = [...html.matchAll(/js--map__price[^>]*>([^<]+)</gi)].map(m => extractPrice(m[1]));
    // City: <span class="...js--map__location">Huizen</span>
    const cities = [...html.matchAll(/js--map__location[^>]*>\s*([^<]+)/gi)].map(m => m[1].trim());
    // Surface: <span class="u-bold js--map__size">96</span>
    const surfaces = [...html.matchAll(/js--map__size[^>]*>(\d+)</gi)].map(m => parseInt(m[1]));
    // Bedrooms: <span class="u-bold js--map__rooms">3</span>
    const bedrooms = [...html.matchAll(/js--map__rooms[^>]*>(\d+)</gi)].map(m => parseInt(m[1]));
    // Type: <span class="js--map__type">Eengezinswoning</span>
    const types = [...html.matchAll(/js--map__type[^>]*>([^<]+)</gi)].map(m => m[1].trim());

    for (let i = 0; i < properties.length; i++) {
      if (titles[i]) properties[i].title = titles[i];
      if (prices[i]) properties[i].price = prices[i];
      if (cities[i]) properties[i].city = cities[i];
      if (surfaces[i]) properties[i].surface_area = surfaces[i];
      if (bedrooms[i]) properties[i].bedrooms = bedrooms[i];
      if (types[i]) {
        const t = types[i].toLowerCase();
        if (t.includes("appartement")) properties[i].property_type = "appartement";
        else if (t.includes("woning") || t.includes("huis")) properties[i].property_type = "huis";
        else if (t.includes("studio")) properties[i].property_type = "studio";
      }
    }

    console.log(`Vesteda: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Vesteda:", e);
  }
  return deduplicateUrls(properties);
}

// ============ BLOCKED SCRAPERS (need headless browser) ============

async function scrapeFunda(): Promise<ScrapedProperty[]> {
  console.log("Funda: Cloudflare-beschermd, kan niet worden gescraped zonder headless browser");
  return [];
}

async function scrapeJaap(): Promise<ScrapedProperty[]> {
  console.log("Jaap.nl: Cloudflare-beschermd, kan niet worden gescraped zonder headless browser");
  return [];
}

async function scrapeHousingAnywhere(): Promise<ScrapedProperty[]> {
  console.log("HousingAnywhere: SPA/JavaScript-gerenderd, kan niet worden gescraped zonder headless browser");
  return [];
}

async function scrape123Wonen(): Promise<ScrapedProperty[]> {
  console.log("123Wonen: Listings worden via JavaScript geladen, kan niet worden gescraped zonder headless browser");
  return [];
}

async function scrapeDeKey(): Promise<ScrapedProperty[]> {
  console.log("De Key: Website geblokkeerd voor scraping");
  return [];
}

async function scrapeNederwoon(): Promise<ScrapedProperty[]> {
  console.log("Nederwoon: Website geeft 404 op alle aanbodpagina's");
  return [];
}

async function scrapeRochdale(): Promise<ScrapedProperty[]> {
  console.log("Rochdale: Woningaanbod pagina geeft 404");
  return [];
}

async function scrapeWoonbron(): Promise<ScrapedProperty[]> {
  console.log("Woonbron: Woningzoeken portaal is JavaScript-gerenderd");
  return [];
}

async function scrapeWoonstadRotterdam(): Promise<ScrapedProperty[]> {
  console.log("Woonstad Rotterdam: Website is JavaScript-gerenderd");
  return [];
}

async function scrapeWooniezie(): Promise<ScrapedProperty[]> {
  console.log("Wooniezie: Website geeft 404 op aanbodpagina's");
  return [];
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

        if (properties.length === 0) {
          errorMessage = `Geen woningen gevonden voor ${scraper.name} - mogelijk geblokkeerd, JS-gerenderd, of website structuur gewijzigd`;
        }
      } else {
        console.log(`No implementation for scraper: ${scraper.name}`);
        errorMessage = `Geen implementatie gevonden voor: ${scraper.name}`;
      }
    } catch (scrapeError) {
      errorMessage = scrapeError instanceof Error ? scrapeError.message : "Unknown scrape error";
      console.error("Scrape error:", errorMessage);
    }

    const durationMs = Date.now() - startTime;

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

    const logStatus = errorMessage ? "error" : (properties.length === 0 ? "warning" : "success");
    await supabase.from("scraper_logs").insert({
      scraper_id,
      status: logStatus,
      message: errorMessage || `Scraped ${properties.length} properties`,
      properties_scraped: properties.length,
      duration_ms: durationMs,
    });

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
        success: !errorMessage && properties.length > 0,
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
