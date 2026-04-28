CREATE OR REPLACE FUNCTION public.get_home_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'properties_count', (SELECT COUNT(*) FROM properties WHERE status = 'actief'),
    'users_count', (SELECT COUNT(*) FROM profiles),
    'cities_count', (
      SELECT COUNT(DISTINCT TRIM(city))
      FROM properties
      WHERE status = 'actief'
        AND city IS NOT NULL
        AND TRIM(city) <> ''
        AND TRIM(city) <> 'Onbekend'
    )
  );
$$;