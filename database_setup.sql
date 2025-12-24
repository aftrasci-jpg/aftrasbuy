-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[],
  videos TEXT[],
  pdf_url TEXT,
  pricing JSONB,
  cost_details JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create settings table for site-wide settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create carousel_images table for homepage slider
CREATE TABLE carousel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
-- Public can read active products
CREATE POLICY "Public read products" ON products
FOR SELECT USING (is_active = true);

-- Admin can manage products (authenticated users assumed to be admin)
CREATE POLICY "Admin manage products" ON products
FOR ALL USING (auth.jwt() IS NOT NULL);

-- RLS Policies for categories
-- Public can read categories
CREATE POLICY "Public read categories" ON categories
FOR SELECT USING (true);

-- Admin can manage categories
CREATE POLICY "Admin manage categories" ON categories
FOR ALL USING (auth.jwt() IS NOT NULL);

-- RLS Policies for agents
-- Public cannot access agents (only admin)
CREATE POLICY "Admin manage agents" ON agents
FOR ALL USING (auth.jwt() IS NOT NULL);

-- RLS Policies for settings
-- Only admin can manage settings
CREATE POLICY "Admin manage settings" ON settings
FOR ALL USING (auth.jwt() IS NOT NULL);

-- RLS Policies for carousel_images
-- Public can read active carousel images
CREATE POLICY "Public read carousel_images" ON carousel_images
FOR SELECT USING (is_active = true);

-- Admin can manage carousel images
CREATE POLICY "Admin manage carousel_images" ON carousel_images
FOR ALL USING (auth.jwt() IS NOT NULL);

-- Create storage bucket 'catalogue' (run in Supabase SQL Editor or via API)
-- Note: Bucket creation might need to be done via dashboard or API, but policies can be set after.

-- Storage policies for 'catalogue' bucket
-- Public read
CREATE POLICY "Public read catalogue" ON storage.objects
FOR SELECT USING (bucket_id = 'catalogue');

-- Admin write (authenticated users)
CREATE POLICY "Admin manage catalogue" ON storage.objects
FOR ALL USING (bucket_id = 'catalogue' AND auth.jwt() IS NOT NULL);
