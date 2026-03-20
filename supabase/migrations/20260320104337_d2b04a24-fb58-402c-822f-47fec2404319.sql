
-- Add city column (required for new subscriptions, nullable for existing rows)
ALTER TABLE public.daily_alert_subscribers
ADD COLUMN IF NOT EXISTS city text;

-- Add phone number for WhatsApp
ALTER TABLE public.daily_alert_subscribers
ADD COLUMN IF NOT EXISTS phone_number text;

-- Add WhatsApp preference
ALTER TABLE public.daily_alert_subscribers
ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT false;

-- Add unique constraint on email (needed for upsert if not already present)
-- This is idempotent - will skip if already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_alert_subscribers_email_key'
  ) THEN
    ALTER TABLE public.daily_alert_subscribers ADD CONSTRAINT daily_alert_subscribers_email_key UNIQUE (email);
  END IF;
END $$;
