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

// ── 1) Rename store → Pulsar Gaming (storefront blob) ──
const { data: storeRow } = await supabase.from('delivery_settings').select('value').eq('key', 'storefront').maybeSingle();
let blob = null;
if (storeRow?.value) {
  blob = typeof storeRow.value === 'object' ? storeRow.value : null;
  if (!blob) { try { blob = JSON.parse(storeRow.value); } catch { blob = null; } }
}
const merged = { ...(blob || { theme: 'gaming' }), storeName: 'Pulsar Gaming' };
const { error: upsErr } = await supabase
  .from('delivery_settings')
  .upsert({ key: 'storefront', value: merged }, { onConflict: 'key' });
console.log(upsErr ? `storeName update ERROR: ${upsErr.message}` : `storeName set to "Pulsar Gaming" in storefront blob`);

// ── 2) Mega-menu categories (departments + subcategories), store type 'gaming' ──
const MEGA = {
  'Périphériques PC': [
    'Claviers & Accessoires', 'Souris & Accessoires', 'Tapis de souris', 'Casques & Audio',
    'Streaming & Enregistrement', 'Manettes', 'Stockage', 'Câbles & Adaptateurs',
    'Routeur & Réseau', 'Ordinateurs & Composants', 'Gaming & Lunettes', 'Sacs PC',
  ],
  Console: ['PlayStation', 'Xbox', 'Nintendo'],
  'Chaise Gaming': ['DXRacer', 'Arozzi', 'MaxMount', 'Libernova', 'Noblechairs', 'ThunderX3', 'Racing', 'Simulateur'],
  'Accessoires Mobiles': [
    'Casques Bluetooth', 'Enceintes', 'Coques & Protections', 'Photo & Vidéo',
    'Câbles & Adaptateurs', 'Contrôleurs Mobiles', 'Chargement Sans Fil', 'Supports Téléphone',
    'Powerbank', 'Smartband', 'Divers',
  ],
  'Maison & Loisirs': [
    'Boissons & Énergie', 'Jeux de Cartes à Collectionner', 'Figurines de Collection',
    'Gadgets', 'Climatisation & Ventilation', 'Maison Connectée', 'Nettoyage',
    'Style de Vie', 'Vêtements', 'Piles',
  ],
};

const { data: existing } = await supabase.from('delivery_categories').select('id, name');
const existingNames = new Set((existing || []).map((c) => c.name));

const allNames = [];
for (const [dept, subs] of Object.entries(MEGA)) {
  allNames.push(dept, ...subs);
}

let order = 0;
const insertedIds = [];
for (const name of allNames) {
  order += 1;
  if (existingNames.has(name)) continue;
  const { data, error } = await supabase
    .from('delivery_categories')
    .insert({ name, image_url: null, is_active: true, sort_order: order })
    .select('id')
    .single();
  if (error) {
    console.log(`  !! insert error "${name}": ${error.message}`);
    continue;
  }
  insertedIds.push(data.id);
  console.log(`  + category: ${name}`);
}

// ── 3) Map all mega categories to store type 'gaming' ──
const { data: mapRow } = await supabase
  .from('delivery_settings')
  .select('value')
  .eq('key', 'category_store_types')
  .maybeSingle();
let map = {};
if (mapRow?.value) {
  map = typeof mapRow.value === 'object' ? mapRow.value : null;
  if (!map) { try { map = JSON.parse(mapRow.value); } catch { map = {}; } }
}

const { data: allCats } = await supabase.from('delivery_categories').select('id, name');
for (const c of allCats || []) {
  if (allNames.includes(c.name)) map[c.id] = 'gaming';
}

const { error: mapErr } = await supabase
  .from('delivery_settings')
  .upsert({ key: 'category_store_types', value: map }, { onConflict: 'key' });
console.log(mapErr ? `store-type map ERROR: ${mapErr.message}` : `Mapped ${allNames.length} mega categories → store type "gaming"`);

console.log(`\nDone. Created ${insertedIds.length} new categories.`);
