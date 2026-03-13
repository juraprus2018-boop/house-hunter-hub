
CREATE TABLE public.facebook_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_url text NOT NULL,
  city text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.facebook_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage facebook_groups" ON public.facebook_groups
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access on facebook_groups" ON public.facebook_groups
  FOR ALL TO public
  USING (auth.role() = 'service_role'::text);
