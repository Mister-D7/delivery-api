import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '..', '.env');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

const { data: settings } = await supabase.from('delivery_settings').select('value').eq('key', 'category_store_types').single();
let catMap = {};
try { catMap = settings?.value && typeof settings.value === 'object' ? settings.value : JSON.parse(settings.value || '{}'); }
catch {}

const { data: categories } = await supabase.from('delivery_categories').select('id, name');
const nameToId = new Map((categories || []).map(c => [c.name, c.id]));
const idToStore = Object.entries(catMap).reduce((acc, [id, type]) => { acc[id] = type; return acc; }, {});

const img = seed => `https://picsum.photos/seed/${seed}/400/400`;

const seeds = [
  { store: 'tech', category: 'Smartphones', name: 'iPhone 15 Pro 256 Go', price: 119900, promo: 114900, stock: 25 },
  { store: 'tech', category: 'Smartphones', name: 'Samsung Galaxy S24 Ultra', price: 139900, promo: null, stock: 18 },
  { store: 'tech', category: 'Ordinateurs & PC', name: 'Dell XPS 13 2025', price: 159900, promo: null, stock: 12 },
  { store: 'tech', category: 'Laptops & Ultrabooks', name: 'MacBook Air M3 13"', price: 189900, promo: 179900, stock: 15 },
  { store: 'tech', category: 'Périphériques', name: 'Souris Logitech MX Master 3S', price: 14500, promo: null, stock: 40 },
  { store: 'tech', category: 'Écrans', name: 'Écran Samsung 27" QLED 144Hz', price: 42900, promo: 39900, stock: 20 },
  { store: 'tech', category: 'Audio & Casques', name: 'Casque Sony WH-1000XM5', price: 35900, promo: null, stock: 22 },
  { store: 'tech', category: 'Audio & Casques', name: 'Écouteurs Apple AirPods Pro 2', price: 27900, promo: 25900, stock: 35 },
  { store: 'tech', category: 'Stockage', name: 'SSD Samsung 990 Pro 1 To', price: 21500, promo: null, stock: 28 },
  { store: 'tech', category: 'Réseau & WiFi', name: 'Routeur TP-Link Archer AX55', price: 16500, promo: null, stock: 16 },

  { store: 'gaming', category: 'Consoles', name: 'PlayStation 5 Slim', price: 65900, promo: null, stock: 10 },
  { store: 'gaming', category: 'Consoles', name: 'Xbox Series X', price: 59900, promo: 57900, stock: 8 },
  { store: 'gaming', category: 'Consoles', name: 'Nintendo Switch OLED', price: 34900, promo: null, stock: 14 },
  { store: 'gaming', category: 'Manettes & Pads', name: 'Manette DualSense', price: 12500, promo: null, stock: 30 },
  { store: 'gaming', category: 'Jeux Vidéo', name: 'EA Sports FC 26', price: 9500, promo: null, stock: 50 },
  { store: 'gaming', category: 'Casques Gaming', name: 'Casque SteelSeries Arctis 5', price: 14500, promo: null, stock: 19 },
  { store: 'gaming', category: 'Claviers & Souris', name: 'Clavier mécanique Corsair K70', price: 16500, promo: null, stock: 17 },
  { store: 'gaming', category: 'Chaises Gaming', name: 'Fauteuil gamer DXRacer', price: 38900, promo: 35900, stock: 6 },
  { store: 'gaming', category: 'Cartes Graphiques', name: 'Carte graphique RTX 4070 Super', price: 89900, promo: null, stock: 5 },
  { store: 'gaming', category: 'Setup & Stream', name: 'Webcam Elgato Facecam', price: 19900, promo: null, stock: 12 },

  { store: 'clothes', category: 'Homme', name: 'Veste en cuir Homme', price: 16500, promo: null, stock: 9 },
  { store: 'clothes', category: 'Homme', name: 'Chemise Oxford Bleue', price: 4500, promo: 3900, stock: 45 },
  { store: 'clothes', category: 'Femme', name: "Robe d'été Fleurie", price: 6500, promo: null, stock: 32 },
  { store: 'clothes', category: 'Sacs & Maroquinerie', name: 'Sac à main en cuir', price: 12500, promo: null, stock: 11 },
  { store: 'clothes', category: 'Jeans & Pantalons', name: 'Jean Slim Homme', price: 5800, promo: null, stock: 38 },
  { store: 'clothes', category: 'Chaussures', name: 'Basket Nike Air Force 1', price: 18900, promo: 16900, stock: 21 },
  { store: 'clothes', category: 'Vestes & Manteaux', name: "Manteau d'hiver Femme", price: 12500, promo: null, stock: 7 },
  { store: 'clothes', category: 'Enfant', name: 'T-shirt Enfant 6-12 ans', price: 2500, promo: null, stock: 60 },

  { store: 'food', category: 'Primeurs & Fruits', name: 'Tomates fraîches 1 kg', price: 250, promo: null, stock: 80 },
  { store: 'food', category: 'Viandes & Volaille', name: 'Poulet fermier entier', price: 900, promo: null, stock: 40 },
  { store: 'food', category: 'Poissons & Fruits de mer', name: 'Daurade royale', price: 1800, promo: null, stock: 15 },
  { store: 'food', category: 'Crèmerie & Yaourts', name: 'Yaourt nature 16 x 100 g', price: 450, promo: null, stock: 55 },
  { store: 'food', category: 'Boulangerie Artisanale', name: 'Baguette tradition', price: 80, promo: null, stock: 120 },
  { store: 'food', category: 'Huiles & Épices', name: "Huile d'olive extra vierge 1 L", price: 3200, promo: 2800, stock: 26 },
  { store: 'food', category: 'Miels & Confitures', name: 'Miel de montagne 500 g', price: 2400, promo: null, stock: 18 },
  { store: 'food', category: 'Boissons Artisanales', name: "Jus d'orange pressé 1 L", price: 500, promo: null, stock: 44 },
  { store: 'food', category: 'Conserves Bio', name: 'Pois chiches bio 1 kg', price: 600, promo: null, stock: 33 },
  { store: 'food', category: 'Snacks & Fruits secs', name: 'Amandes décortiquées 500 g', price: 1500, promo: null, stock: 27 },

  { store: 'general', category: 'Nouveautés', name: 'Pack découverte MISTER-DR', price: 3500, promo: null, stock: 20 },
  { store: 'general', category: 'Promotions', name: 'Sac surprise -30%', price: 2500, promo: 1750, stock: 25 },
  { store: 'general', category: 'Best Sellers', name: 'Écouteurs sans fil', price: 6500, promo: null, stock: 48 },
  { store: 'general', category: 'Cadeaux', name: 'Carte cadeau 5 000 DA', price: 5000, promo: null, stock: 100 },
  { store: 'general', category: 'Destockage', name: 'Lot de 3 chemises', price: 4500, promo: 3200, stock: 13 },
];

let inserted = 0, skipped = 0;
const existingNames = new Set();

for (const s of seeds) {
  if (existingNames.has(s.name)) continue;
  const categoryId = nameToId.get(s.category);
  if (!categoryId) { console.log(`  !! category not found: ${s.category}`); skipped++; continue; }

  const { data: dup } = await supabase.from('delivery_products').select('id').eq('name', s.name).maybeSingle();
  if (dup) { existingNames.add(s.name); skipped++; continue; }

  const product = {
    name: s.name,
    sale_price: s.price,
    cost_price: Math.round(s.price * 0.7),
    stock_qty: s.stock,
    image_url: img(s.name.replace(/[^a-z0-9]/gi, '').toLowerCase()),
    category_id: categoryId,
    is_active: true,
    specs: `Article de démonstration — ${idToStore[categoryId] || 'général'}`,
    promo_price: s.promo,
  };

  const { error } = await supabase.from('delivery_products').insert(product);
  if (error) { console.log(`  insert error for ${s.name}: ${error.message}`); skipped++; continue; }
  inserted++;
}

console.log(`\nInserted ${inserted} products, skipped ${skipped}.`);

const { data: all } = await supabase.from('delivery_products').select('id, name, category_id, sale_price, promo_price');
const byStore = {};
for (const p of all || []) {
  const st = p.category_id ? (idToStore[p.category_id] || 'general') : 'general';
  (byStore[st] = byStore[st] || []).push(p.name);
}
for (const [store, names] of Object.entries(byStore)) {
  console.log(`\n[${store}] (${names.length}):`);
  console.log('  ' + names.join(', '));
}
