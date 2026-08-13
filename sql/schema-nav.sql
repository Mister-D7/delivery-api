-- MISTER-DR Delivery — Navigation (main/sub categories)
-- Add hierarchy + navigation flags to categories.
-- Run in Supabase SQL Editor, or automatically via: node server/scripts/apply-nav-migration.mjs

ALTER TABLE delivery_categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES delivery_categories(id) ON DELETE SET NULL;
ALTER TABLE delivery_categories ADD COLUMN IF NOT EXISTS is_nav BOOLEAN DEFAULT false;
ALTER TABLE delivery_categories ADD COLUMN IF NOT EXISTS is_top BOOLEAN DEFAULT false;
ALTER TABLE delivery_categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE delivery_categories ADD COLUMN IF NOT EXISTS nav_order INTEGER DEFAULT 0;
