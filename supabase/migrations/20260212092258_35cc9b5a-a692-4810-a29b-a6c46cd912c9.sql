-- Add source_site column to properties
ALTER TABLE public.properties ADD COLUMN source_site text;

-- Backfill from scraped_properties
UPDATE public.properties p
SET source_site = sp.source_site
FROM public.scraped_properties sp
WHERE sp.published_property_id = p.id;
