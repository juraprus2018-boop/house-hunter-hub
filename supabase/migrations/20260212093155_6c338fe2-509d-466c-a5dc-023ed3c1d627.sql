
-- Drop old RLS policy and create new one that allows viewing ALL properties (including inactive) by everyone
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;

CREATE POLICY "Properties are viewable by everyone"
ON public.properties
FOR SELECT
USING (true);
