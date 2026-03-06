
-- Create daisycon_tokens table for storing OAuth tokens
CREATE TABLE public.daisycon_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daisycon_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on daisycon_tokens"
ON public.daisycon_tokens FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view daisycon_tokens"
ON public.daisycon_tokens FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create daisycon_feeds table for configuring which feeds to import
CREATE TABLE public.daisycon_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  program_id integer NOT NULL,
  media_id integer NOT NULL,
  feed_url text,
  is_active boolean NOT NULL DEFAULT true,
  last_import_at timestamp with time zone,
  properties_imported integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daisycon_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on daisycon_feeds"
ON public.daisycon_feeds FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage daisycon_feeds"
ON public.daisycon_feeds FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Clean up old scraper data
DELETE FROM public.scraper_logs;
DELETE FROM public.scraped_properties;
DELETE FROM public.scrapers;
