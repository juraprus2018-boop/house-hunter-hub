/**
 * Auto-link city names and keywords in blog HTML content
 * to relevant internal pages for SEO benefit.
 */

const CITY_LINKS: Record<string, string> = {
  Amsterdam: "/woningen-amsterdam",
  Rotterdam: "/woningen-rotterdam",
  Utrecht: "/woningen-utrecht",
  "Den Haag": "/woningen-den-haag",
  Eindhoven: "/woningen-eindhoven",
  Groningen: "/woningen-groningen",
  Tilburg: "/woningen-tilburg",
  Almere: "/woningen-almere",
  Breda: "/woningen-breda",
  Nijmegen: "/woningen-nijmegen",
  Arnhem: "/woningen-arnhem",
  Haarlem: "/woningen-haarlem",
  Amersfoort: "/woningen-amersfoort",
  Leiden: "/woningen-leiden",
  Maastricht: "/woningen-maastricht",
  Delft: "/woningen-delft",
  Deventer: "/woningen-deventer",
  Leeuwarden: "/woningen-leeuwarden",
  Zwolle: "/woningen-zwolle",
  Enschede: "/woningen-enschede",
  Apeldoorn: "/woningen-apeldoorn",
  Hilversum: "/woningen-hilversum",
  Dordrecht: "/woningen-dordrecht",
  Zaandam: "/woningen-zaandam",
  Zoetermeer: "/woningen-zoetermeer",
  "Den Bosch": "/woningen-den-bosch",
  Roosendaal: "/woningen-roosendaal",
  Alkmaar: "/woningen-alkmaar",
};

const KEYWORD_LINKS: Record<string, string> = {
  huurwoningen: "/huurwoningen",
  koopwoningen: "/koopwoningen",
  appartementen: "/appartementen",
  "dagelijkse alert": "/dagelijkse-alert",
  woningalert: "/dagelijkse-alert",
  "nieuw aanbod": "/nieuw-aanbod",
  "woningen zoeken": "/zoeken",
  "woning zoeken": "/zoeken",
  huurwoning: "/huurwoningen",
  koopwoning: "/koopwoningen",
  kamers: "/kamers",
  "studio huren": "/studios",
  "huis kopen": "/koopwoningen",
  "huis huren": "/huurwoningen",
  woningmarkt: "/blog",
  "budget tool": "/budget-tool",
  huurprijsmonitor: "/huurprijsmonitor",
};

/**
 * Adds internal links to blog HTML content.
 * Only links the first occurrence of each term.
 * Skips content already inside <a>, <h1>-<h6>, or <script> tags.
 */
export function addBlogAutoLinks(html: string): string {
  let result = html;
  const linkedTerms = new Set<string>();

  // Combined map: cities + keywords
  const allLinks = { ...KEYWORD_LINKS, ...CITY_LINKS };

  for (const [term, href] of Object.entries(allLinks)) {
    if (linkedTerms.has(term)) continue;

    // Match the term only when NOT inside an existing tag attribute or anchor
    const regex = new RegExp(
      `(?<![<\\/a-zA-Z"=])\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b(?![^<]*<\\/a>)(?![^<]*>)`,
      "i"
    );

    const match = result.match(regex);
    if (match && match.index !== undefined) {
      const before = result.slice(0, match.index);
      const after = result.slice(match.index + match[0].length);
      // Don't link if we're inside an HTML tag or anchor
      const lastOpenTag = before.lastIndexOf("<");
      const lastCloseTag = before.lastIndexOf(">");
      if (lastOpenTag > lastCloseTag) continue; // inside a tag

      result = `${before}<a href="https://www.woonpeek.nl${href}" title="${term} op WoonPeek">${match[0]}</a>${after}`;
      linkedTerms.add(term);
    }
  }

  return result;
}
