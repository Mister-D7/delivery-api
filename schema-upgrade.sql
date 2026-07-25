-- MISTER-DR Delivery — Schema Upgrade
-- Run this in Supabase SQL Editor if auto-migration fails

-- ═══════════════════════════════════════
-- THEMES
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS delivery_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#7C5CFC',
  accent_color TEXT DEFAULT '#43E6FF',
  bg_color TEXT DEFAULT '#0B0E1A',
  surface_color TEXT DEFAULT '#111827',
  text_color TEXT DEFAULT '#F4F4F5',
  font_family TEXT DEFAULT 'Inter',
  border_style TEXT DEFAULT 'sharp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- BANNERS
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS delivery_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- FLASH SALE COLUMNS ON products
-- ═══════════════════════════════════════
ALTER TABLE delivery_products ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT false;
ALTER TABLE delivery_products ADD COLUMN IF NOT EXISTS flash_sale_price NUMERIC;
ALTER TABLE delivery_products ADD COLUMN IF NOT EXISTS flash_sale_end_date TIMESTAMPTZ;
ALTER TABLE delivery_products ADD COLUMN IF NOT EXISTS promo_end_date TIMESTAMPTZ;

-- ═══════════════════════════════════════
-- MEDIA COLUMNS ON messages
-- ═══════════════════════════════════════
ALTER TABLE delivery_order_messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE delivery_order_messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ═══════════════════════════════════════
-- DISABLE RLS + GRANT on new tables
-- ═══════════════════════════════════════
ALTER TABLE delivery_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_banners DISABLE ROW LEVEL SECURITY;

GRANT ALL ON delivery_themes TO service_role;
GRANT ALL ON delivery_banners TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON delivery_themes TO anon;
GRANT SELECT ON delivery_banners TO anon;
