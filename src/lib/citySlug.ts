/**
 * Canonical slug-helper voor Nederlandse plaatsnamen.
 *
 * Normaliseert varianten zoals "'s-Heerenberg", "’s-Heerenberg", "s Heerenberg",
 * "Bergen (NH)" / "Bergen NH", "Sint-Annaland" / "Sint Annaland", accenten
 * (Súdwest-Fryslân) en dubbele spaties tot één vergelijkbare sleutel.
 *
 * Doel: voorkom dubbele of "ontbrekende" plaatsen in de codelijst en in
 * `extra_cities` doordat we dezelfde plaats nooit twee keer zien staan.
 */
export const citySlug = (raw: string): string => {
  if (!raw) return "";
  let s = raw;

  // 1) Unicode normalisatie + alle accenten weghalen.
  s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  // 2) Verschillende quote-stijlen gelijkschakelen.
  s = s.replace(/[’‘‛`´]/g, "'");

  // 3) Lowercasen + trimmen.
  s = s.toLowerCase().trim();

  // 4) Het oer-Hollandse "'s-" / "'t-" voorvoegsel uniformeren naar "s-" / "t-".
  //    "'s-heerenberg" -> "s-heerenberg", "'t harde" -> "t harde".
  s = s.replace(/^['‘’]([st])[\s-]/, "$1-");

  // 5) Provincie-aanduidingen tussen haakjes wegslijpen, want "Bergen (NH)"
  //    en "Bergen NH" en "Bergen-NH" horen samen te vallen.
  //    Eerst expliciet bekende suffixen als platte tekst weghalen,
  //    dan losse haakjes.
  s = s.replace(
    /[\s-]*\(?\s*(nh|zh|nb|gld|ov|fr|gr|dr|fl|ut|li|l|ze|stw|veere)\s*\)?$/i,
    "",
  );
  s = s.replace(/\s*\([^)]*\)\s*/g, " ");

  // 6) Alle niet-alfanumerieke tekens (spaties, koppeltekens, punten,
   //   apostrofs, …) vervangen door één hyphen.
  s = s.replace(/[^a-z0-9]+/g, "-");

  // 7) Dubbele en hangende hyphens opruimen.
  s = s.replace(/-+/g, "-").replace(/^-+|-+$/g, "");

  return s;
};

/**
 * Bepaal of twee plaatsnamen dezelfde plaats zijn (op basis van slug).
 */
export const isSameCity = (a: string, b: string): boolean =>
  citySlug(a) === citySlug(b);