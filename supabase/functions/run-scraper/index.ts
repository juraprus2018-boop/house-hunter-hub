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
  // Match €1.234 or €1234 or € 1.234,56
  const match = text.match(/€\s*([\d.,]+)/);
  if (match) {
    // Remove dots (thousands separator) and replace comma with dot for decimals
    const numStr = match[1].replace(/\./g, "").replace(",", ".");
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }
  return null;
}

function extractSurface(text: string): number | null {
  const match = text.match(/(\d+)\s*m[²2]/i);
  return match ? parseInt(match[1]) : null;
}

function extractBedrooms(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:slaapkamer|kamer|bedroom)/i);
  return match ? parseInt(match[1]) : null;
}

function deduplicateUrls(properties: ScrapedProperty[]): ScrapedProperty[] {
  return [...new Map(properties.map(p => [p.source_url, p])).values()];
}

// ============ SCRAPER IMPLEMENTATIONS ============

async function scrapePararius(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.pararius.nl/huurwoningen/nederland");
    
    // Pattern: href="/huis-te-huur/city/id/street" or href="/appartement-te-huur/..."
    const listingMatches = html.matchAll(/href="(\/(?:huis|appartement|studio|kamer)-te-huur\/[^"]+\/[a-f0-9-]+\/[^"]+)"/gi);
    
    for (const match of listingMatches) {
      const url = match[1];
      // Skip pagination and filter links
      if (url.includes("/pagina/") || url.includes("?") || url.endsWith("/nederland")) continue;
      
      const fullUrl = `https://www.pararius.nl${url}`;
      
      // Extract property type from URL
      let propertyType = null;
      if (url.includes("/huis-")) propertyType = "huis";
      else if (url.includes("/appartement-")) propertyType = "appartement";
      else if (url.includes("/studio-")) propertyType = "studio";
      else if (url.includes("/kamer-")) propertyType = "kamer";
      
      // Try to extract city from URL path
      const pathParts = url.split("/");
      const city = pathParts.length >= 3 ? pathParts[2] : null;
      
      properties.push({
        source_url: fullUrl,
        source_site: "pararius",
        title: `Huurwoning ${city || "Pararius"}`,
        price: null,
        city: city ? city.charAt(0).toUpperCase() + city.slice(1) : null,
        postal_code: null,
        street: null,
        house_number: null,
        surface_area: null,
        bedrooms: null,
        property_type: propertyType,
        listing_type: "huur",
        description: null,
        images: [],
        raw_data: { url },
      });
    }
    
    console.log(`Pararius: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Pararius:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeFunda(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  const urls = [
    { url: "https://www.funda.nl/zoeken/huur/", type: "huur" },
    { url: "https://www.funda.nl/zoeken/koop/", type: "koop" },
  ];

  for (const { url: baseUrl, type: listingType } of urls) {
    try {
      const html = await fetchPage(baseUrl);
      
      // Funda uses data-test-id or paths like /huur/amsterdam/appartement-12345678/
      // Also look for links in format: /detail/huur/... or /huur/city/type-id/
      const patterns = [
        /href="(\/(?:huur|koop)\/[^\/]+\/[^\/]+-\d+[^"]*)"/gi,
        /href="(\/detail\/(?:huur|koop)\/[^"]+)"/gi,
      ];
      
      for (const pattern of patterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const path = match[1];
          if (path.includes("/zoeken/") || path.includes("/kaart/")) continue;
          
          properties.push({
            source_url: `https://www.funda.nl${path}`,
            source_site: "funda",
            title: "Woning Funda",
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
            raw_data: { path },
          });
        }
      }
    } catch (e) {
      console.error(`Error scraping Funda ${listingType}:`, e);
    }
  }
  
  console.log(`Funda: found ${properties.length} listings`);
  return deduplicateUrls(properties);
}

async function scrape123Wonen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.123wonen.nl/huurwoningen");
    
    // Look for property detail links
    const patterns = [
      /href="(\/huurwoning\/[^"]+)"/gi,
      /href="(https:\/\/www\.123wonen\.nl\/huurwoning\/[^"]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        if (!url.startsWith("http")) {
          url = `https://www.123wonen.nl${url}`;
        }
        
        properties.push({
          source_url: url,
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
    }
    
    console.log(`123Wonen: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping 123Wonen:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeDirectWonen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.directwonen.nl/huurwoningen");
    
    const patterns = [
      /href="(\/huurwoning\/[^"]+)"/gi,
      /href="(https:\/\/www\.directwonen\.nl\/huurwoning\/[^"]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        if (!url.startsWith("http")) {
          url = `https://www.directwonen.nl${url}`;
        }
        
        properties.push({
          source_url: url,
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
    }
    
    console.log(`DirectWonen: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping DirectWonen:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeHuurwoningen(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.huurwoningen.nl/aanbod-huurwoningen/");
    
    const patterns = [
      /href="(\/woning-te-huur\/[^"]+)"/gi,
      /href="(https:\/\/www\.huurwoningen\.nl\/woning-te-huur\/[^"]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        if (!url.startsWith("http")) {
          url = `https://www.huurwoningen.nl${url}`;
        }
        
        properties.push({
          source_url: url,
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
    }
    
    console.log(`Huurwoningen.nl: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Huurwoningen.nl:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeKamernet(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://kamernet.nl/huren/kamers-nederland");
    
    // Kamernet uses various URL patterns
    const patterns = [
      /href="(\/huren\/kamer-[^"]+)"/gi,
      /href="(\/en\/for-rent\/room-[^"]+)"/gi,
      /href="(https:\/\/kamernet\.nl\/huren\/kamer-[^"]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        if (!url.startsWith("http")) {
          url = `https://kamernet.nl${url}`;
        }
        
        properties.push({
          source_url: url,
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
    }
    
    console.log(`Kamernet: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Kamernet:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeHousingAnywhere(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://housinganywhere.com/s/Netherlands");
    
    // Housing Anywhere uses /en/city/listing-id patterns
    const patterns = [
      /href="(\/[a-z]{2}\/[^\/]+\/[^\/]+\/[a-f0-9-]+)"/gi,
      /href="(https:\/\/housinganywhere\.com\/[a-z]{2}\/[^"]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        // Skip non-listing pages
        if (url.includes("/s/") || url.includes("/search") || url.includes("/login")) continue;
        
        if (!url.startsWith("http")) {
          url = `https://housinganywhere.com${url}`;
        }
        
        properties.push({
          source_url: url,
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
    
    console.log(`HousingAnywhere: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping HousingAnywhere:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeJaap(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  const urls = [
    { url: "https://www.jaap.nl/te-huur", type: "huur" },
    { url: "https://www.jaap.nl/te-koop", type: "koop" },
  ];

  for (const { url: baseUrl, type: listingType } of urls) {
    try {
      const html = await fetchPage(baseUrl);
      
      // Jaap uses full URLs or /te-huur/city/address patterns
      const patterns = [
        /href="(https:\/\/www\.jaap\.nl\/te-(?:huur|koop)\/[^"]+\/[^"]+\/[^"]+)"/gi,
        /href="(\/te-(?:huur|koop)\/[^"]+\/[^"]+\/[^"]+)"/gi,
      ];
      
      for (const pattern of patterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          let url = match[1];
          if (url.includes("/pagina/")) continue;
          
          if (!url.startsWith("http")) {
            url = `https://www.jaap.nl${url}`;
          }
          
          properties.push({
            source_url: url,
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
  
  console.log(`Jaap.nl: found ${properties.length} listings`);
  return deduplicateUrls(properties);
}

async function scrapeVesteda(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    // Vesteda has a consumer-facing listings page
    const html = await fetchPage("https://www.vesteda.com/nl/huurwoningen");
    
    // Look for property detail links
    const patterns = [
      /href="(\/nl\/huurwoning\/[^"]+)"/gi,
      /href="(\/nl\/woningaanbod\/[^"]+)"/gi,
      /href="(https:\/\/www\.vesteda\.com\/nl\/huurwoning\/[^"]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        if (!url.startsWith("http")) {
          url = `https://www.vesteda.com${url}`;
        }
        
        properties.push({
          source_url: url,
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
    }
    
    console.log(`Vesteda: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Vesteda:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeNederwoon(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.nederwoon.nl/huurwoningen/");
    
    const patterns = [
      /href="(https:\/\/www\.nederwoon\.nl\/huurwoning\/[^"]+)"/gi,
      /href="(\/huurwoning\/[^"]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        if (!url.startsWith("http")) {
          url = `https://www.nederwoon.nl${url}`;
        }
        
        properties.push({
          source_url: url,
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
    }
    
    console.log(`Nederwoon: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Nederwoon:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeDeKey(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.dekey.nl/ik-zoek-een-woning/direct-te-huur");
    
    const patterns = [
      /href="(\/ik-zoek-een-woning\/woningaanbod\/[^"]+)"/gi,
      /href="(\/huurwoning\/[^"]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        if (!url.startsWith("http")) {
          url = `https://www.dekey.nl${url}`;
        }
        
        properties.push({
          source_url: url,
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
    }
    
    console.log(`De Key: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping De Key:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeRochdale(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.rochdale.nl/woningaanbod");
    
    const patterns = [
      /href="(\/woningaanbod\/[^"?]+)"/gi,
      /href="(https:\/\/www\.rochdale\.nl\/woningaanbod\/[^"?]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        // Skip if it's just the main page
        if (url === "/woningaanbod" || url === "/woningaanbod/") continue;
        
        if (!url.startsWith("http")) {
          url = `https://www.rochdale.nl${url}`;
        }
        
        properties.push({
          source_url: url,
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
    
    console.log(`Rochdale: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Rochdale:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeWoonbron(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    // Woonbron moved to a different domain for searching
    const html = await fetchPage("https://woningzoeken.woonbron.nl/");
    
    const patterns = [
      /href="(\/woning\/[^"]+)"/gi,
      /href="(https:\/\/woningzoeken\.woonbron\.nl\/woning\/[^"]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        if (!url.startsWith("http")) {
          url = `https://woningzoeken.woonbron.nl${url}`;
        }
        
        properties.push({
          source_url: url,
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
    }
    
    console.log(`Woonbron: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Woonbron:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeWoonstadRotterdam(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  try {
    const html = await fetchPage("https://www.woonstadrotterdam.nl/woningaanbod/");
    
    const patterns = [
      /href="(https:\/\/www\.woonstadrotterdam\.nl\/woningaanbod\/[^"?]+)"/gi,
      /href="(\/woningaanbod\/[^"?]+)"/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let url = match[1];
        // Skip main page
        if (url === "/woningaanbod" || url === "/woningaanbod/" || url.endsWith("/woningaanbod/")) continue;
        
        if (!url.startsWith("http")) {
          url = `https://www.woonstadrotterdam.nl${url}`;
        }
        
        properties.push({
          source_url: url,
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
    
    console.log(`Woonstad Rotterdam: found ${properties.length} listings`);
  } catch (e) {
    console.error("Error scraping Woonstad Rotterdam:", e);
  }
  return deduplicateUrls(properties);
}

async function scrapeWooniezie(): Promise<ScrapedProperty[]> {
  const properties: ScrapedProperty[] = [];
  
  // Wooniezie changed their URL structure
  const urls = [
    { url: "https://www.wooniezie.nl/aanbod/nu-te-huur/te-huur", type: "huur" },
    { url: "https://www.wooniezie.nl/aanbod/nu-te-koop/te-koop", type: "koop" },
  ];

  for (const { url: baseUrl, type: listingType } of urls) {
    try {
      const html = await fetchPage(baseUrl);
      
      const patterns = [
        /href="(\/woning\/[^"]+)"/gi,
        /href="(\/aanbod\/[^"]+\/[^"]+\/[^"]+)"/gi,
      ];
      
      for (const pattern of patterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          let url = match[1];
          // Skip filter/pagination links
          if (url.includes("pagina=") || url === "/aanbod/nu-te-huur/te-huur" || url === "/aanbod/nu-te-koop/te-koop") continue;
          
          if (!url.startsWith("http")) {
            url = `https://www.wooniezie.nl${url}`;
          }
          
          properties.push({
            source_url: url,
            source_site: "wooniezie",
            title: `Woning Wooniezie`,
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
      console.error(`Error scraping Wooniezie ${listingType}:`, e);
    }
  }
  
  console.log(`Wooniezie: found ${properties.length} listings`);
  return deduplicateUrls(properties);
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
        
        // If we got 0 properties, log it as a warning
        if (properties.length === 0) {
          errorMessage = `Geen woningen gevonden voor ${scraper.name} - mogelijk geblokkeerd of website structuur gewijzigd`;
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

    // Log the run - mark as error if 0 properties found
    const logStatus = errorMessage ? "error" : (properties.length === 0 ? "warning" : "success");
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
