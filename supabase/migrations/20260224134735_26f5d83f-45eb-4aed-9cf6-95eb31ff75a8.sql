
-- Add schedule configuration to scrapers table
ALTER TABLE public.scrapers 
ADD COLUMN schedule_interval text NOT NULL DEFAULT 'daily',
ADD COLUMN schedule_days integer[] DEFAULT NULL,
ADD COLUMN last_scheduled_run date DEFAULT NULL;

-- schedule_interval: 'daily', 'weekly', 'manual'
-- schedule_days: for weekly, which days (0=Sunday, 1=Monday, etc.)
-- last_scheduled_run: track when last automatic run happened

COMMENT ON COLUMN public.scrapers.schedule_interval IS 'How often to run: daily, weekly, or manual';
COMMENT ON COLUMN public.scrapers.schedule_days IS 'For weekly: array of day numbers (0=Sun, 1=Mon, ..., 6=Sat)';
