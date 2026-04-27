-- Canonical slug for cross-spelling deduplication.
CREATE OR REPLACE FUNCTION public.canonical_city_slug(_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  s text := _name;
BEGIN
  IF s IS NULL THEN RETURN ''; END IF;
  -- Lowercase + trim
  s := lower(btrim(s));
  -- Strip common diacritics (subset; matches frontend NFKD strip well enough)
  s := translate(
    s,
    'àáâãäåāăąèéêëēĕėęěìíîïĩīĭįòóôõöøōŏőùúûüũūŭůűųñçčćýÿ',
    'aaaaaaaaaeeeeeeeeeiiiiiiiioooooooooouuuuuuuuuunccccyy'
  );
  -- Smart quotes -> apostrophe
  s := regexp_replace(s, '[\u2018\u2019\u201B\u0060\u00B4]', '''', 'g');
  -- "'s-" / "'t-" prefix uniformeren naar "s-" / "t-"
  s := regexp_replace(s, '^''([st])[ \-]', '\1-');
  -- Haakjes-suffix normaliseren (provincie behouden)
  s := regexp_replace(s, '\s*\(([^)]+)\)\s*', ' \1 ', 'g');
  -- Niet-alfanumeriek -> hyphen
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  -- Dubbele en hangende hyphens opruimen
  s := regexp_replace(s, '-+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  RETURN s;
END;
$$;

ALTER TABLE public.extra_cities
  ADD COLUMN slug text GENERATED ALWAYS AS (public.canonical_city_slug(name)) STORED;

CREATE UNIQUE INDEX extra_cities_slug_unique ON public.extra_cities (slug);