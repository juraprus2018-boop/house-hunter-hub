import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GuidePayload {
  intro: string;
  registration_info: string;
  transport_info: string;
  parking_info: string;
  schools_info: string;
  housing_market_info: string;
  neighborhoods_info: string;
  practical_tips: string;
  meta_title: string;
  meta_description: string;
}

const callAI = async (city: string): Promise<GuidePayload> => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

  const prompt = `Schrijf een uitgebreide, feitelijke en menselijk klinkende gids voor mensen die overwegen te verhuizen naar ${city}, Nederland. 
Gebruik geen em-dashes (—). Gebruik natuurlijke punctuatie zoals dubbele punten of komma's.
Vermijd AI-clichés. Schrijf direct en informatief, alsof een lokale inwoner het uitlegt.

Geef een JSON-object terug met deze velden (alle tekst in het Nederlands, 2-4 alinea's per veld):
- intro: korte introductie waarom mensen naar ${city} verhuizen
- registration_info: hoe inschrijven bij gemeente ${city}, BSN, afspraak maken
- transport_info: openbaar vervoer in ${city}, treinverbindingen, fiets, auto
- parking_info: parkeervergunning ${city}, kosten, wachttijden, betaald parkeren
- schools_info: basisscholen, middelbare scholen, kinderopvang in ${city}
- housing_market_info: huurmarkt en koopmarkt ${city}, gemiddelde prijzen, wachttijden sociale huur
- neighborhoods_info: belangrijkste wijken en buurten in ${city} met korte beschrijving
- practical_tips: 5-7 praktische tips voor nieuwe inwoners van ${city}
- meta_title: SEO titel max 60 tekens, format "Verhuizen naar ${city}: Complete gids 2025 | WoonPeek"
- meta_description: SEO beschrijving max 155 tekens

Antwoord ALLEEN met geldig JSON, geen markdown of uitleg.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Je bent een Nederlandse copywriter gespecialiseerd in lokale gidsen voor steden." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in AI response");

  return JSON.parse(content) as GuidePayload;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, city_slug, force = false } = await req.json();

    if (!city || !city_slug) {
      return new Response(JSON.stringify({ error: "city and city_slug required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check existing
    if (!force) {
      const { data: existing } = await supabase
        .from("city_guides")
        .select("*")
        .eq("city_slug", city_slug)
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ guide: existing, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const generated = await callAI(city);

    const { data: upserted, error } = await supabase
      .from("city_guides")
      .upsert(
        { city, city_slug, ...generated, generated_by: "ai" },
        { onConflict: "city_slug" }
      )
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ guide: upserted, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-city-guide error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
