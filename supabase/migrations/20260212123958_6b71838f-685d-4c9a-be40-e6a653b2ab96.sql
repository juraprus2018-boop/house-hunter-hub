
-- Add slug column
ALTER TABLE public.properties ADD COLUMN slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX idx_properties_slug ON public.properties(slug) WHERE slug IS NOT NULL;

-- Function to generate slug from property data
CREATE OR REPLACE FUNCTION public.generate_property_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Build slug: street-housenumber-city
  base_slug := lower(
    coalesce(NEW.street, '') || '-' ||
    coalesce(NEW.house_number, '') || '-' ||
    coalesce(NEW.city, '')
  );
  
  -- Clean: replace spaces/special chars with hyphens, remove non-alphanumeric
  base_slug := regexp_replace(base_slug, '[^a-z0-9-]', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If slug is empty, use id
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := NEW.id::text;
  END IF;
  
  -- Try base slug, then add counter for uniqueness
  final_slug := base_slug;
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.properties WHERE slug = final_slug AND id != NEW.id
    );
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$function$;

-- Trigger on insert and update
CREATE TRIGGER generate_slug_on_insert
BEFORE INSERT ON public.properties
FOR EACH ROW
WHEN (NEW.slug IS NULL)
EXECUTE FUNCTION public.generate_property_slug();

CREATE TRIGGER generate_slug_on_update
BEFORE UPDATE ON public.properties
FOR EACH ROW
WHEN (NEW.slug IS NULL OR (NEW.street IS DISTINCT FROM OLD.street) OR (NEW.house_number IS DISTINCT FROM OLD.house_number) OR (NEW.city IS DISTINCT FROM OLD.city))
EXECUTE FUNCTION public.generate_property_slug();

-- Generate slugs for all existing properties
UPDATE public.properties SET slug = NULL WHERE slug IS NULL;
