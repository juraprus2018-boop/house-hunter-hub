import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAISYCON_TOKEN_URL = "https://login.daisycon.com/oauth/access-token";
const DAISYCON_CLI_REDIRECT = "https://login.daisycon.com/oauth/cli";
const WOONIEZIE_API_RENT = "https://www.wooniezie.nl/portal/object/frontend/getallobjects/format/json?configurationKey=rent";
const WOONIEZIE_BASE = "https://www.wooniezie.nl";

async function getValidAccessToken(supabase: any): Promise<string | null> {
  const { data: tokenRow, error } = await supabase
    .from("daisycon_tokens")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !tokenRow) return null;

  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() < expiresAt - 2 * 60 * 1000) {
    return tokenRow.access_token;
  }

  // Refresh token
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
    await tokenResponse.text();
    return null;
  }

  const newTokens = await tokenResponse.json();
  await supabase
    .from("daisycon_tokens")
    .update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokenRow.refresh_token,
      expires_at: new Date(Date.now() + (newTokens.expires_in || 1800) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", tokenRow.id);

  return newTokens.access_token;
}

function extractProducts(feedData: any): any[] {
  let rawProducts: any[] = [];
  if (Array.isArray(feedData)) {
    rawProducts = feedData;
  } else if (feedData.datafeed?.programs) {
    for (const prog of feedData.datafeed.programs) {
      if (prog.products && Array.isArray(prog.products)) rawProducts.push(...prog.products);
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
  // Flatten nested product_info
  return rawProducts.map((raw: any) => {
    if (raw.product_info && typeof raw.product_info === "object") {
      const merged = { ...raw.product_info };
      if (raw.update_info) merged.daisycon_unique_id = raw.update_info.daisycon_unique_id;
      return merged;
    }
    return raw;
  });
}

function buildAffiliateLink(product: any, feedMediaId: number, feedProgramId: number): string | null {
  const existing = product.link || product.link_url || product.deeplink ||
    product.url || product.affiliate_url || product.click_url ||
    product.tracking_url || product.link_to_product || product.product_url;
  if (existing && typeof existing === "string") return existing;
  const uniqueId = product.daisycon_unique_id || product.sku;
  if (uniqueId) return `https://ds1.nl/c/?wi=${feedMediaId}&si=${feedProgramId}&li=${uniqueId}&ws=`;
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

    let totalDeactivated = 0;
    const details: { source: string; deactivated: number; error?: string }[] = [];

    // ─── 1. Daisycon deactivation ───
    try {
      const accessToken = await getValidAccessToken(supabase);
      if (!accessToken) {
        details.push({ source: "Daisycon", deactivated: 0, error: "Geen geldige token" });
      } else {
        const { data: feeds } = await supabase
          .from("daisycon_feeds")
          .select("*")
          .eq("is_active", true);

        if (feeds && feeds.length > 0) {
          const activeSourceUrls = new Set<string>();
          const feedNames: string[] = [];

          for (const feed of feeds) {
            feedNames.push(feed.name);
            try {
              let responseText = "";
              if (feed.feed_url) {
                const urlObj = new URL(feed.feed_url);
                urlObj.searchParams.set("type", "json");
                const resp = await fetch(urlObj.toString(), { headers: { Accept: "application/json" } });
                if (resp.ok) {
                  responseText = await resp.text();
                } else {
                  await resp.text();
                  continue;
                }
              } else {
                const standardIds = [1, 20, 2, 3, 4, 5, 10, 15];
                for (const stdId of standardIds) {
                  const tryUrl = `https://daisycon.io/datafeed/?program_id=${feed.program_id}&media_id=${feed.media_id}&standard_id=${stdId}&language_code=nl&locale_id=1&type=json&rawdata=false&encoding=utf8`;
                  const resp = await fetch(tryUrl, { headers: { Accept: "application/json" } });
                  if (resp.status === 200) {
                    const text = await resp.text();
                    if (text.length > 10 && (text.startsWith('[') || text.startsWith('{'))) {
                      responseText = text;
                      break;
                    }
                  } else {
                    await resp.text();
                  }
                }
              }

              if (!responseText) continue;

              let feedData: any;
              try { feedData = JSON.parse(responseText); } catch { continue; }

              const products = extractProducts(feedData);
              console.log(`Deactivation check: Feed ${feed.name} has ${products.length} products`);

              for (const product of products) {
                const url = buildAffiliateLink(product, feed.media_id, feed.program_id);
                if (url) activeSourceUrls.add(url);
              }
            } catch (e) {
              console.error(`Error fetching feed ${feed.name} for deactivation:`, e);
            }
          }

          // Deactivate properties not in any feed
          console.log(`Daisycon: ${activeSourceUrls.size} active URLs across ${feedNames.length} feeds`);
          
          // SAFETY: Skip deactivation for feeds that returned 0 products
          // This prevents mass deactivation when a feed API is temporarily down
          const feedsWithProducts = new Set<string>();
          for (const url of activeSourceUrls) {
            for (const name of feedNames) {
              // If we found at least one URL for this feed, it's working
              feedsWithProducts.add(name);
            }
          }
          const feedsWithoutProducts = feedNames.filter(n => !feedsWithProducts.has(n));
          if (feedsWithoutProducts.length > 0) {
            console.log(`Daisycon: Skipping deactivation for feeds with 0 products: ${feedsWithoutProducts.join(', ')}`);
          }
          // Only deactivate from feeds that actually returned products
          const feedsToDeactivate = feedNames.filter(n => feedsWithProducts.has(n));
          
          let daisyconDeactivated = 0;
          const pageSize = 1000;
          let from = 0;

          while (true) {
            const { data: existingProps, error: fetchErr } = await supabase
              .from("properties")
              .select("id, source_url")
              .in("source_site", feedNames)
              .eq("status", "actief")
              .range(from, from + pageSize - 1);

            if (fetchErr || !existingProps || existingProps.length === 0) break;

            // Batch deactivation: collect IDs to deactivate
            const idsToDeactivate: string[] = [];
            for (const prop of existingProps) {
              if (prop.source_url && !activeSourceUrls.has(prop.source_url)) {
                idsToDeactivate.push(prop.id);
              }
            }

            // Deactivate in batches of 100
            for (let i = 0; i < idsToDeactivate.length; i += 100) {
              const batch = idsToDeactivate.slice(i, i + 100);
              await supabase
                .from("properties")
                .update({ status: "inactief", updated_at: new Date().toISOString() })
                .in("id", batch);
              daisyconDeactivated += batch.length;
            }

            if (existingProps.length < pageSize) break;
            from += pageSize;
          }

          totalDeactivated += daisyconDeactivated;
          details.push({ source: "Daisycon", deactivated: daisyconDeactivated });
          console.log(`Daisycon: ${daisyconDeactivated} properties deactivated`);
        } else {
          details.push({ source: "Daisycon", deactivated: 0, error: "Geen actieve feeds" });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Daisycon deactivation error:", msg);
      details.push({ source: "Daisycon", deactivated: 0, error: msg });
    }

    // ─── 2. Wooniezie deactivation ───
    try {
      const resp = await fetch(WOONIEZIE_API_RENT, { headers: { Accept: "application/json" } });
      if (!resp.ok) {
        await resp.text();
        details.push({ source: "Wooniezie", deactivated: 0, error: `API error: ${resp.status}` });
      } else {
        const data = await resp.json();
        const items: any[] = data.result || [];
        const activeSourceUrls = new Set<string>();

        for (const item of items) {
          if (item.isGepubliceerd) {
            activeSourceUrls.add(`${WOONIEZIE_BASE}/aanbod/nu-te-huur/te-huur/details?dwellingID=${item.id}`);
          }
        }

        console.log(`Wooniezie: ${activeSourceUrls.size} active URLs from ${items.length} listings`);

        let wooniezieDeactivated = 0;
        const pageSize = 1000;
        let from = 0;

        while (true) {
          const { data: existingProps, error: fetchErr } = await supabase
            .from("properties")
            .select("id, source_url")
            .eq("source_site", "Wooniezie")
            .eq("status", "actief")
            .range(from, from + pageSize - 1);

          if (fetchErr || !existingProps || existingProps.length === 0) break;

          const idsToDeactivate: string[] = [];
          for (const prop of existingProps) {
            if (prop.source_url && !activeSourceUrls.has(prop.source_url)) {
              idsToDeactivate.push(prop.id);
            }
          }

          for (let i = 0; i < idsToDeactivate.length; i += 100) {
            const batch = idsToDeactivate.slice(i, i + 100);
            await supabase
              .from("properties")
              .update({ status: "inactief", updated_at: new Date().toISOString() })
              .in("id", batch);
            wooniezieDeactivated += batch.length;
          }

          if (existingProps.length < pageSize) break;
          from += pageSize;
        }

        totalDeactivated += wooniezieDeactivated;
        details.push({ source: "Wooniezie", deactivated: wooniezieDeactivated });
        console.log(`Wooniezie: ${wooniezieDeactivated} properties deactivated`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Wooniezie deactivation error:", msg);
      details.push({ source: "Wooniezie", deactivated: 0, error: msg });
    }

    // ─── 3. Fix stuck import jobs ───
    const { data: stuckJobs } = await supabase
      .from("import_jobs")
      .select("id")
      .eq("status", "running")
      .lt("started_at", new Date(Date.now() - 30 * 60 * 1000).toISOString());

    if (stuckJobs && stuckJobs.length > 0) {
      const stuckIds = stuckJobs.map((j: any) => j.id);
      await supabase
        .from("import_jobs")
        .update({
          status: "completed",
          message: "Automatisch afgerond (timeout)",
          completed_at: new Date().toISOString(),
        })
        .in("id", stuckIds);
      console.log(`Fixed ${stuckIds.length} stuck import jobs`);
    }

    console.log(`Deactivation complete: ${totalDeactivated} total deactivated`);

    return new Response(
      JSON.stringify({
        success: true,
        total_deactivated: totalDeactivated,
        details,
        stuck_jobs_fixed: stuckJobs?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Deactivation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
