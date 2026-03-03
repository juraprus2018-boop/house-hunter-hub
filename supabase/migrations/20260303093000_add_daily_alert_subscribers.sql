CREATE TABLE public.daily_alert_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'website',
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  unsubscribed_at timestamp with time zone NULL,
  last_notified_at timestamp with time zone NULL,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_daily_alert_subscribers_email_unique
  ON public.daily_alert_subscribers (email);

CREATE UNIQUE INDEX idx_daily_alert_subscribers_unsubscribe_token_unique
  ON public.daily_alert_subscribers (unsubscribe_token);

CREATE INDEX idx_daily_alert_subscribers_active
  ON public.daily_alert_subscribers (is_active);

ALTER TABLE public.daily_alert_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view daily alert subscribers"
ON public.daily_alert_subscribers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_daily_alert_subscribers_updated_at
  BEFORE UPDATE ON public.daily_alert_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
