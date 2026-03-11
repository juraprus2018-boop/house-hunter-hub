import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Topic categories for rotation (used as fallback when no news is found)
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

// Fetch housing-related news from nu.nl RSS feed
async function fetchNuNlNews(): Promise<{ title: string; description: string; link: string }[]> {
  const RSS_URLS = [
    "https://www.nu.nl/rss/Economie",
    "https://www.nu.nl/rss/Algemeen",
  ];

  const housingKeywords = [
    "woning", "huis", "huur", "koop", "hypotheek", "woningmarkt",
    "huizenprijs", "huizenprijzen", "vastgoed", "nieuwbouw", "bouwvergunning",
    "huurprijs", "energielabel", "verduurzaming", "isolatie", "warmtepomp",
    "woningtekort", "starters", "rente", "huurtoeslag", "wooncrisis",
    "appartement", "koopwoning", "huurwoning", "makelaars", "taxatie",
    "WOZ", "erfpacht", "zonnepanelen", "woningcorporatie", "sociale huur",
    "vrije sector", "overbieden", "woningbouw", "verhuizen", "kamertekort",
  ];

  const allArticles: { title: string; description: string; link: string }[] = [];

  for (const rssUrl of RSS_URLS) {
    try {
      const res = await fetch(rssUrl, {
        headers: { "User-Agent": "WoonPeek-BlogBot/1.0" },
      });
      if (!res.ok) continue;
      const xml = await res.text();

      // Simple XML parsing for RSS items
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const item of items) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);

        const title = (titleMatch?.[1] || titleMatch?.[2] || "").trim();
        const description = (descMatch?.[1] || descMatch?.[2] || "").replace(/<[^>]+>/g, "").trim();
        const link = (linkMatch?.[1] || "").trim();

        if (title) {
          const combined = `${title} ${description}`.toLowerCase();
          const isRelevant = housingKeywords.some(kw => combined.includes(kw));
          if (isRelevant) {
            allArticles.push({ title, description, link });
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch RSS from ${rssUrl}:`, err);
    }
  }

  // Return max 5 most relevant articles
  return allArticles.slice(0, 5);
}

const SYSTEM_PROMPT = `Je bent een top-tier Nederlandse SEO-contentwriter gespecialiseerd in de woningmarkt.
Je schrijft professionele, goed gestructureerde blogartikelen voor WoonPeek.nl, een platform dat huur- en koopwoningen in Nederland verzamelt.

SCHRIJFSTIJL & STRUCTUUR (ZEER BELANGRIJK):
- Schrijf ALTIJD in het Nederlands, vlot en toegankelijk
- Maak het artikel minimaal 1000 woorden
- Voeg GEEN H1 toe (die wordt apart weergegeven als paginatitel)

HTML STRUCTUUR (STRIKT VOLGEN):
- Begin met een KORTE, krachtige intro van maximaal 2 zinnen in één <p> tag
- Gebruik <h2> voor hoofdsecties (minimaal 5-6 h2 koppen)
- Gebruik <h3> voor subsecties binnen een h2
- Elke sectie moet minimaal 2 paragrafen bevatten
- Houd paragrafen KORT: maximaal 3-4 zinnen per <p> tag
- Gebruik <ul><li> of <ol><li> voor opsommingen en stappenplannen
- Gebruik <strong> voor belangrijke termen en kernbegrippen
- Gebruik <blockquote> voor tips of belangrijke waarschuwingen (minimaal 2 per artikel)

FAQ SECTIE (VERPLICHT):
- Voeg ALTIJD een FAQ-sectie toe aan het einde van het artikel, vóór de conclusie
- Gebruik <h2>Veelgestelde vragen</h2> als kop
- Schrijf minimaal 4 veelgestelde vragen met antwoorden
- Gebruik dit exacte HTML-formaat voor elke vraag:
  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">De vraag hier?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Het antwoord hier.</p>
    </div>
  </div>

INTERNE LINKS (VERPLICHT, minimaal 3):
Voeg relevante interne links toe naar andere pagina's op WoonPeek.nl:
- /zoeken?listing_type=huur → voor huurwoningen zoeken
- /zoeken?listing_type=koop → voor koopwoningen zoeken  
- /steden → overzicht van alle steden
- /woningen-amsterdam → Amsterdam woningen (ook: rotterdam, utrecht, den-haag, etc.)
- /nieuwe-woningen → nieuw toegevoegde woningen
- /verkennen → woningen op de kaart bekijken
- /dagelijkse-alert → dagelijkse e-mail alerts instellen
- /blog → meer blogartikelen lezen

INHOUD:
- Gebruik concrete cijfers, bedragen en percentages
- Geef praktische, direct toepasbare tips
- Verwijs naar actuele wet- en regelgeving waar relevant
- Schrijf alsof je een expert bent die een vriend adviseert
- Eindig met een sterke conclusie en CTA naar WoonPeek`;

const TOOL_DEFINITION = {
  type: "function" as const,
  function: {
    name: "create_blog_post",
    description: "Create a blog post with structured content",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Blog post title, max 60 chars, SEO optimized" },
        excerpt: { type: "string", description: "Short summary, max 160 chars" },
        meta_title: { type: "string", description: "SEO title for Google, max 60 chars, include primary keyword" },
        meta_description: { type: "string", description: "Meta description for Google, max 155 chars, include CTA" },
        content: { type: "string", description: "Full article content in HTML with FAQ section" },
        faq_questions: {
          type: "array",
          description: "Array of FAQ question-answer pairs for JSON-LD schema",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        primary_keyword: { type: "string", description: "The main SEO keyword for this article" },
      },
      required: ["title", "excerpt", "meta_title", "meta_description", "content", "faq_questions", "primary_keyword"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
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

    // Step 1: Try to fetch relevant news from nu.nl
    console.log("Fetching housing news from nu.nl...");
    const newsArticles = await fetchNuNlNews();
    const hasNews = newsArticles.length > 0;
    console.log(`Found ${newsArticles.length} relevant news articles`);

    // Step 2: Build the prompt based on news or fallback topic
    let userPrompt: string;
    let topicCategory: string;

    if (hasNews) {
      topicCategory = "Actueel woningmarkt nieuws";
      const newsContext = newsArticles
        .map((a, i) => `${i + 1}. "${a.title}" - ${a.description} (bron: ${a.link})`)
        .join("\n");

      userPrompt = `Schrijf een uitgebreid, informatief en SEO-geoptimaliseerd blogartikel gebaseerd op dit ACTUELE nieuws over de woningmarkt:

${newsContext}

BELANGRIJK:
- Gebruik deze nieuwsberichten als inspiratie en context, maar schrijf een EIGEN uniek artikel
- Verwijs NIET direct naar nu.nl of andere bronnen met links
- Combineer de nieuwsfeiten tot een samenhangend verhaal met praktische tips
- Maak het artikel actueel en relevant voor woningzoekers
- Het is vandaag ${new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
- Zorg dat de FAQ-vragen relevant zijn bij het actuele nieuws`;
    } else {
      const topic = pickTopic();
      topicCategory = topic.category;
      userPrompt = `Schrijf een uitgebreid, informatief en SEO-geoptimaliseerd blogartikel over het volgende onderwerp: "${topic.prompt}". 
              
Categorie: ${topic.category}.
Het is vandaag ${new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.

Zorg dat het artikel actueel aanvoelt, praktische tips bevat, en relevant is voor mensen die actief op zoek zijn naar een woning in Nederland. Gebruik concrete voorbeelden en cijfers waar mogelijk.`;
    }

    // Step 3: Generate the article with AI
    console.log(`Generating blog about: ${topicCategory}`);
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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [TOOL_DEFINITION],
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

    // Step 4: Get an admin user as author
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!adminRole) {
      throw new Error("No admin user found to set as author");
    }

    // Step 5: Save to database with enriched metadata
    const slug = generateSlug(article.title);
    const now = new Date().toISOString();

    // Store FAQ and SEO data in meta_description as JSON enrichment
    const seoMeta = {
      meta_description: article.meta_description,
      faq_questions: article.faq_questions || [],
      primary_keyword: article.primary_keyword || "",
      news_based: hasNews,
    };

    const insertData = {
      title: article.title,
      slug,
      excerpt: article.excerpt || null,
      content: article.content,
      meta_title: article.meta_title || null,
      meta_description: JSON.stringify(seoMeta),
      author_id: adminRole.user_id,
      status: "published",
      published_at: now,
    };

    const { error: insertError } = await supabase
      .from("blog_posts")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const slugWithDate = `${slug}-${today}`;
        const { error: retryError } = await supabase
          .from("blog_posts")
          .insert({ ...insertData, slug: slugWithDate })
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

    // Step 6: Post to Facebook
    let facebookResult = null;
    try {
      const PAGE_ACCESS_TOKEN = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
      let PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");
      const GRAPH_API = "https://graph.facebook.com/v21.0";
      const siteUrl = "https://www.woonpeek.nl";

      if (PAGE_ACCESS_TOKEN) {
        if (!PAGE_ID) {
          const meRes = await fetch(`${GRAPH_API}/me?access_token=${PAGE_ACCESS_TOKEN}`);
          const meData = await meRes.json();
          if (meData.id) PAGE_ID = meData.id;
        }

        if (PAGE_ID) {
          const blogUrl = `${siteUrl}/blog/${slug}`;
          const categoryTags: Record<string, string[]> = {
            "Huurmarkt tips": ["#huurwoning", "#huurders", "#huurtips"],
            "Koopmarkt analyse": ["#koopwoning", "#hypotheek", "#huizenprijzen"],
            "Woningmarkt nieuws": ["#woningtekort", "#nieuwbouw", "#woningmarktnieuws"],
            "Actueel woningmarkt nieuws": ["#breaking", "#woningmarktnieuws", "#actueel"],
            "Wonen & lifestyle": ["#verhuizen", "#woontrends", "#lifestyle"],
            "Juridisch & financieel": ["#huurrecht", "#belasting", "#financieel"],
            "Duurzaamheid": ["#duurzaam", "#energielabel", "#verduurzaming"],
          };
          const baseTags = ["#woningmarkt", "#woonpeek", "#vastgoed", "#Nederland"];
          const extraTags = categoryTags[topicCategory] || [];
          const allTags = [...new Set([...extraTags, ...baseTags])].slice(0, 6);

          const newsEmoji = hasNews ? "📰" : "📝";
          let fbMessage = `${newsEmoji} ${hasNews ? "Actueel nieuws" : "Nieuw op het blog"}!\n\n`;
          fbMessage += `${article.title}\n\n`;
          fbMessage += `${article.excerpt || ""}\n\n`;
          fbMessage += `👉 Lees het volledige artikel: ${blogUrl}\n\n`;
          fbMessage += allTags.join(" ");

          const bannerUrl = `${siteUrl}/facebook-cover.png`;
          const res = await fetch(`${GRAPH_API}/${PAGE_ID}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: bannerUrl,
              message: fbMessage,
              access_token: PAGE_ACCESS_TOKEN,
            }),
          });
          const fbData = await res.json();

          if (fbData.error) {
            const feedRes = await fetch(`${GRAPH_API}/${PAGE_ID}/feed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: fbMessage,
                link: blogUrl,
                access_token: PAGE_ACCESS_TOKEN,
              }),
            });
            const feedData = await feedRes.json();
            facebookResult = feedData.error ? { error: feedData.error.message } : { postId: feedData.id };
          } else {
            facebookResult = { postId: fbData.post_id || fbData.id };
          }
          console.log("Facebook blog post result:", JSON.stringify(facebookResult));
        }
      }
    } catch (fbErr) {
      console.error("Facebook posting failed (non-blocking):", fbErr);
      facebookResult = { error: String(fbErr) };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Blog post "${article.title}" published`,
        slug,
        news_based: hasNews,
        news_count: newsArticles.length,
        facebook: facebookResult,
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
