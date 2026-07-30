#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// MISTER-DR Delivery — Setup Wizard
// First-run configuration for GitHub, Supabase, Render keys
// ═══════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.join(__dirname, '.env');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(q) { return new Promise(r => rl.question(q, r)); }

function print(msg) { console.log(msg); }
function printBold(msg) { console.log(`\x1b[1m${msg}\x1b[0m`); }
function printGreen(msg) { console.log(`\x1b[32m${msg}\x1b[0m`); }
function printRed(msg) { console.log(`\x1b[31m${msg}\x1b[0m`); }
function printYellow(msg) { console.log(`\x1b[33m${msg}\x1b[0m`); }

function printBanner() {
  print('');
  printBold('  ╔══════════════════════════════════════════╗');
  printBold('  ║   🛒 MISTER-DR Delivery — Setup Wizard   ║');
  printBold('  ╚══════════════════════════════════════════╝');
  print('');
}

function saveEnv(vars) {
  const content = Object.entries(vars)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  fs.writeFileSync(ENV_PATH, content + '\n');
  printGreen(`  ✓ Configuration saved to .env`);
}

async function setupSupabase(url, serviceKey) {
  print('\n  📦 Setting up Supabase tables...');

  const supabase = createClient(url, serviceKey);

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_customers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      addresses JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_categories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      catalog_id TEXT,
      erp_product_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      specs TEXT,
      image_url TEXT,
      sale_price NUMERIC DEFAULT 0,
      promo_price NUMERIC,
      stock_qty INTEGER DEFAULT 0,
      category_id UUID REFERENCES delivery_categories(id),
      is_active BOOLEAN DEFAULT true,
      is_custom BOOLEAN DEFAULT false,
      product_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_orders (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      secure_token TEXT UNIQUE NOT NULL,
      customer_id UUID REFERENCES delivery_customers(id),
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      total NUMERIC DEFAULT 0,
      delivery_fee NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      voice_url TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_order_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id UUID REFERENCES delivery_orders(id) ON DELETE CASCADE,
      product_id TEXT,
      catalog_item_id TEXT,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price NUMERIC DEFAULT 0,
      image_url TEXT,
      custom_name TEXT,
      custom_price NUMERIC
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
      sender TEXT NOT NULL DEFAULT 'customer',
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS delivery_settings (
      key TEXT PRIMARY KEY,
      value JSONB,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE delivery_customers DISABLE ROW LEVEL SECURITY;
    ALTER TABLE delivery_categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE delivery_products DISABLE ROW LEVEL SECURITY;
    ALTER TABLE delivery_orders DISABLE ROW LEVEL SECURITY;
    ALTER TABLE delivery_order_items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE delivery_order_status_history DISABLE ROW LEVEL SECURITY;
    ALTER TABLE delivery_order_messages DISABLE ROW LEVEL SECURITY;
    ALTER TABLE delivery_settings DISABLE ROW LEVEL SECURITY;
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;

    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT SELECT ON delivery_categories TO anon;
    GRANT SELECT ON delivery_products TO anon;
    GRANT SELECT ON delivery_settings TO anon;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { query: schema }).single();
    if (error) {
      printYellow(`  ⚠ Auto-schema may have partially failed (this is usually OK)`);
      printYellow(`    If tables don't exist, run the schema.sql manually in Supabase SQL Editor`);
    } else {
      printGreen('  ✓ Tables created');
    }
  } catch {
    printYellow(`  ⚠ Could not auto-create tables — run schema.sql in Supabase SQL Editor`);
  }

  // Seed admin
  const bcryptHash = await bcryptHashPassword('admin123');
  try {
    await supabase.from('users').upsert({
      name: 'Admin',
      email: 'admin@mister-dr.shop',
      password_hash: bcryptHash,
      role: 'admin',
    }, { onConflict: 'email' });
    printGreen('  ✓ Admin user seeded (admin@mister-dr.shop / admin123)');
  } catch {
    printYellow('  ⚠ Admin user may already exist');
  }

  // Seed default settings
  try {
    await supabase.from('delivery_settings').upsert([
      { key: 'main', value: { shopName: 'MISTER-DR', accentColor: '#ffffff', primaryColor: '#D4A843', secondaryColor: '#1a1a1a', fontFamily: 'Inter' } },
      { key: 'delivery_pricing', value: { baseFee: 200, baseKm: 5, extraPerKm: 50, freeThreshold: 3000, maxRadius: 30, shopName: 'MISTER-DR', shopLat: 36.7538, shopLng: 3.0588 } },
    ], { onConflict: 'key' });
    printGreen('  ✓ Default settings seeded');
  } catch {
    printYellow('  ⚠ Settings may already exist');
  }
}

async function bcryptHashPassword(password) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.hashSync(password, 10);
}

async function main() {
  printBanner();

  if (fs.existsSync(ENV_PATH)) {
    printYellow('  ⚠ .env already exists.');
    const overwrite = await ask('  Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      print('  Keeping existing configuration.');
      rl.close();
      return;
    }
  }

  printBold('  Step 1: Supabase');
  print('  Create a project at https://supabase.com');
  print('  Find your keys in Project Settings → API\n');
  const supabaseUrl = await ask('  Supabase URL (https://xxx.supabase.co): ');
  const supabaseAnonKey = await ask('  Supabase Anon Key: ');
  const supabaseServiceKey = await ask('  Supabase Service Key: ');

  printBold('\n  Step 2: GitHub');
  print('  Create a token at https://github.com/settings/tokens');
  print('  Need "repo" scope for pushing code\n');
  const githubToken = await ask('  GitHub Token (ghp_xxx): ');

  printBold('\n  Step 3: Render');
  print('  Get your API key at https://render.com/account#api-keys\n');
  const renderApiKey = await ask('  Render API Key (rnd_xxx): ');

  printBold('\n  Step 4: Admin Credentials');
  const adminEmail = await ask('  Admin email [admin@mister-dr.shop]: ') || 'admin@mister-dr.shop';
  const adminPassword = await ask('  Admin password [admin123]: ') || 'admin123';

  const jwtSecret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  const vars = {
    PORT: '4000',
    NODE_ENV: 'development',
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_KEY: supabaseServiceKey,
    ADMIN_EMAIL: adminEmail,
    ADMIN_PASSWORD: adminPassword,
    GITHUB_TOKEN: githubToken,
    RENDER_API_KEY: renderApiKey,
    JWT_SECRET: jwtSecret,
  };

  saveEnv(vars);

  printBold('\n  Setting up Supabase database...');
  await setupSupabase(supabaseUrl, supabaseServiceKey);

  printBold('\n  ╔══════════════════════════════════════════╗');
  printGreen('  ║   ✅ Setup complete!                      ║');
  printGreen('  ║                                           ║');
  printGreen('  ║   Start the app:  npm run dev             ║');
  printGreen('  ║   Build for prod: npm run build           ║');
  printGreen('  ║   Then:           npm start               ║');
  printBold('  ╚══════════════════════════════════════════╝');
  print('');

  rl.close();
}

main().catch(err => {
  printRed(`\n  Fatal error: ${err.message}`);
  rl.close();
  process.exit(1);
});
