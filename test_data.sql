-- Sample test data for catalog system
-- Run this in Supabase SQL Editor AFTER running database_setup.sql
-- This only contains INSERT statements (no CREATE TABLE)

-- Insert categories (skip if already exist)
INSERT INTO categories (name, description) VALUES
('Électronique', 'Produits électroniques et gadgets'),
('Mobilier', 'Meubles et décoration')
ON CONFLICT DO NOTHING;

-- Insert agents (skip if already exist)
INSERT INTO agents (name, whatsapp_number, slug) VALUES
('Jean Dupont', '+22501020304', 'jean-dupont'),
('Marie Konan', '+22505060708', 'marie-konan')
ON CONFLICT DO NOTHING;

-- Insert settings (skip if already exist)
INSERT INTO settings (key, value) VALUES
('site_whatsapp', '+22507080910')
ON CONFLICT (key) DO NOTHING;

-- Insert products with pricing tiers and cost details
INSERT INTO products (name, short_description, description, category_id, images, videos, pricing, cost_details) VALUES
(
  'Ordinateur Portable Gaming',
  'PC portable haute performance',
  'Ordinateur portable gaming avec processeur Intel i7, 16GB RAM, carte graphique RTX 3060. Parfait pour le gaming et le travail créatif.',
  (SELECT id FROM categories WHERE name = 'Électronique'),
  ARRAY['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop'],
  ARRAY[]::TEXT[],
  '[
    {"min_qty": 1, "max_qty": 5, "price": 1200},
    {"min_qty": 6, "max_qty": 10, "price": 1100},
    {"min_qty": 11, "max_qty": 20, "price": 1050}
  ]'::jsonb,
  '{"taxes": 120, "transport": 80, "dedouanement": 60}'
),
(
  'Smartphone Android',
  'Téléphone dernier cri',
  'Smartphone Android 128GB avec écran AMOLED 6.5", triple caméra 64MP, batterie 5000mAh. Résistant à l''eau IP68.',
  (SELECT id FROM categories WHERE name = 'Électronique'),
  ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop'],
  ARRAY[]::TEXT[],
  '[
    {"min_qty": 1, "max_qty": 10, "price": 350},
    {"min_qty": 11, "max_qty": 50, "price": 320},
    {"min_qty": 51, "max_qty": 100, "price": 300}
  ]'::jsonb,
  '{"taxes": 35, "transport": 25, "dedouanement": 20}'
),
(
  'Bureau en bois',
  'Bureau ergonomique',
  'Bureau en bois massif avec finition chêne, dimensions 160x80cm, tiroirs intégrés. Design moderne et fonctionnel.',
  (SELECT id FROM categories WHERE name = 'Mobilier'),
  ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'],
  ARRAY[]::TEXT[],
  '[
    {"min_qty": 1, "max_qty": 5, "price": 450},
    {"min_qty": 6, "max_qty": 15, "price": 420},
    {"min_qty": 16, "max_qty": 30, "price": 400}
  ]'::jsonb,
  '{"taxes": 45, "transport": 120, "dedouanement": 80}'
),
(
  'Chaise de bureau',
  'Chaise ergonomique pivotante',
  'Chaise de bureau ergonomique avec soutien lombaire réglable, accoudoirs ajustables, revêtement mesh respirant.',
  (SELECT id FROM categories WHERE name = 'Mobilier'),
  ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'],
  ARRAY[]::TEXT[],
  '[
    {"min_qty": 1, "max_qty": 10, "price": 180},
    {"min_qty": 11, "max_qty": 25, "price": 165},
    {"min_qty": 26, "max_qty": 50, "price": 150}
  ]'::jsonb,
  '{"taxes": 18, "transport": 40, "dedouanement": 25}'
);

-- Update created_at timestamps for better display
UPDATE categories SET created_at = now() - interval '2 days';
UPDATE agents SET created_at = now() - interval '1 day';
UPDATE settings SET created_at = now() - interval '3 days', updated_at = now();
UPDATE products SET created_at = now() - interval '1 day' WHERE name LIKE '%Ordinateur%';
UPDATE products SET created_at = now() - interval '2 hours' WHERE name LIKE '%Smartphone%';
UPDATE products SET created_at = now() - interval '6 hours' WHERE name LIKE '%Bureau%';
UPDATE products SET created_at = now() WHERE name LIKE '%Chaise%';
