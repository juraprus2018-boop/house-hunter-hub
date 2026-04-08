import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Loader2, Globe, ExternalLink, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cityToSlug } from "@/lib/cities";

const SITE_URL = "https://www.woonpeek.nl";

interface PagePattern {
  label: string;
  pattern: string;
  example: string;
  description: string;
  category: string;
}

const STATIC_PAGES: PagePattern[] = [
  { label: "Homepage", pattern: "/", example: "/", description: "Hoofdpagina", category: "Statisch" },
  { label: "Zoeken", pattern: "/zoeken", example: "/zoeken", description: "Zoekpagina met filters", category: "Statisch" },
  { label: "Steden overzicht", pattern: "/steden", example: "/steden", description: "Lijst van alle steden", category: "Statisch" },
  { label: "Verkennen", pattern: "/verkennen", example: "/verkennen", description: "Kaartweergave", category: "Statisch" },
  { label: "Nieuw aanbod", pattern: "/nieuw-aanbod", example: "/nieuw-aanbod", description: "Landelijk nieuw aanbod", category: "Statisch" },
  { label: "Huurwoningen", pattern: "/huurwoningen", example: "/huurwoningen", description: "Alle huurwoningen", category: "Statisch" },
  { label: "Koopwoningen", pattern: "/koopwoningen", example: "/koopwoningen", description: "Alle koopwoningen", category: "Statisch" },
  { label: "Appartementen", pattern: "/appartementen", example: "/appartementen", description: "Alle appartementen", category: "Statisch" },
  { label: "Huizen", pattern: "/huizen", example: "/huizen", description: "Alle huizen", category: "Statisch" },
  { label: "Studios", pattern: "/studios", example: "/studios", description: "Alle studios", category: "Statisch" },
  { label: "Kamers", pattern: "/kamers", example: "/kamers", description: "Alle kamers", category: "Statisch" },
  { label: "Blog", pattern: "/blog", example: "/blog", description: "Blog overzicht", category: "Statisch" },
  { label: "Dagelijkse alert", pattern: "/dagelijkse-alert", example: "/dagelijkse-alert", description: "Alert aanmeldpagina", category: "Statisch" },
  { label: "Budget tool", pattern: "/budget-tool", example: "/budget-tool", description: "Huurbudget calculator", category: "Statisch" },
  { label: "FAQ", pattern: "/veelgestelde-vragen", example: "/veelgestelde-vragen", description: "Veelgestelde vragen", category: "Statisch" },
  { label: "Over WoonPeek", pattern: "/over-woonpeek", example: "/over-woonpeek", description: "Over ons", category: "Statisch" },
  { label: "Makelaar koppelen", pattern: "/makelaar-koppelen", example: "/makelaar-koppelen", description: "Makelaar aanmeldformulier", category: "Statisch" },
  { label: "Samenwerking", pattern: "/samenwerking", example: "/samenwerking", description: "Samenwerkingspagina", category: "Statisch" },
  { label: "Woning plaatsen", pattern: "/woning-plaatsen", example: "/woning-plaatsen", description: "Woning plaatsen start", category: "Statisch" },
];

const DYNAMIC_PATTERNS: { label: string; pattern: string; description: string; category: string }[] = [
  { label: "Stadspagina", pattern: "/woningen-[stad]", description: "Overzicht per stad", category: "Stad" },
  { label: "Huurwoningen per stad", pattern: "/huurwoningen/[stad]", description: "Huurwoningen gefilterd op stad", category: "Stad" },
  { label: "Koopwoningen per stad", pattern: "/koopwoningen/[stad]", description: "Koopwoningen gefilterd op stad", category: "Stad" },
  { label: "Appartementen per stad", pattern: "/appartementen/[stad]", description: "Appartementen gefilterd op stad", category: "Stad" },
  { label: "Huizen per stad", pattern: "/huizen/[stad]", description: "Huizen gefilterd op stad", category: "Stad" },
  { label: "Studios per stad", pattern: "/studios/[stad]", description: "Studios gefilterd op stad", category: "Stad" },
  { label: "Kamers per stad", pattern: "/kamers/[stad]", description: "Kamers gefilterd op stad", category: "Stad" },
  { label: "Nieuw aanbod per stad", pattern: "/nieuw-aanbod/[stad]", description: "Nieuw aanbod gefilterd op stad", category: "Stad" },
  { label: "Huurprijzen monitor", pattern: "/huurprijzen/[stad]", description: "Huurprijzen overzicht per stad", category: "Stad" },
  { label: "Woningen onder prijs", pattern: "/woningen/[stad]/onder-[prijs]", description: "Prijsfilter per stad", category: "Filter" },
  { label: "Woningen op kamers", pattern: "/woningen/[stad]/[n]-kamers", description: "Kamerfilter per stad", category: "Filter" },
  { label: "Huurwoningen onder prijs", pattern: "/huurwoningen/[stad]/onder-[prijs]", description: "Huur + prijsfilter", category: "Combinatie" },
  { label: "Huurwoningen op kamers", pattern: "/huurwoningen/[stad]/[n]-kamers", description: "Huur + kamerfilter", category: "Combinatie" },
  { label: "Koopwoningen onder prijs", pattern: "/koopwoningen/[stad]/onder-[prijs]", description: "Koop + prijsfilter", category: "Combinatie" },
  { label: "Koopwoningen op kamers", pattern: "/koopwoningen/[stad]/[n]-kamers", description: "Koop + kamerfilter", category: "Combinatie" },
  { label: "Appartementen onder prijs", pattern: "/appartementen/[stad]/onder-[prijs]", description: "Type + prijsfilter", category: "Combinatie" },
  { label: "Appartementen op kamers", pattern: "/appartementen/[stad]/[n]-kamers", description: "Type + kamerfilter", category: "Combinatie" },
  { label: "Huizen onder prijs", pattern: "/huizen/[stad]/onder-[prijs]", description: "Type + prijsfilter", category: "Combinatie" },
  { label: "Huizen op kamers", pattern: "/huizen/[stad]/[n]-kamers", description: "Type + kamerfilter", category: "Combinatie" },
  { label: "Studios onder prijs", pattern: "/studios/[stad]/onder-[prijs]", description: "Type + prijsfilter", category: "Combinatie" },
  { label: "Studios op kamers", pattern: "/studios/[stad]/[n]-kamers", description: "Type + kamerfilter", category: "Combinatie" },
  { label: "Kamers onder prijs", pattern: "/kamers/[stad]/onder-[prijs]", description: "Type + prijsfilter", category: "Combinatie" },
  { label: "Kamers op kamers", pattern: "/kamers/[stad]/[n]-kamers", description: "Type + kamerfilter", category: "Combinatie" },
  { label: "Wijkpagina", pattern: "/wijk/[stad]/[wijk]", description: "Wijk-specifiek overzicht", category: "Wijk" },
  { label: "Stad vergelijken", pattern: "/vergelijk/[stad1]-vs-[stad2]", description: "Twee steden vergelijken", category: "Vergelijking" },
  { label: "Woning detail", pattern: "/woning/[slug]", description: "Individuele woningpagina", category: "Detail" },
  { label: "Blog artikel", pattern: "/blog/[slug]", description: "Individueel blogartikel", category: "Detail" },
];

const PRICES = [750, 1000, 1250, 1500, 2000];
const BEDROOMS = [1, 2, 3, 4];
const TYPE_SLUGS = ["appartementen", "huizen", "studios", "kamers"];
const LISTING_SLUGS = ["huurwoningen", "koopwoningen"];

const categoryColors: Record<string, string> = {
  Statisch: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Stad: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Filter: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Combinatie: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Wijk: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  Vergelijking: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  Detail: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const AdminPageTypes = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-page-types-stats"],
    queryFn: async () => {
      const [citiesRes, propertiesRes, blogsRes, neighborhoodsRes] = await Promise.all([
        supabase.from("properties").select("city", { count: "exact", head: false }).eq("status", "actief"),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "actief"),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("properties").select("city, neighborhood").eq("status", "actief").not("neighborhood", "is", null),
      ]);

      const uniqueCities = new Set((citiesRes.data || []).map((r: any) => r.city));
      const uniqueNeighborhoods = new Set(
        (neighborhoodsRes.data || []).map((r: any) => `${r.city}/${r.neighborhood}`)
      );

      return {
        cityCount: uniqueCities.size,
        cities: Array.from(uniqueCities).sort() as string[],
        propertyCount: propertiesRes.count || 0,
        blogCount: blogsRes.count || 0,
        neighborhoodCount: uniqueNeighborhoods.size,
      };
    },
  });

  // Calculate total generated pages
  const cityCount = data?.cityCount || 0;
  const calcCounts = {
    static: STATIC_PAGES.length,
    cityPages: cityCount, // /woningen-[stad]
    listingPerCity: cityCount * 2, // huur + koop
    typePerCity: cityCount * 4, // 4 types
    priceFilter: cityCount * PRICES.length,
    bedroomFilter: cityCount * BEDROOMS.length,
    comboTypePrice: cityCount * TYPE_SLUGS.length * PRICES.length,
    comboTypeBeds: cityCount * TYPE_SLUGS.length * BEDROOMS.length,
    comboListingPrice: cityCount * LISTING_SLUGS.length * PRICES.length,
    comboListingBeds: cityCount * LISTING_SLUGS.length * BEDROOMS.length,
    newPerCity: cityCount,
    huurprijzen: cityCount,
    neighborhoods: data?.neighborhoodCount || 0,
    properties: data?.propertyCount || 0,
    blogs: data?.blogCount || 0,
  };

  const totalPages =
    calcCounts.static +
    calcCounts.cityPages +
    calcCounts.listingPerCity +
    calcCounts.typePerCity +
    calcCounts.priceFilter +
    calcCounts.bedroomFilter +
    calcCounts.comboTypePrice +
    calcCounts.comboTypeBeds +
    calcCounts.comboListingPrice +
    calcCounts.comboListingBeds +
    calcCounts.newPerCity +
    calcCounts.huurprijzen +
    calcCounts.neighborhoods +
    calcCounts.properties +
    calcCounts.blogs;

  // Build example city slug
  const exampleCity = data?.cities?.[0] ? cityToSlug(data.cities[0]) : "amsterdam";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paginatypen Overzicht</h1>
          <p className="text-sm text-muted-foreground">
            Alle URL-patronen en SEO-landingspagina's die WoonPeek genereert
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">Totaal pagina's</p>
                <p className="text-3xl font-bold text-foreground">{totalPages.toLocaleString("nl-NL")}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">Unieke steden</p>
                <p className="text-3xl font-bold text-foreground">{cityCount}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">Woningpagina's</p>
                <p className="text-3xl font-bold text-foreground">{calcCounts.properties.toLocaleString("nl-NL")}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">Blogpagina's</p>
                <p className="text-3xl font-bold text-foreground">{calcCounts.blogs}</p>
              </div>
            </div>

            {/* Breakdown table */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-3">
                <h2 className="font-semibold text-foreground">URL-patronen per categorie</h2>
              </div>
              <div className="divide-y">
                {/* Static pages */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={categoryColors["Statisch"]}>Statisch</Badge>
                    <span className="text-sm text-muted-foreground">{calcCounts.static} pagina's</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {STATIC_PAGES.map((p) => (
                      <a
                        key={p.pattern}
                        href={`${SITE_URL}${p.example}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 rounded-lg border bg-background p-3 text-sm transition-colors hover:border-primary/50"
                      >
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{p.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.pattern}</p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Dynamic patterns - grouped by category */}
                {["Stad", "Filter", "Combinatie", "Wijk", "Vergelijking", "Detail"].map((cat) => {
                  const patterns = DYNAMIC_PATTERNS.filter((p) => p.category === cat);
                  if (patterns.length === 0) return null;

                  let pageCount = 0;
                  if (cat === "Stad") pageCount = calcCounts.cityPages + calcCounts.listingPerCity + calcCounts.typePerCity + calcCounts.newPerCity + calcCounts.huurprijzen;
                  if (cat === "Filter") pageCount = calcCounts.priceFilter + calcCounts.bedroomFilter;
                  if (cat === "Combinatie") pageCount = calcCounts.comboTypePrice + calcCounts.comboTypeBeds + calcCounts.comboListingPrice + calcCounts.comboListingBeds;
                  if (cat === "Wijk") pageCount = calcCounts.neighborhoods;
                  if (cat === "Detail") pageCount = calcCounts.properties + calcCounts.blogs;

                  return (
                    <div key={cat} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={categoryColors[cat]}>{cat}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {patterns.length} patronen → ~{pageCount.toLocaleString("nl-NL")} pagina's
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {patterns.map((p) => {
                          const exampleUrl = p.pattern
                            .replace("[stad]", exampleCity)
                            .replace("[stad1]", exampleCity)
                            .replace("[stad2]", "rotterdam")
                            .replace("[prijs]", "1000")
                            .replace("[n]", "2")
                            .replace("[wijk]", "centrum")
                            .replace("[slug]", "voorbeeld");

                          return (
                            <a
                              key={p.pattern}
                              href={`${SITE_URL}${exampleUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-2 rounded-lg border bg-background p-3 text-sm transition-colors hover:border-primary/50"
                            >
                              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground truncate">{p.label}</p>
                                <p className="text-xs text-muted-foreground truncate">{p.pattern}</p>
                              </div>
                              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-city breakdown */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-3">
                <h2 className="font-semibold text-foreground">Pagina's per stad</h2>
                <p className="text-xs text-muted-foreground">
                  Per stad worden de volgende pagina's automatisch gegenereerd
                </p>
              </div>
              <div className="px-5 py-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Stadspagina</span>
                    <span className="font-medium text-foreground">1</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Huur/koop pagina's</span>
                    <span className="font-medium text-foreground">2</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Woningtype pagina's</span>
                    <span className="font-medium text-foreground">4</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Prijsfilter (generiek)</span>
                    <span className="font-medium text-foreground">{PRICES.length}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Kamerfilter (generiek)</span>
                    <span className="font-medium text-foreground">{BEDROOMS.length}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Type × prijsfilter</span>
                    <span className="font-medium text-foreground">{TYPE_SLUGS.length * PRICES.length}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Type × kamerfilter</span>
                    <span className="font-medium text-foreground">{TYPE_SLUGS.length * BEDROOMS.length}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Huur/koop × prijsfilter</span>
                    <span className="font-medium text-foreground">{LISTING_SLUGS.length * PRICES.length}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Huur/koop × kamerfilter</span>
                    <span className="font-medium text-foreground">{LISTING_SLUGS.length * BEDROOMS.length}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Nieuw aanbod</span>
                    <span className="font-medium text-foreground">1</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-muted-foreground">Huurprijzen monitor</span>
                    <span className="font-medium text-foreground">1</span>
                  </div>
                  <div className="col-span-full flex justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 font-medium">
                    <span className="text-foreground flex items-center gap-1.5"><Hash className="h-4 w-4" /> Totaal per stad</span>
                    <span className="text-primary">
                      {1 + 2 + 4 + PRICES.length + BEDROOMS.length + TYPE_SLUGS.length * PRICES.length + TYPE_SLUGS.length * BEDROOMS.length + LISTING_SLUGS.length * PRICES.length + LISTING_SLUGS.length * BEDROOMS.length + 1 + 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPageTypes;
