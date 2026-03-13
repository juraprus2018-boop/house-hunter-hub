
CREATE TABLE public.facebook_group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.facebook_groups(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  posted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, property_id)
);

ALTER TABLE public.facebook_group_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage facebook_group_posts"
  ON public.facebook_group_posts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access on facebook_group_posts"
  ON public.facebook_group_posts FOR ALL
  TO public
  USING (auth.role() = 'service_role'::text);
