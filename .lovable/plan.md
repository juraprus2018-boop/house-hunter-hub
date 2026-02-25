

# Suggesties voor WoonPeek verbeteringen

Hier zijn 6 concrete verbeteringen gericht op snelheid, SEO, gebruikerservaring en conversie.

---

## 1. Lazy loading van afbeeldingen + Skeleton loading states
Afbeeldingen op de zoekpagina en homepage laden nu allemaal tegelijk. Door `loading="lazy"` toe te voegen aan alle PropertyCard en FeaturedListings afbeeldingen, en skeleton placeholders te tonen tijdens het laden, wordt de pagina sneller zichtbaar.

**Wat verandert:**
- `PropertyCard.tsx`: `loading="lazy"` op de `<img>` tag
- `FeaturedListings.tsx`: `loading="lazy"` op afbeeldingen (PopularCities heeft dit al)
- Skeleton loading states toevoegen aan de zoekpagina en stadspagina in plaats van alleen een spinner

---

## 2. CityPage server-side filtering (performance fix)
De stadspagina (`CityPage.tsx`) laadt nu ALLE woningen en filtert dan client-side op stad. Dit is traag en onnodig. Door de `city` filter mee te geven aan `useProperties`, worden alleen de relevante woningen opgehaald.

**Wat verandert:**
- `CityPage.tsx`: `useProperties({ city: cityName })` in plaats van alle woningen laden en filteren

---

## 3. Vergelijkbare woningen op de detailpagina
Onderaan de woningdetailpagina een sectie "Vergelijkbare woningen" tonen op basis van dezelfde stad en listing type. Dit houdt bezoekers langer op de site en is goed voor SEO (interne links).

**Wat verandert:**
- `PropertyDetail.tsx`: Nieuwe sectie onderaan met 3-4 vergelijkbare woningen
- Nieuwe query in `useProperties.ts`: `useSimilarProperties(propertyId, city, listingType)`

---

## 4. SEO: Breadcrumbs met structured data op alle pagina's
Breadcrumbs verbeteren de navigatie en worden door Google als rich result getoond. De stadspagina heeft al visuele breadcrumbs, maar zonder schema markup. De detailpagina en zoekpagina missen breadcrumbs helemaal.

**Wat verandert:**
- Nieuw component `Breadcrumbs.tsx` met JSON-LD BreadcrumbList schema
- Toevoegen aan `PropertyDetail.tsx`, `Search.tsx` en `CityPage.tsx`

---

## 5. SEO: Zoekpagina meta tags en canonical URL's met filters
De zoekpagina heeft geen dynamische SEO-titels op basis van actieve filters. Als iemand zoekt op "huur Amsterdam", zou de titel moeten zijn "Huurwoningen in Amsterdam | WoonPeek".

**Wat verandert:**
- `Search.tsx`: Dynamische `<SEOHead>` titel en beschrijving op basis van actieve filters
- Canonical URL met filterparameters

---

## 6. Preconnect en font-display optimalisatie
De externe font (Fontshare) blokkeert de eerste render. Door `preconnect` hints toe te voegen aan `index.html` en `font-display: swap` te garanderen, wordt de pagina sneller zichtbaar.

**Wat verandert:**
- `index.html`: `<link rel="preconnect" href="https://api.fontshare.com">` toevoegen
- `index.html`: `<link rel="preconnect" href="https://cdn.fontshare.com" crossorigin>` toevoegen
- `index.css`: font-display swap bevestigen (zit al in de URL parameter)

---

## Technische details

### Bestanden die aangemaakt worden
- `src/components/seo/Breadcrumbs.tsx` - Herbruikbaar breadcrumbs component met JSON-LD

### Bestanden die gewijzigd worden
- `src/components/properties/PropertyCard.tsx` - lazy loading
- `src/components/home/FeaturedListings.tsx` - lazy loading
- `src/pages/CityPage.tsx` - server-side filtering
- `src/pages/PropertyDetail.tsx` - vergelijkbare woningen + breadcrumbs
- `src/pages/Search.tsx` - dynamische SEO + breadcrumbs + skeleton loading
- `src/hooks/useProperties.ts` - nieuwe `useSimilarProperties` hook
- `index.html` - preconnect hints

### Nieuwe hook: useSimilarProperties

```typescript
export const useSimilarProperties = (currentId: string, city: string, listingType: string) => {
  return useQuery({
    queryKey: ["similar-properties", currentId, city, listingType],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "actief")
        .eq("city", city)
        .eq("listing_type", listingType)
        .neq("id", currentId)
        .order("created_at", { ascending: false })
        .limit(4);
      return data || [];
    },
    enabled: !!currentId && !!city,
  });
};
```

### Breadcrumbs component (voorbeeld)

```typescript
const Breadcrumbs = ({ items }: { items: { label: string; href?: string }[] }) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.label,
      ...(item.href ? { "item": `https://woonpeek.nl${item.href}` } : {}),
    })),
  };
  // Renders visual breadcrumbs + JSON-LD script tag
};
```

