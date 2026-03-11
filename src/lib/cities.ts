export const cityToSlug = (city: string) =>
  city
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

export const citySlugToName = (slug: string) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const cityPath = (city: string) => `/woningen-${cityToSlug(city)}`;
