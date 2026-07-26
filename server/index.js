import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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
import { startOrderNotifier } from './lib/notifications.js';

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

app.get('/api/delivery/health', (req, res) => {
  res.json({
    ok: true,
    name: 'MISTER-DR Delivery API',
    version: '2.0.0',
    supabase: !!process.env.SUPABASE_URL,
    github: !!process.env.GITHUB_TOKEN,
    render: !!process.env.RENDER_API_KEY,
  });
});

const webDist = path.join(__dirname, '..', 'web', 'dist');
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
    startOrderNotifier();
  }
});
