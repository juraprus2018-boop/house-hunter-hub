
-- Add source_url to properties table for direct access without admin-only scraped_properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS source_url text;
