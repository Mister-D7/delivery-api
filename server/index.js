import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dns from 'node:dns';
import { fileURLToPath } from 'url';
import multer from 'multer';

dns.setDefaultResultOrder('ipv4first');
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import orderRoutes from './routes/orders.js';
import settingsRoutes from './routes/settings.js';
import deployRoutes from './routes/deploy.js';
import eventsRoutes from './routes/events.js';
import themesRoutes from './routes/themes.js';
import bannersRoutes from './routes/banners.js';
import uploadRoutes from './routes/upload.js';
import revenueRoutes from './routes/revenue.js';
import setupRoutes from './routes/setup.js';
import backupRoutes from './routes/backup.js';
import cloudRoutes from './routes/cloud.js';
import emailRoutes from './routes/email.js';
import dismissedRoutes from './routes/dismissed.js';
import couponRoutes from './routes/coupons.js';
import comboRoutes from './routes/combos.js';
import employeeRoutes from './routes/employees.js';
import { startOrderNotifier } from './lib/notifications.js';
import { startScheduler as startBackupScheduler } from './lib/backup.js';
import { startArchiveScheduler } from './lib/archive.js';
import supabase from './lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploads as static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/delivery/auth', authRoutes);
app.use('/api/delivery', catalogRoutes);
app.use('/api/delivery/orders', orderRoutes);
app.use('/api/delivery/storefront', settingsRoutes);
app.use('/api/delivery/deploy', deployRoutes);
app.use('/api/delivery/events', eventsRoutes);
app.use('/api/delivery/themes', themesRoutes);
app.use('/api/delivery/banners', bannersRoutes);
app.use('/api/delivery/upload', uploadRoutes);
app.use('/api/delivery/revenue', revenueRoutes);
app.use('/api/delivery/setup', setupRoutes);
app.use('/api/delivery/backup', backupRoutes);
app.use('/api/delivery/cloud', cloudRoutes);
app.use('/api/delivery/email', emailRoutes);
app.use('/api/delivery/dismissed', dismissedRoutes);
app.use('/api/delivery/coupons', couponRoutes);
app.use('/api/delivery/combos', comboRoutes);
app.use('/api/delivery/employees', employeeRoutes);

// Multer error handler — returns proper error messages
app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.get('/api/delivery/health', (req, res) => {
  res.json({
    ok: true,
    name: 'MISTER-DR Delivery API',
    version: '2.3.0',
    supabase: !!process.env.SUPABASE_URL,
    github: !!process.env.GITHUB_TOKEN,
    render: !!process.env.RENDER_API_KEY,
  });
});

// Same-origin image proxy — serves external images through the app origin so
// they are not subject to Edge/Chrome Tracking Prevention, mixed-content
// blocks, or hotlink restrictions. Only forwards responses that are images.
app.get('/api/img', async (req, res) => {
  const raw = req.query.url;
  const url = Array.isArray(raw) ? raw[0] : raw;
  if (!url || !/^https?:\/\//i.test(String(url))) {
    return res.status(400).json({ error: 'Invalid url' });
  }
  try {
    const upstream = await fetch(String(url), { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    const type = String(upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!upstream.ok || !/^image\/(jpe?g|png|webp|gif|avif|svg\+xml)/i.test(type)) {
      return res.status(upstream.ok ? 415 : upstream.status).end();
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.set('Content-Type', type);
    res.set('Cache-Control', 'public, max-age=86400, immutable');
    res.set('X-Content-Type-Options', 'nosniff');
    res.send(buf);
  } catch {
    res.status(502).json({ error: 'Fetch failed' });
  }
});

/* ══════════════════════════════════════════
   OAUTH CALLBACK HANDLER (root /)
   Google redirects here with ?code=&state=flow:provider:nonce
   We parse the state and forward to the correct handler
   ══════════════════════════════════════════ */
app.get('/', (req, res, next) => {
  const { code, state, error } = req.query;
  if (!code || !state) return next();

  const parts = state.split(':');
  const flow = parts[0];
  const provider = parts[1];

  if (flow === 'cloud') {
    (async () => {
      try {
        const { exchangeCode, getUserInfo, saveConnection, PROVIDERS } = await import('./lib/cloud.js');
        const redirectUri = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
        const tokens = await exchangeCode(provider, code, redirectUri);
        const accessToken = tokens.access_token;
        const accountInfo = await getUserInfo(provider, accessToken);
        await saveConnection(provider, tokens, accountInfo);
        const config = PROVIDERS[provider];
        res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cloud Connect</title></head><body style="background:#0a0a0a;color:#f5f1e8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2 style="color:#4ade80;">✅ ${config.name} connecté !</h2><p>${accountInfo?.email || ''}</p><script>setTimeout(()=>window.close(),1500);</script></div></body></html>`);
      } catch (err) {
        console.error('Cloud OAuth error:', err);
        res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erreur</title></head><body style="background:#0a0a0a;color:#f5f1e8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h2 style="color:#d9603b;">❌ ${err.message}</h2><script>setTimeout(()=>window.close(),2000);</script></div></body></html>`);
      }
    })();
  } else if (flow === 'auth') {
    (async () => {
      try {
        const { handleGoogleLogin } = await import('./lib/auth.js');
        const jwt = await handleGoogleLogin(code);
        res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Login Google</title></head><body style="background:#0a0a0a;color:#4ade80;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;"><h2>✅ Connecté !</h2><script>try{window.opener&&window.opener.postMessage({type:'google-login',token:'${jwt}'},'*')}catch(e){};setTimeout(()=>window.close(),800);</script></body></html>`);
      } catch (err) {
        console.error('Google auth error:', err);
        res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erreur</title></head><body style="background:#0a0a0a;color:#d9603b;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;text-align:center;"><h2>❌ ${err.message}</h2><script>try{window.opener&&window.opener.postMessage({type:'google-login-error',error:'${String(err.message).replace(/'/g,"\\'")}'},'*')}catch(e){};setTimeout(()=>window.close(),1500);</script></body></html>`);
      }
    })();
  } else if (flow === 'auth-customer') {
    (async () => {
      try {
        const { handleGoogleCustomerLogin } = await import('./lib/auth.js');
        const jwt = await handleGoogleCustomerLogin(code);
        res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Login Client Google</title></head><body style="background:#0a0a0a;color:#4ade80;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;"><h2>✅ Connecté !</h2><script>try{window.opener&&window.opener.postMessage({type:'google-customer-login',token:'${jwt}'},'*')}catch(e){};setTimeout(()=>window.close(),800);</script></body></html>`);
      } catch (err) {
        console.error('Google customer auth error:', err);
        res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erreur</title></head><body style="background:#0a0a0a;color:#d9603b;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;text-align:center;"><h2>❌ ${err.message}</h2><script>try{window.opener&&window.opener.postMessage({type:'google-customer-login-error',error:'${String(err.message).replace(/'/g,"\\'")}'},'*')}catch(e){};setTimeout(()=>window.close(),1500);</script></body></html>`);
      }
    })();
  } else {
    next();
  }
});

async function ensureStorageBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'delivery');
    if (!exists) {
      const { error } = await supabase.storage.createBucket('delivery', { public: true, fileSizeLimit: 52428800 });
      if (error) console.log('  ⚠  Storage bucket create:', error.message);
      else console.log('  ✓  Storage bucket "delivery" created');
    } else {
      // Ensure it's public
      await supabase.storage.updateBucket('delivery', { public: true });
      console.log('  ✓  Storage bucket "delivery" ready');
    }
  } catch (err) {
    console.log('  ⚠  Storage bucket check failed:', err.message);
  }
}

const webDist = path.join(__dirname, '..', 'web', 'dist');
const storefrontDist = path.join(__dirname, '..', 'web', 'storefront', 'dist');
app.use('/_assets', express.static(path.join(storefrontDist, '_assets')));
app.use('/images', express.static(path.join(storefrontDist, 'images')));
app.get('/categorie/:slug', (req, res) => {
  const page = path.join(storefrontDist, 'categorie', req.params.slug, 'index.html');
  res.sendFile(page, (err) => {
    if (err) res.redirect('/');
  });
});
app.get('/mentions-legales', (req, res) => {
  const page = path.join(storefrontDist, 'mentions-legales', 'index.html');
  res.sendFile(page, (err) => {
    if (err) res.redirect('/');
  });
});
app.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('delivery_settings')
      .select('value')
      .eq('key', 'storefront')
      .single();
    const blob = data?.value;
    const pulsarPath = path.join(storefrontDist, 'pulsar', 'index.html');
    if (blob?.theme === 'pulsar' && fs.existsSync(pulsarPath)) {
      return res.sendFile(pulsarPath);
    }
    const greensPath = path.join(storefrontDist, 'greens', 'index.html');
    if (blob?.theme === 'greens' && fs.existsSync(greensPath)) {
      return res.sendFile(greensPath);
    }
  } catch {}
  res.sendFile(path.join(storefrontDist, 'index.html'));
});
app.use(express.static(webDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(webDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║   MISTER-DR Delivery Server v2.0      ║`);
  console.log(`  ║   http://localhost:${PORT}              ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);

  if (!process.env.SUPABASE_URL) {
    console.log(`  ⚠  No .env found. Run "npm run setup" first.\n`);
  } else {
    console.log(`  ✓  Supabase: ${process.env.SUPABASE_URL}`);
    console.log(`  ✓  GitHub:   ${process.env.GITHUB_TOKEN ? 'configured' : 'not configured'}`);
    console.log(`  ✓  Render:   ${process.env.RENDER_API_KEY ? 'configured' : 'not configured'}`);
    console.log(`  ✓  Themes:   mounted`);
    console.log(`  ✓  Banners:  mounted`);
    console.log(`  ✓  Uploads:  mounted`);
    console.log('');
    ensureStorageBucket();
    startOrderNotifier();
    startBackupScheduler();
    startArchiveScheduler();
  }
});
