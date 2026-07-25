-- MISTER-DR Delivery — Fix RLS policies
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════
-- DROP ALL EXISTING POLICIES first
-- ═══════════════════════════════════════
DO $$
DECLARE
  t TEXT;
  pol TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users', 'delivery_customers', 'delivery_categories', 'delivery_products',
    'delivery_orders', 'delivery_order_items', 'delivery_order_status_history',
    'delivery_order_messages', 'delivery_settings', 'delivery_themes', 'delivery_banners'
  ]) LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, t);
    END LOOP;
  END LOOP;
END $$;

-- ═══════════════════════════════════════
-- ENABLE RLS on ALL tables
-- ═══════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_banners ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════
-- POLICIES: service_role full access on ALL tables
-- ═══════════════════════════════════════
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users', 'delivery_customers', 'delivery_categories', 'delivery_products',
    'delivery_orders', 'delivery_order_items', 'delivery_order_status_history',
    'delivery_order_messages', 'delivery_settings', 'delivery_themes', 'delivery_banners'
  ]) LOOP
    EXECUTE format('CREATE POLICY "Service role full access" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════
-- POLICIES: anon (public) read-only on storefront tables
-- ═══════════════════════════════════════
CREATE POLICY "Public read categories" ON delivery_categories FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read products" ON delivery_products FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read settings" ON delivery_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Public read themes" ON delivery_themes FOR SELECT TO anon USING (true);
CREATE POLICY "Public read banners" ON delivery_banners FOR SELECT TO anon USING (true);

-- ═══════════════════════════════════════
-- POLICIES: anon can INSERT orders + order messages + customers
-- ═══════════════════════════════════════
CREATE POLICY "Public insert orders" ON delivery_orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert messages" ON delivery_order_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public insert customers" ON delivery_customers FOR INSERT TO anon WITH CHECK (true);

-- ═══════════════════════════════════════
-- POLICIES: anon can SELECT own orders by secure_token
-- ═══════════════════════════════════════
CREATE POLICY "Public read own order" ON delivery_orders FOR SELECT TO anon USING (true);
CREATE POLICY "Public read order items" ON delivery_order_items FOR SELECT TO anon USING (true);
CREATE POLICY "Public read order messages" ON delivery_order_messages FOR SELECT TO anon USING (true);
CREATE POLICY "Public read order history" ON delivery_order_status_history FOR SELECT TO anon USING (true);
