import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAISYCON_TOKEN_URL = "https://login.daisycon.com/oauth/access-token";
const DAISYCON_CLI_REDIRECT = "https://login.daisycon.com/oauth/cli";
const SYSTEM_USER_ID = "0d02a609-fde3-435a-9154-078fdce7ed34";

async function getValidAccessToken(supabase: any): Promise<string> {
  const { data: tokenRow, error } = await supabase
    .from("daisycon_tokens")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !tokenRow) {
    throw new Error("Daisycon not connected. Please authenticate first.");
  }

  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() < expiresAt - 2 * 60 * 1000) {
    return tokenRow.access_token;
  }

  console.log("Refreshing Daisycon access token...");
  const clientId = Deno.env.get("DAISYCON_CLIENT_ID")!;
  const clientSecret = Deno.env.get("DAISYCON_CLIENT_SECRET")!;

  const tokenResponse = await fetch(DAISYCON_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: DAISYCON_CLI_REDIRECT,
      refresh_token: tokenRow.refresh_token,
    }),
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(`Token refresh failed [${tokenResponse.status}]: ${errText}`);
  }

  const newTokens = await tokenResponse.json();

  await supabase
    .from("daisycon_tokens")
    .update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: new Date(Date.now() + 29 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", tokenRow.id);

  return newTokens.access_token;
}

interface DaisyconProduct {
  // Standard datafeed fields
  title?: string;
  description?: string;
  price?: number | string;
  price_old?: number | string;
  link?: string;
  link_url?: string;
  deeplink?: string;
  url?: string;
  affiliate_url?: string;
  click_url?: string;
  tracking_url?: string;
  link_to_product?: string;
  product_url?: string;
  image_url?: string;
  image_large?: string;
  image_url_large?: string;
  additional_image_urls?: string[];
  extra_image_url_1?: string;
  extra_image_url_2?: string;
  extra_image_url_3?: string;
  city?: string;
  address?: string;
  street?: string;
  house_number?: string;
  housenumber?: string;
  zipcode?: string;
  postal_code?: string;
  postcode?: string;
  surface?: number | string;
  surface_area?: number | string;
  living_area?: number | string;
  floor_area?: number | string;
  woonoppervlakte?: string;
  rooms?: number | string;
  number_of_rooms?: number | string;
  bedrooms?: number | string;
  number_of_bedrooms?: number | string;
  slaapkamers?: string;
  bathrooms?: number | string;
  property_type?: string;
  type_of_property?: string;
  type?: string;
  category?: string;
  listing_type?: string;
  contract_type?: string;
  rent_buy?: string;
  soort_aanbod?: string;
  in_stock?: string;
  sku?: string;
  daisycon_unique_id?: string;
  province?: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  lon?: number | string;
  geo_lat?: number | string;
  geo_lng?: number | string;
  geo_latitude?: number | string;
  geo_longitude?: number | string;
  build_year?: number | string;
  construction_year?: number | string;
  bouwjaar?: number | string;
  year_built?: number | string;
  energy_label?: string;
  energy_class?: string;
  energielabel?: string;
  energy_rating?: string;
  [key: string]: unknown;
}

function flattenProduct(raw: any): DaisyconProduct {
  // Handle nested format: { update_info: {}, product_info: {} }
  if (raw.product_info && typeof raw.product_info === "object") {
    const merged = { ...raw.product_info };
    if (raw.update_info) {
      merged.daisycon_unique_id = raw.update_info.daisycon_unique_id;
    }
    return merged as DaisyconProduct;
  }
  return raw as DaisyconProduct;
}

function extractProducts(feedData: any): DaisyconProduct[] {
  let rawProducts: any[] = [];

  if (Array.isArray(feedData)) {
    rawProducts = feedData;
  } else if (feedData.datafeed?.programs) {
    // Format: { datafeed: { programs: [{ products: [...] }] } }
    for (const prog of feedData.datafeed.programs) {
      if (prog.products && Array.isArray(prog.products)) {
        rawProducts.push(...prog.products);
      }
    }
  } else if (feedData.datafeed?.product_info) {
    const pi = feedData.datafeed.product_info;
    rawProducts = Array.isArray(pi) ? pi : [pi];
  } else if (feedData.product_info) {
    const pi = feedData.product_info;
    rawProducts = Array.isArray(pi) ? pi : [pi];
  } else if (feedData.products) {
    rawProducts = feedData.products;
  } else if (feedData.items) {
    rawProducts = feedData.items;
  } else if (feedData.datafeed) {
    const df = feedData.datafeed;
    rawProducts = Array.isArray(df) ? df : [df];
  }

  return rawProducts.map(flattenProduct);
}

function buildAffiliateLink(product: DaisyconProduct, feedMediaId: number, feedProgramId: number): string | null {
  // Check for existing affiliate link in product data
  const existing = product.link || product.link_url || product.deeplink || 
    product.url || product.affiliate_url || product.click_url ||
    product.tracking_url || product.link_to_product || product.product_url;
  if (existing && typeof existing === "string") return existing;

  // Build Daisycon tracking link from SKU/unique ID
  const uniqueId = product.daisycon_unique_id || product.sku;
  if (uniqueId) {
    return `https://ds1.nl/c/?wi=${feedMediaId}&si=${feedProgramId}&li=${uniqueId}&ws=`;
  }

  return null;
}

function mapDaisyconToProperty(product: DaisyconProduct, sourceSite: string, sourceUrl: string) {
  const price = parseFloat(String(product.price || "0")) || 0;
  const street = product.street || product.address || "";
  const houseNumber = product.house_number || product.housenumber || "";
  const city = product.city || "";
  const postalCode = product.zipcode || product.postal_code || product.postcode || "";
  const surface = parseInt(String(
    product.floor_area || product.surface || product.surface_area || 
    product.living_area || product.woonoppervlakte || "0"
  )) || null;
  const bedrooms = parseInt(String(
    product.number_of_bedrooms || product.bedrooms || product.slaapkamers || 
    product.number_of_rooms || product.rooms || "0"
  )) || null;
  const bathrooms = parseInt(String(product.bathrooms || "0")) || null;

  // Extract coordinates
  const lat = parseFloat(String(
    product.latitude || product.lat || product.geo_lat || product.geo_latitude || "0"
  )) || null;
  const lng = parseFloat(String(
    product.longitude || product.lng || product.lon || product.geo_lng || product.geo_longitude || "0"
  )) || null;

  // Extract build year
  const buildYear = parseInt(String(
    product.build_year || product.construction_year || product.bouwjaar || product.year_built || "0"
  )) || null;

  // Extract energy label
  const rawEnergy = String(
    product.energy_label || product.energy_class || product.energielabel || product.energy_rating || ""
  ).toUpperCase().trim();
  const validLabels = ["A++", "A+", "A", "B", "C", "D", "E", "F", "G"];
  const energyLabel = validLabels.includes(rawEnergy) ? rawEnergy : null;

  // Determine listing type
  let listingType: "huur" | "koop" = "huur";
  const rentBuy = String(
    product.contract_type || product.rent_buy || product.listing_type || 
    product.soort_aanbod || product.category || ""
  ).toLowerCase();
  if (rentBuy.includes("koop") || rentBuy.includes("buy") || rentBuy.includes("sale")) {
    listingType = "koop";
  }

  // Determine property type
  let propertyType: "appartement" | "huis" | "studio" | "kamer" = "appartement";
  const pType = String(
    product.type_of_property || product.property_type || product.type || product.category || ""
  ).toLowerCase();
  if (pType.includes("huis") || pType.includes("house") || pType.includes("woning") || pType.includes("villa") || pType.includes("tussenwoning") || pType.includes("hoekwoning")) {
    propertyType = "huis";
  } else if (pType.includes("studio")) {
    propertyType = "studio";
  } else if (pType.includes("kamer") || pType.includes("room")) {
    propertyType = "kamer";
  }

  // Collect images - check many common Daisycon field naming patterns
  const images: string[] = [];
  
  // Handle "images" field (Daisycon standard_id=20 format)
  let rawImages: any = product.images;
  if (rawImages) {
    // Unwrap { img: [...] } or { img: { location: "..." } } format
    if (!Array.isArray(rawImages) && typeof rawImages === "object" && rawImages.img) {
      rawImages = Array.isArray(rawImages.img) ? rawImages.img : [rawImages.img];
    }
    
    if (Array.isArray(rawImages)) {
      for (const img of rawImages) {
        if (typeof img === "string" && img) {
          images.push(img);
        } else if (img && typeof img === "object") {
          // Daisycon format: { location: "https://...", size: "large", tag: "detail" }
          const imgUrl = (img as any).location || (img as any).url || (img as any).image || 
                         (img as any).src || (img as any).image_url;
          if (typeof imgUrl === "string" && imgUrl) images.push(imgUrl);
        }
      }
    } else if (typeof rawImages === "string" && rawImages) {
      const urls = rawImages.includes(",") ? rawImages.split(",") : 
                   rawImages.includes("|") ? rawImages.split("|") : [rawImages];
      for (const u of urls) {
        const trimmed = u.trim();
        if (trimmed) images.push(trimmed);
      }
    }
  }

  // Fallback: check individual image fields
  if (images.length === 0) {
    const mainImage = product.image_large || product.image_url_large || product.image_url;
    if (mainImage && typeof mainImage === "string") images.push(mainImage);
    if (product.additional_image_urls && Array.isArray(product.additional_image_urls)) {
      images.push(...product.additional_image_urls.filter((u: unknown) => typeof u === "string" && u).slice(0, 9));
    }
    // Check image_url_1..20, extra_image_url_1..20, image_1..20
    for (let i = 1; i <= 20; i++) {
      const extraImg = product[`image_url_${i}`] || product[`extra_image_url_${i}`] || product[`image_${i}`];
      if (typeof extraImg === "string" && extraImg && !images.includes(extraImg)) images.push(extraImg);
    }
  }

  // Build a descriptive title instead of using generic ones like "appartement"
  const rawTitle = product.title || "";
  const genericTitles = ["appartement", "huis", "studio", "kamer", "woning", "room", "house", "apartment"];
  const isGeneric = !rawTitle || genericTitles.includes(rawTitle.trim().toLowerCase());

  let title: string;
  if (isGeneric) {
    const typeLabel = propertyType === "huis" ? "Huis" : propertyType === "studio" ? "Studio" : propertyType === "kamer" ? "Kamer" : "Appartement";
    const actionLabel = listingType === "koop" ? "te koop" : "te huur";
    if (street && city) {
      title = `${typeLabel} ${actionLabel} aan ${street}${houseNumber ? ` ${houseNumber}` : ""}, ${city}`;
    } else if (city) {
      title = `${typeLabel} ${actionLabel} in ${city}`;
    } else {
      title = `${typeLabel} ${actionLabel}`;
    }
  } else {
    title = rawTitle;
  }

  return {
    title,
    street: street || "Onbekend",
    house_number: houseNumber || "-",
    city: city || "Onbekend",
    postal_code: postalCode || "0000AA",
    price,
    listing_type: listingType,
    property_type: propertyType,
    surface_area: surface,
    bedrooms,
    bathrooms,
    latitude: lat,
    longitude: lng,
    build_year: buildYear,
    energy_label: energyLabel,
    description: product.description || null,
    images,
    source_url: sourceUrl,
    source_site: sourceSite,
    user_id: SYSTEM_USER_ID,
    status: "actief" as const,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const publisherId = Deno.env.get("DAISYCON_PUBLISHER_ID");

    if (!publisherId) {
      throw new Error("DAISYCON_PUBLISHER_ID not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const feedId = body.feed_id;

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase);

    // Get active feeds
    let feedQuery = supabase.from("daisycon_feeds").select("*").eq("is_active", true);
    if (feedId) {
      feedQuery = feedQuery.eq("id", feedId);
    }
    const { data: feeds, error: feedsErr } = await feedQuery;
    if (feedsErr) throw feedsErr;

    if (!feeds || feeds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active feeds to import", imported: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create import job for progress tracking
    const { data: job } = await supabase
      .from("import_jobs")
      .insert({
        type: "daisycon",
        status: "running",
        feed_id: feedId || null,
        total_feeds: feeds.length,
        processed_feeds: 0,
        message: `Importeren van ${feeds.length} feed(s)...`,
      })
      .select("id")
      .single();
    const jobId = job?.id;

    let totalImported = 0;
    let totalSkipped = 0;
    let totalUpdated = 0;
    let totalDeactivated = 0;
    const results: { feed: string; imported: number; updated: number; skipped: number; deactivated: number; error?: string }[] = [];
    // Collect all active source URLs across all feeds for deactivation check
    const allActiveSourceUrls = new Set<string>();

    for (let feedIndex = 0; feedIndex < feeds.length; feedIndex++) {
      const feed = feeds[feedIndex];
      // Update job progress
      if (jobId) {
        await supabase.from("import_jobs").update({
          processed_feeds: feedIndex,
          feed_name: feed.name,
          message: `Bezig met feed "${feed.name}" (${feedIndex + 1}/${feeds.length})...`,
          imported: totalImported,
          updated: totalUpdated,
          skipped: totalSkipped,
        }).eq("id", jobId);
      }
      try {
        let feedUrl = feed.feed_url;
        let responseText = "";

        if (feedUrl) {
          // Use the custom feed URL, but request JSON format
          const urlObj = new URL(feedUrl);
          urlObj.searchParams.set("type", "json");
          feedUrl = urlObj.toString();

          console.log(`Importing feed: ${feed.name} (custom URL)`);
          console.log(`Feed URL: ${feedUrl}`);

          const feedResponse = await fetch(feedUrl, { headers: { Accept: "application/json" } });
          if (!feedResponse.ok) {
            const errText = await feedResponse.text();
            console.error(`Feed fetch failed for ${feed.name}: ${feedResponse.status} - ${errText.substring(0, 500)}`);
            results.push({ feed: feed.name, imported: 0, skipped: 0, error: `HTTP ${feedResponse.status}` });
            continue;
          }
          responseText = await feedResponse.text();
        } else {
          // Try multiple standard_ids to find the one that works
          const standardIds = [1, 20, 2, 3, 4, 5, 10, 15];
          let found = false;
          for (const stdId of standardIds) {
            const tryUrl = `https://daisycon.io/datafeed/?program_id=${feed.program_id}&media_id=${feed.media_id}&standard_id=${stdId}&language_code=nl&locale_id=1&type=json&rawdata=false&encoding=utf8`;
            console.log(`Trying feed: ${feed.name} with standard_id=${stdId}`);
            const feedResponse = await fetch(tryUrl, { headers: { Accept: "application/json" } });
            if (feedResponse.status === 200) {
              const text = await feedResponse.text();
              if (text.length > 10 && (text.startsWith('[') || text.startsWith('{'))) {
                responseText = text;
                feedUrl = tryUrl;
                found = true;
                console.log(`Found working feed for ${feed.name} with standard_id=${stdId}`);
                break;
              }
            } else {
              await feedResponse.text(); // drain
            }
          }
          if (!found) {
            console.error(`No working feed found for ${feed.name} across standard_ids`);
            results.push({ feed: feed.name, imported: 0, skipped: 0, error: "Geen werkende feed URL gevonden" });
            continue;
          }
        }

        console.log(`Feed URL: ${feedUrl}`);

        let feedData: any;
        try {
          feedData = JSON.parse(responseText);
        } catch {
          console.error(`Feed ${feed.name}: Response is not valid JSON. First 500 chars: ${responseText.substring(0, 500)}`);
          results.push({ feed: feed.name, imported: 0, skipped: 0, error: "Response is not valid JSON" });
          continue;
        }

        const products = extractProducts(feedData);

        console.log(`Feed ${feed.name}: ${products.length} products found`);
        if (products.length > 0) {
          const sampleKeys = Object.keys(products[0]);
          console.log(`Feed ${feed.name}: Sample product keys: ${sampleKeys.join(", ")}`);
          // Log geo/building related keys
          const geoKeys = sampleKeys.filter(k => /lat|lng|lon|geo|coord|build|year|bouw|energy|energi|label/i.test(k));
          console.log(`Feed ${feed.name}: Geo/building keys: ${JSON.stringify(geoKeys)}`);
          for (const k of geoKeys) {
            console.log(`Feed ${feed.name}: ${k} = ${JSON.stringify(products[0][k])}`);
          }
          // Log image and all keys
          const imageKeys = sampleKeys.filter(k => /image|img|photo|picture|foto/i.test(k));
          console.log(`Feed ${feed.name}: Image-related keys: ${JSON.stringify(imageKeys)}`);
          // Log first 3000 chars of first product to see ALL available fields
          console.log(`Feed ${feed.name}: First product sample: ${JSON.stringify(products[0]).substring(0, 3000)}`);
        }

        if (products.length === 0) {
          console.log(`Feed ${feed.name}: No products. Response keys: ${Object.keys(feedData).join(", ")}`);
          results.push({ feed: feed.name, imported: 0, skipped: 0, error: "No products in feed" });
          continue;
        }

        let imported = 0;
        let skipped = 0;
        let updated = 0;

        // Map all products to property data
        const allPropertyData: any[] = [];
        for (const product of products) {
          const sourceUrl = buildAffiliateLink(product, feed.media_id, feed.program_id);
          if (!sourceUrl) {
            skipped++;
            continue;
          }
          const propData = mapDaisyconToProperty(product, feed.name, sourceUrl);
          allPropertyData.push(propData);
          allActiveSourceUrls.add(sourceUrl);
        }

        console.log(`Feed ${feed.name}: ${allPropertyData.length} valid products to process`);

        // Get all existing source_urls for this feed in one query
        const sourceUrls = allPropertyData.map(p => p.source_url);
        const existingMap = new Map<string, { id: string; status: string; images: string[]; title: string; latitude: number | null; longitude: number | null; build_year: number | null; energy_label: string | null }>();
        
        // Query in batches of 500 (Supabase IN filter limit)
        for (let i = 0; i < sourceUrls.length; i += 500) {
          const batch = sourceUrls.slice(i, i + 500);
          const { data: existingRows } = await supabase
            .from("properties")
            .select("id, source_url, status, images, title, latitude, longitude, build_year, energy_label")
            .in("source_url", batch);
          if (existingRows) {
            for (const row of existingRows) {
              existingMap.set(row.source_url!, { id: row.id, status: row.status, images: row.images || [], title: row.title, latitude: row.latitude, longitude: row.longitude, build_year: row.build_year, energy_label: row.energy_label });
            }
          }
        }

        console.log(`Feed ${feed.name}: ${existingMap.size} existing properties found`);

        // Separate new inserts from updates
        const toInsert: any[] = [];
        const genericTitles = ["appartement", "huis", "studio", "kamer", "woning", "room", "house", "apartment"];

        for (const propData of allPropertyData) {
          const existing = existingMap.get(propData.source_url);
          if (existing) {
            const updates: Record<string, any> = {};
            const hasNoImages = existing.images.length === 0 || 
              (existing.images.length === 1 && existing.images[0] === "");
            if (hasNoImages && propData.images.length > 0) {
              updates.images = propData.images;
            }
            if (existing.title && genericTitles.includes(existing.title.trim().toLowerCase())) {
              updates.title = propData.title;
            }
            // Fill in missing geo/building data
            if (!existing.latitude && propData.latitude) {
              updates.latitude = propData.latitude;
              updates.longitude = propData.longitude;
            }
            if (!existing.build_year && propData.build_year) {
              updates.build_year = propData.build_year;
            }
            if (!existing.energy_label && propData.energy_label) {
              updates.energy_label = propData.energy_label;
            }
            if (Object.keys(updates).length > 0) {
              updates.updated_at = new Date().toISOString();
              await supabase.from("properties").update(updates).eq("id", existing.id);
              updated++;
            } else {
              skipped++;
            }
          } else {
            toInsert.push(propData);
          }
        }

        // Batch insert new properties in chunks of 100
        console.log(`Feed ${feed.name}: inserting ${toInsert.length} new properties in batches...`);
        for (let i = 0; i < toInsert.length; i += 100) {
          const batch = toInsert.slice(i, i + 100);
          const { error: batchErr, data: insertedData } = await supabase
            .from("properties")
            .insert(batch)
            .select("id");
          
          if (batchErr) {
            console.error(`Batch insert error at ${i}: ${batchErr.message}`);
            // Fallback: try individual inserts for this batch
            for (const item of batch) {
              const { error: singleErr } = await supabase.from("properties").insert(item);
              if (singleErr) {
                console.error(`Single insert error: ${singleErr.message} - ${item.title}`);
                skipped++;
              } else {
                imported++;
              }
            }
          } else {
            imported += insertedData?.length || batch.length;
          }

          // Update job progress periodically
          if (jobId && i % 500 === 0) {
            await supabase.from("import_jobs").update({
              imported: totalImported + imported,
              updated: totalUpdated + updated,
              skipped: totalSkipped + skipped,
              message: `Feed "${feed.name}": ${imported + updated + skipped}/${allPropertyData.length} verwerkt...`,
            }).eq("id", jobId);
          }
        }

        // Update feed stats
        await supabase
          .from("daisycon_feeds")
          .update({
            last_import_at: new Date().toISOString(),
            properties_imported: (feed.properties_imported || 0) + imported,
            updated_at: new Date().toISOString(),
          })
          .eq("id", feed.id);

        totalImported += imported;
        totalSkipped += skipped;
        totalUpdated += updated;
        results.push({ feed: feed.name, imported, updated, skipped });

        console.log(`Feed ${feed.name}: ${imported} imported, ${updated} updated with images, ${skipped} skipped`);
      } catch (feedErr) {
        const msg = feedErr instanceof Error ? feedErr.message : "Unknown error";
        console.error(`Error processing feed ${feed.name}:`, msg);
        results.push({ feed: feed.name, imported: 0, skipped: 0, error: msg });
      }
    }

    // Mark job as completed
    if (jobId) {
      await supabase.from("import_jobs").update({
        status: "completed",
        processed_feeds: feeds.length,
        imported: totalImported,
        updated: totalUpdated,
        skipped: totalSkipped,
        message: `Klaar: ${totalImported} nieuw, ${totalUpdated} bijgewerkt, ${totalSkipped} overgeslagen`,
        completed_at: new Date().toISOString(),
      }).eq("id", jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_imported: totalImported,
        total_updated: totalUpdated,
        total_skipped: totalSkipped,
        job_id: jobId,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daisycon import error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
