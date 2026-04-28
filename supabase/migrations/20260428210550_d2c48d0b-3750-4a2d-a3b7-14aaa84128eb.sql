CREATE OR REPLACE FUNCTION public.get_city_counts()
RETURNS TABLE(city text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT TRIM(city) AS city, COUNT(*)::bigint AS count
  FROM public.properties
  WHERE status = 'actief'
    AND city IS NOT NULL
    AND TRIM(city) <> ''
    AND TRIM(city) <> 'Onbekend'
  GROUP BY TRIM(city)
  ORDER BY count DESC;
$$;