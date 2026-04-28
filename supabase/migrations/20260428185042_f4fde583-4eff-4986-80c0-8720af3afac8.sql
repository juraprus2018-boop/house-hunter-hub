CREATE TABLE IF NOT EXISTS public.tiktok_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  open_id text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  scope text,
  expires_at timestamptz NOT NULL,
  refresh_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tiktok_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view tiktok tokens"
  ON public.tiktok_oauth_tokens FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access tiktok tokens"
  ON public.tiktok_oauth_tokens FOR ALL
  USING (auth.role() = 'service_role'::text);

CREATE TRIGGER tiktok_oauth_tokens_updated_at
  BEFORE UPDATE ON public.tiktok_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tiktok_posts
  ADD COLUMN IF NOT EXISTS publish_id text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS error_message text;

CREATE INDEX IF NOT EXISTS idx_tiktok_posts_property_id ON public.tiktok_posts(property_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_posts_posted_at ON public.tiktok_posts(posted_at DESC);