
-- Add column to track when a property was posted to Facebook
ALTER TABLE public.properties ADD COLUMN facebook_posted_at timestamp with time zone DEFAULT NULL;
