-- ═══════════════════════════════════════════════════════════
-- COUPONS / LOYALTY (fidelity) — additive, idempotent schema
-- Run once in the Supabase SQL editor (or via /setup/supabase/init)
-- ═══════════════════════════════════════════════════════════

-- Coupon table
CREATE TABLE IF NOT EXISTS delivery_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percent','fixed')),
  value NUMERIC DEFAULT 0,
  min_order NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  max_uses INT DEFAULT 1,
  used_count INT DEFAULT 0,
  customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store coupon info on the order (additive)
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS coupon_id UUID;
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- updated_at trigger (mirrors existing pattern)
DO $do$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE FUNCTION update_updated_at() RETURNS TRIGGER AS $func$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $do$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_coupons_updated') THEN
    CREATE TRIGGER trigger_coupons_updated BEFORE UPDATE ON delivery_coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Atomic usage guard: increments used_count only while a slot remains.
-- Returns one row when the coupon was consumed, zero rows when the
-- coupon is already at its usage limit (prevents double-use under concurrency).
CREATE OR REPLACE FUNCTION consume_coupon_usage(p_coupon_id UUID)
RETURNS TABLE (id UUID, used_count INT, max_uses INT) AS $$
  UPDATE delivery_coupons
  SET used_count = used_count + 1
  WHERE id = p_coupon_id AND used_count < max_uses
  RETURNING id, used_count, max_uses
$$ LANGUAGE sql VOLATILE;

-- RLS: all access goes through the Express server with the service key,
-- so only service_role needs access. No public/anon grants required.
ALTER TABLE delivery_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON delivery_coupons;
CREATE POLICY "Service role full access" ON delivery_coupons FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON delivery_coupons TO service_role;
