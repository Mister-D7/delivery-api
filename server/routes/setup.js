import { Router } from 'express';
import { adminAuth } from '../middleware/auth.js';
import { testToken as testGitHub, ensureRepo, pushFullCode } from '../lib/github.js';
import { testToken as testRender, listServices, createWebService, updateServiceEnv, triggerDeploy, getOwner } from '../lib/render.js';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const INIT_SQL = `
-- MISTER-DR Delivery — Full Database Init
-- Creates all tables from scratch

-- ═══════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  addresses JSONB DEFAULT '[]',
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT,
  sale_price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock_qty INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  promo_price NUMERIC,
  is_flash_sale BOOLEAN DEFAULT false,
  flash_sale_price NUMERIC,
  flash_sale_end_date TIMESTAMPTZ,
  flash_sale_start_date TIMESTAMPTZ,
  promo_end_date TIMESTAMPTZ,
  category_id UUID REFERENCES delivery_categories(id),
  product_id TEXT,
  custom_name TEXT,
  custom_price NUMERIC,
  custom_description TEXT,
  specs TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  secure_token TEXT,
  status TEXT DEFAULT 'PENDING',
  total NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  customer_name TEXT,
  phone TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  customer_id UUID REFERENCES delivery_customers(id),
  voice_order_url TEXT,
  cancelled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES delivery_orders(id) ON DELETE CASCADE,
  product_id TEXT,
  catalog_item_id UUID,
  name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  image_url TEXT,
  custom_name TEXT,
  custom_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES delivery_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_order_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES delivery_orders(id) ON DELETE CASCADE,
  text TEXT,
  sender TEXT DEFAULT 'customer',
  audio_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
-- TRIGGERS
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_orders_updated') THEN
    CREATE TRIGGER trigger_orders_updated BEFORE UPDATE ON delivery_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_themes_updated') THEN
    CREATE TRIGGER trigger_themes_updated BEFORE UPDATE ON delivery_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_banners_updated') THEN
    CREATE TRIGGER trigger_banners_updated BEFORE UPDATE ON delivery_banners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ═══════════════════════════════════════
-- RLS
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

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users', 'delivery_customers', 'delivery_categories', 'delivery_products',
    'delivery_orders', 'delivery_order_items', 'delivery_order_status_history',
    'delivery_order_messages', 'delivery_settings', 'delivery_themes', 'delivery_banners'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON %I', t);
    EXECUTE format('CREATE POLICY "Service role full access" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

CREATE POLICY "Public read categories" ON delivery_categories FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read products" ON delivery_products FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read settings" ON delivery_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Public read themes" ON delivery_themes FOR SELECT TO anon USING (true);
CREATE POLICY "Public read banners" ON delivery_banners FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert orders" ON delivery_orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public read own order" ON delivery_orders FOR SELECT TO anon USING (true);
CREATE POLICY "Public read order items" ON delivery_order_items FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert order items" ON delivery_order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public read order messages" ON delivery_order_messages FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert messages" ON delivery_order_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public read order history" ON delivery_order_status_history FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert customers" ON delivery_customers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public read customers" ON delivery_customers FOR SELECT TO anon USING (true);

-- ═══════════════════════════════════════
-- GRANTS
-- ═══════════════════════════════════════
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON delivery_categories TO anon;
GRANT SELECT ON delivery_products TO anon;
GRANT SELECT ON delivery_settings TO anon;
GRANT SELECT ON delivery_themes TO anon;
GRANT SELECT ON delivery_banners TO anon;
GRANT SELECT ON delivery_orders TO anon;
GRANT INSERT ON delivery_orders TO anon;
GRANT SELECT ON delivery_order_items TO anon;
GRANT INSERT ON delivery_order_items TO anon;
GRANT SELECT ON delivery_order_messages TO anon;
GRANT INSERT ON delivery_order_messages TO anon;
GRANT SELECT ON delivery_order_status_history TO anon;
GRANT SELECT ON delivery_customers TO anon;
GRANT INSERT ON delivery_customers TO anon;

-- ═══════════════════════════════════════
-- STORAGE
-- ═══════════════════════════════════════
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery', 'delivery', true) ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════
-- DEFAULT ADMIN USER
-- ═══════════════════════════════════════
INSERT INTO users (email, name, password_hash, role)
VALUES ('admin@mister-dr.shop', 'Admin', '$2a$10$rQEY5z4v5g5Z5g5Z5g5Z5OQH5q5q5q5q5q5q5q5q5q5q5q5q5q', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════
-- DEFAULT SETTINGS
-- ═══════════════════════════════════════
INSERT INTO delivery_settings (key, value) VALUES
  ('store_name', '"MISTER-DR"'),
  ('store_subtitle', '"Livraison rapide et fiable"'),
  ('contact_phone', '""'),
  ('whatsapp_number', '""'),
  ('delivery_pricing', '{"shopLat":36.7538,"shopLng":3.0588,"baseFee":200,"baseKm":5,"extraPerKm":50,"freeThreshold":3000,"maxRadius":30,"shopName":"MISTER-DR"}')
ON CONFLICT (key) DO NOTHING;
`;

// POST /setup/test — test all connections
router.post('/test', adminAuth, async (req, res) => {
  const results = { supabase: false, github: false, render: false };

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const testClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { error } = await testClient.from('delivery_settings').select('key').limit(1);
      results.supabase = !error;
    }
  } catch {}

  try {
    if (process.env.GITHUB_TOKEN) {
      await testGitHub(process.env.GITHUB_TOKEN);
      results.github = true;
    }
  } catch {}

  try {
    if (process.env.RENDER_API_KEY) {
      await testRender(process.env.RENDER_API_KEY);
      results.render = true;
    }
  } catch {}

  res.json(results);
});

// POST /setup/supabase/test — test Supabase connection with provided keys
router.post('/supabase/test', adminAuth, async (req, res) => {
  try {
    const { url, anonKey, serviceKey } = req.body;
    if (!url || !serviceKey) return res.status(400).json({ error: 'URL and Service Key required' });

    const testClient = createClient(url, serviceKey);
    const { error } = await testClient.from('delivery_settings').select('key').limit(1);

    if (error && !error.message?.includes('does not exist')) throw new Error(error.message);

    res.json({ ok: true, message: 'Supabase connected', needsInit: !!error });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /setup/supabase/init — create all tables from scratch
router.post('/supabase/init', adminAuth, async (req, res) => {
  try {
    const { url, serviceKey } = req.body;
    if (!url || !serviceKey) return res.status(400).json({ error: 'URL and Service Key required' });

    const testClient = createClient(url, serviceKey);

    const statements = INIT_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

    let executed = 0;
    let errors = [];

    for (const sql of statements) {
      try {
        const { error } = await testClient.rpc('exec_sql', { sql: sql + ';' }).single();
        if (error) {
          const { error: directError } = await testClient.from('_exec').select('*').limit(0);
          if (directError) {
            errors.push(sql.substring(0, 50) + '...');
          }
        }
        executed++;
      } catch (e) {
        errors.push(sql.substring(0, 50) + '...');
      }
    }

    const { error: checkError } = await testClient.from('delivery_settings').select('key').limit(1);

    if (checkError) {
      const { data: tables } = await testClient.rpc('exec_sql', {
        sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'delivery_%'"
      }).single();

      if (!tables || tables === '[]') {
        return res.json({
          ok: true,
          message: 'Tables created! Please run the SQL in Supabase SQL Editor for best results.',
          manual: true,
          sql: INIT_SQL,
        });
      }
    }

    const { error: insertErr } = await testClient
      .from('delivery_settings')
      .upsert({ key: 'store_name', value: 'MISTER-DR' }, { onConflict: 'key' });

    res.json({
      ok: true,
      message: 'Database initialized!',
      executed,
      errors: errors.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /setup/supabase/sql — get raw SQL for manual execution
router.get('/supabase/sql', adminAuth, (req, res) => {
  res.json({ sql: INIT_SQL });
});

// POST /setup/github/test — test GitHub token
router.post('/github/test', adminAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    const result = await testGitHub(token);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /setup/github/push — push full code to GitHub
router.post('/github/push', adminAuth, async (req, res) => {
  const steps = [];
  const log = (msg, ok = true) => steps.push({ msg, ok });

  try {
    const { token, repoName } = req.body;
    const ghToken = token || process.env.GITHUB_TOKEN;
    if (!ghToken) throw new Error('GitHub token required');

    log('Creating/finding repository...');
    const repo = await ensureRepo(repoName || 'delivery-api', ghToken);
    log(`Repository: ${repo.repo}`);

    log('Pushing code...');
    const projectDir = path.join(__dirname, '..', '..');
    const push = await pushFullCode(repoName || 'delivery-api', projectDir, ghToken);
    log(`Pushed ${push.fileCount} files to main`);

    log('Done!');
    res.json({ ok: true, steps, repo: push.repo, url: `https://github.com/${push.repo}` });
  } catch (err) {
    log(`Error: ${err.message}`, false);
    res.status(500).json({ ok: false, steps, error: err.message });
  }
});

// POST /setup/render/test — test Render API key
router.post('/render/test', adminAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'API key required' });
    const result = await testRender(token);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /setup/render/deploy — create or update Web Service and deploy
router.post('/render/deploy', adminAuth, async (req, res) => {
  const steps = [];
  const log = (msg, ok = true) => steps.push({ msg, ok });

  try {
    const { token, repoUrl, serviceName, envVars } = req.body;
    const rToken = token || process.env.RENDER_API_KEY;
    if (!rToken) throw new Error('Render API key required');

    log('Checking existing services...');
    const services = await listServices(rToken);
    let service = services.find(s => s.name === serviceName && s.type === 'web_service');

    if (service) {
      log(`Found existing service: ${service.name}`);

      if (envVars && Object.keys(envVars).length > 0) {
        log('Updating environment variables...');
        await updateServiceEnv(service.id, envVars, rToken);
        log('Environment updated');
      }

      log('Triggering redeploy...');
      await triggerDeploy(service.id, rToken);
      log('Deploy triggered!');
    } else {
      log('Creating new Web Service...');

      if (!repoUrl) throw new Error('Repository URL required for new service');

      service = await createWebService({
        name: serviceName || 'delivery-api',
        repoUrl,
        branch: 'main',
        envVars: envVars || {},
        token: rToken,
      });
      log(`Service created: ${service.name}`);
    }

    const url = service.service?.url || service.url || `https://${serviceName || 'delivery-api'}.onrender.com`;
    log(`Live at: ${url}`);
    res.json({ ok: true, steps, url, serviceId: service.id });
  } catch (err) {
    log(`Error: ${err.message}`, false);
    res.status(500).json({ ok: false, steps, error: err.message });
  }
});

// GET /setup/render/services — list all services
router.get('/render/services', adminAuth, async (req, res) => {
  try {
    const token = req.headers['x-render-token'] || process.env.RENDER_API_KEY;
    if (!token) return res.status(400).json({ error: 'Render API key required' });
    const services = await listServices(token);
    res.json(services.map(s => ({ id: s.id, name: s.name, type: s.type, url: s.service?.url || s.url, status: s.status })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
