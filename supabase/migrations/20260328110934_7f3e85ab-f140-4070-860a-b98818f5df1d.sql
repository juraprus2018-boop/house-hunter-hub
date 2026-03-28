
-- Performance indexes for properties table
-- Composite index for the most common query pattern: active properties by city
CREATE INDEX IF NOT EXISTS idx_properties_status_city ON public.properties (status, city);

-- Composite index for listing type filtering
CREATE INDEX IF NOT EXISTS idx_properties_status_listing_type ON public.properties (status, listing_type);

-- Composite index for property type filtering  
CREATE INDEX IF NOT EXISTS idx_properties_status_property_type ON public.properties (status, property_type);

-- Index for sorting by created_at (used in almost every query)
CREATE INDEX IF NOT EXISTS idx_properties_status_created_at ON public.properties (status, created_at DESC);

-- Slug lookup (used for property detail pages)
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties (slug) WHERE slug IS NOT NULL;

-- Composite index for city + listing_type + status (used on city landing pages)
CREATE INDEX IF NOT EXISTS idx_properties_city_listing_status ON public.properties (city, listing_type, status);

-- Index for price filtering
CREATE INDEX IF NOT EXISTS idx_properties_status_price ON public.properties (status, price);

-- Blog posts published lookup
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON public.blog_posts (status, published_at DESC);

-- Daily alert subscribers active lookup
CREATE INDEX IF NOT EXISTS idx_daily_alert_active ON public.daily_alert_subscribers (is_active) WHERE is_active = true;

-- Search alerts active lookup
CREATE INDEX IF NOT EXISTS idx_search_alerts_active ON public.search_alerts (is_active) WHERE is_active = true;
