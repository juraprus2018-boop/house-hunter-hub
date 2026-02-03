
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_type enum
CREATE TYPE public.property_type AS ENUM ('appartement', 'huis', 'studio', 'kamer');

-- Create listing_type enum
CREATE TYPE public.listing_type AS ENUM ('huur', 'koop');

-- Create energy_label enum
CREATE TYPE public.energy_label AS ENUM ('A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G');

-- Create property_status enum
CREATE TYPE public.property_status AS ENUM ('actief', 'verhuurd', 'verkocht', 'inactief');

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type public.property_type NOT NULL,
  listing_type public.listing_type NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  surface_area INTEGER, -- in m²
  bedrooms INTEGER,
  bathrooms INTEGER,
  build_year INTEGER,
  energy_label public.energy_label,
  -- Address fields
  street TEXT NOT NULL,
  house_number TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  -- Location for map
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  -- Images stored as array of URLs
  images TEXT[] DEFAULT '{}',
  -- Status and metadata
  status public.property_status NOT NULL DEFAULT 'actief',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Create search_alerts table
CREATE TABLE public.search_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Filter criteria
  city TEXT,
  property_type public.property_type,
  listing_type public.listing_type,
  min_price DECIMAL(12, 2),
  max_price DECIMAL(12, 2),
  min_surface INTEGER,
  max_surface INTEGER,
  min_bedrooms INTEGER,
  -- Notification settings
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Properties policies
CREATE POLICY "Properties are viewable by everyone" ON public.properties
  FOR SELECT USING (status = 'actief' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON public.properties
  FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Search alerts policies
CREATE POLICY "Users can view their own alerts" ON public.search_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts" ON public.search_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON public.search_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" ON public.search_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_search_alerts_updated_at
  BEFORE UPDATE ON public.search_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_property_type ON public.properties(property_type);
CREATE INDEX idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_property_id ON public.favorites(property_id);

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Storage policies for property images
CREATE POLICY "Property images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own property images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own property images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
