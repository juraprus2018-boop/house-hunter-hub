import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rotating topic categories for variety
const TOPIC_CATEGORIES = [
  {
    category: "Huurmarkt tips",
    prompts: [
      "tips voor huurders in Nederland",
      "rechten van huurders bij huurverhoging",
      "hoe vind je snel een huurwoning",
      "waar moet je op letten bij het huren van een woning",
      "huursubsidie aanvragen: stappenplan",
      "verschil tussen sociale huur en vrije sector",
    ],
  },
  {
    category: "Koopmarkt analyse",
    prompts: [
      "huizenprijzen trend Nederland actueel",
      "beste tijd om een huis te kopen",
      "kosten koper berekenen: wat betaal je echt",
      "hypotheek afsluiten als starter",
      "overbieden op een woning: wel of niet doen",
      "woningwaarde laten taxeren: hoe werkt het",
    ],
  },
  {
    category: "Woningmarkt nieuws",
    prompts: [
      "nieuwbouwprojecten Nederland",
      "woningtekort oplossingen overheid",
      "energielabel en woningwaarde",
      "verduurzaming van je woning: subsidies",
      "trends op de woningmarkt dit jaar",
      "impact van rente op de huizenmarkt",
    ],
  },
  {
    category: "Wonen & lifestyle",
    prompts: [
      "beste steden om te wonen in Nederland",
      "wonen in een tiny house: voor- en nadelen",
      "thuiswerken en woningkeuze",
      "buurten vergelijken: waar woon je het beste",
      "verhuizen checklist: alles wat je moet regelen",
      "samenwonen: huur of koop",
    ],
  },
  {
    category: "Juridisch & financieel",
    prompts: [
      "huurcontract opzeggen: regels en termijnen",
      "servicekosten huurwoning: wat mag wel en niet",
      "WOZ-waarde bezwaar maken",
      "erfpacht uitgelegd voor beginners",
      "verzekeringen bij het kopen van een huis",
      "belastingvoordeel eigen woning",
    ],
  },
  {
    category: "Duurzaamheid",
    prompts: [
      "zonnepanelen huurwoning: mogelijkheden",
      "isolatie subsidie aanvragen",
      "gasloos wonen: wat komt erbij kijken",
      "energiezuinig wonen tips",
      "warmtepomp voor je woning: kosten en baten",
      "circulair bouwen in Nederland",
    ],
  },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Pick a topic based on current day to ensure rotation
function pickTopic(): { category: string; prompt: string } {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const catIndex = dayOfYear % TOPIC_CATEGORIES.length;
  const cat = TOPIC_CATEGORIES[catIndex];
  const promptIndex = Math.floor(dayOfYear / TOPIC_CATEGORIES.length) % cat.prompts.length;
  return { category: cat.category, prompt: cat.prompts[promptIndex] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase config missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if we already posted today
    const today = new Date().toISOString().split("T")[0];
    const { data: existingToday } = await supabase
      .from("blog_posts")
      .select("id")
      .gte("published_at", `${today}T00:00:00Z`)
      .lte("published_at", `${today}T23:59:59Z`)
      .eq("status", "published")
      .limit(1);

    if (existingToday && existingToday.length > 0) {
      console.log("Already published a blog post today, skipping.");
      return new Response(
        JSON.stringify({ success: true, message: "Already posted today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const topic = pickTopic();
    console.log(`Generating blog about: ${topic.category} - ${topic.prompt}`);

    // Step 1: Generate the article with AI
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Je bent een top-tier Nederlandse SEO-contentwriter gespecialiseerd in de woningmarkt.
Je schrijft professionele, goed gestructureerde blogartikelen voor WoonPeek.nl, een platform dat huur- en koopwoningen in Nederland verzamelt.

SCHRIJFSTIJL & STRUCTUUR (ZEER BELANGRIJK):
- Schrijf ALTIJD in het Nederlands, vlot en toegankelijk
- Het is nu ${new Date().toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
- Maak het artikel minimaal 1000 woorden
- Voeg GEEN H1 toe (die wordt apart weergegeven als paginatitel)

HTML STRUCTUUR (STRIKT VOLGEN):
- Begin met een sterke intro van 2-3 paragrafen in <p> tags
- Gebruik <h2> voor hoofdsecties (minimaal 4-5 h2 koppen)
- Gebruik <h3> voor subsecties binnen een h2
- Elke sectie moet minimaal 2 paragrafen bevatten
- Gebruik <ul><li> of <ol><li> voor opsommingen en stappenplannen
- Gebruik <strong> voor belangrijke termen en kernbegrippen
- Gebruik <blockquote> voor tips of belangrijke waarschuwingen
- Voeg witregels toe tussen secties voor leesbaarheid

INTERNE LINKS (VERPLICHT, minimaal 3):
Voeg relevante interne links toe naar andere pagina's op WoonPeek.nl. Gebruik <a href="URL">anchor text</a>. Beschikbare pagina's:
- /zoeken?listing_type=huur → voor huurwoningen zoeken
- /zoeken?listing_type=koop → voor koopwoningen zoeken  
- /steden → overzicht van alle steden
- /steden/amsterdam → Amsterdam woningen (ook: rotterdam, utrecht, den-haag, eindhoven, groningen, etc.)
- /nieuwe-woningen → nieuw toegevoegde woningen
- /verkennen → woningen op de kaart bekijken
- /dagelijkse-alert → dagelijkse e-mail alerts instellen
- /blog → meer blogartikelen lezen

Voorbeeld: <a href="/zoeken?listing_type=huur">Bekijk alle beschikbare huurwoningen</a>

INHOUD:
- Gebruik concrete cijfers, bedragen en percentages
- Geef praktische, direct toepasbare tips
- Verwijs naar actuele wet- en regelgeving waar relevant
- Schrijf alsof je een expert bent die een vriend adviseert
- Eindig met een sterke conclusie en CTA naar WoonPeek

Je antwoord MOET een JSON object zijn met exact deze structuur:
{
  "title": "Pakkende, nieuwsgierig makende SEO-titel (max 60 tekens)",
  "excerpt": "Korte samenvatting voor de overzichtspagina (max 160 tekens)", 
  "meta_title": "SEO titel voor Google (max 60 tekens)",
  "meta_description": "Meta beschrijving voor Google (max 155 tekens)",
  "content": "<p>Het volledige artikel in HTML...</p>"
}`,
            },
            {
              role: "user",
              content: `Schrijf een uitgebreid, informatief en SEO-geoptimaliseerd blogartikel over het volgende onderwerp: "${topic.prompt}". 
              
Categorie: ${topic.category}.

Zorg dat het artikel actueel aanvoelt, praktische tips bevat, en relevant is voor mensen die actief op zoek zijn naar een woning in Nederland. Gebruik concrete voorbeelden en cijfers waar mogelijk.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_blog_post",
                description: "Create a blog post with structured content",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Blog post title, max 60 chars" },
                    excerpt: { type: "string", description: "Short summary, max 160 chars" },
                    meta_title: { type: "string", description: "SEO title, max 60 chars" },
                    meta_description: { type: "string", description: "Meta description, max 155 chars" },
                    content: { type: "string", description: "Full article content in HTML" },
                  },
                  required: ["title", "excerpt", "meta_title", "meta_description", "content"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "create_blog_post" } },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // Extract from tool call
    let article: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      article = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content as JSON
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        article = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    if (!article?.title || !article?.content) {
      throw new Error("AI response missing required fields");
    }

    console.log(`Generated article: "${article.title}"`);

    // Step 2: Get an admin user to use as author
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!adminRole) {
      throw new Error("No admin user found to set as author");
    }

    // Step 3: Save to database
    const slug = generateSlug(article.title);
    const now = new Date().toISOString();

    const { data: newPost, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: article.title,
        slug,
        excerpt: article.excerpt || null,
        content: article.content,
        meta_title: article.meta_title || null,
        meta_description: article.meta_description || null,
        author_id: adminRole.user_id,
        status: "published",
        published_at: now,
      })
      .select()
      .single();

    if (insertError) {
      // If slug conflict, add date suffix
      if (insertError.code === "23505") {
        const slugWithDate = `${slug}-${today}`;
        const { data: retryPost, error: retryError } = await supabase
          .from("blog_posts")
          .insert({
            title: article.title,
            slug: slugWithDate,
            excerpt: article.excerpt || null,
            content: article.content,
            meta_title: article.meta_title || null,
            meta_description: article.meta_description || null,
            author_id: adminRole.user_id,
            status: "published",
            published_at: now,
          })
          .select()
          .single();

        if (retryError) throw retryError;
        console.log(`Blog post published with slug: ${slugWithDate}`);
      } else {
        throw insertError;
      }
    } else {
      console.log(`Blog post published with slug: ${slug}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Blog post "${article.title}" published`,
        slug,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating blog post:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
