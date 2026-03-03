CREATE TABLE public.daily_alert_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  source text DEFAULT 'guest',
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  last_notified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_alert_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.daily_alert_subscribers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own subscription" ON public.daily_alert_subscribers
  FOR SELECT USING (auth.uid() = user_id);