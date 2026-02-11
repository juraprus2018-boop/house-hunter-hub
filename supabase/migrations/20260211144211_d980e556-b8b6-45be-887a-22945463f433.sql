
-- Enable extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add last_seen_at to scraped_properties to track when a listing was last seen
ALTER TABLE public.scraped_properties 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing rows
UPDATE public.scraped_properties SET last_seen_at = updated_at WHERE last_seen_at IS NULL;
