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

const IMG = (f) => `/images/gaming/products/${f}`;

const seeds = [
  { category: 'Consoles', name: 'Sony PlayStation 5 (PS5)', price: 119000, promo: null, stock: 8, img: 'ps5.jpg', specs: ['Console next-gen 4K', 'SSD Ultra rapide', 'Manette DualSense incluse'] },
  { category: 'Manettes & Pads', name: 'Manette DualSense Wireless', price: 24500, promo: 21900, stock: 20, img: 'manette.jpg', specs: ['Retour haptique', 'Gâchettes adaptatives', 'Compatible PS5 & PC'] },
  { category: 'Casques Gaming', name: 'Casque Gaming SteelSeries Arctis', price: 28900, promo: null, stock: 15, img: 'casque.jpg', specs: ['Son surround 7.1', 'Micro rétractable ClearCast', 'Confort en gel'] },
  { category: 'Claviers & Souris', name: 'Clavier Mécanique Corsair K70', price: 32900, promo: 28900, stock: 12, img: 'clavier.jpg', specs: ['Switchs mécaniques', 'RGB rétroéclairé', 'Repose-poignets magnétique'] },
  { category: 'Claviers & Souris', name: 'Souris Gamer Razer DeathAdder', price: 12500, promo: null, stock: 25, img: 'souris.jpg', specs: ['Capteur 14 000 DPI', 'Poids 82 g', 'Switchs optiques'] },
  { category: 'Chaises Gaming', name: 'Chaise Gaming DXRacer', price: 48500, promo: 43900, stock: 6, img: 'chaise.jpg', specs: ['Mousse haute densité', 'Accoudoirs 4D', 'Dossier inclinable 180°'] },
  { category: 'Composants PC Gaming', name: 'Carte Graphique RTX 4070', price: 139000, promo: null, stock: 4, img: 'gpu.jpg', specs: ['12 Go GDDR6X', 'Ray tracing 3e gen', 'DLSS 3'] },
];

let inserted = 0, skipped = 0;

for (const s of seeds) {
  const categoryId = nameToId.get(s.category);
  if (!categoryId) { console.log(`  !! category not found: ${s.category}`); skipped++; continue; }

  const { data: dup } = await supabase.from('delivery_products').select('id').eq('name', s.name).maybeSingle();
  if (dup) { console.log(`  skip (exists): ${s.name}`); skipped++; continue; }

  const product = {
    name: s.name,
    sale_price: s.price,
    cost_price: Math.round(s.price * 0.7),
    stock_qty: s.stock,
    image_url: IMG(s.img),
    category_id: categoryId,
    is_active: true,
    specs: s.specs.join('; '),
    promo_price: s.promo,
  };

  const { error } = await supabase.from('delivery_products').insert(product);
  if (error) { console.log(`  insert error for ${s.name}: ${error.message}`); skipped++; continue; }
  inserted++;
}

console.log(`\nInserted ${inserted} gaming products, skipped ${skipped}.`);

const { data: all } = await supabase.from('delivery_products').select('id, name, category_id, sale_price, promo_price, image_url');
const gamingList = (all || []).filter(p => (idToStore[p.category_id] || 'general') === 'gaming');
console.log(`Gaming products in DB: ${gamingList.length}`);
for (const p of gamingList) {
  console.log(`  - ${p.name} (${p.sale_price} DA, img: ${p.image_url})`);
}
