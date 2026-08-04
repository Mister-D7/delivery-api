-- ═══════════════════════════════════════════════════════════
-- COMBOS / BUNDLES — additive, idempotent schema
-- Run once in the Supabase SQL editor (or via /setup/supabase/init)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS delivery_combos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  products JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at trigger (mirrors existing pattern)
DO $do$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE FUNCTION update_updated_at() RETURNS TRIGGER AS $func$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $do$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_combos_updated') THEN
    CREATE TRIGGER trigger_combos_updated BEFORE UPDATE ON delivery_combos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- RLS: all access goes through the Express server with the service key,
-- so only service_role needs access. No public/anon grants required.
ALTER TABLE delivery_combos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON delivery_combos;
CREATE POLICY "Service role full access" ON delivery_combos FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON delivery_combos TO service_role;
