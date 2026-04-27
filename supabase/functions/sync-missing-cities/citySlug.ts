/**
 * Edge-function copy van src/lib/citySlug.ts. Bewaar deze 1-op-1 in sync.
 */
export const citySlug = (raw: string): string => {
  if (!raw) return "";
  let s = raw;
  s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/[’‘‛`´]/g, "'");
  s = s.toLowerCase().trim();
  s = s.replace(/^['‘’]([st])[\s-]/, "$1-");
  s = s.replace(/\s*\(([^)]+)\)\s*/g, " $1 ");
  s = s.replace(/[^a-z0-9]+/g, "-");
  s = s.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return s;
};