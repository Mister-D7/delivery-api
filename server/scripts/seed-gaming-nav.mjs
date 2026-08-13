import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Seeds the DB-driven navigation: 5 main categories (departments) + their sub-categories.
// Idempotent — upserts by name. Run AFTER schema-nav.sql has been applied.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '..', '.env');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

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

// Top-category icons (Phase 2 uses these for the Top Categories strip)
const TOP_ICONS = {
  Console: 'gamepad',
  'Chaise Gaming': 'chair',
  Manettes: 'controller',
  'Casques & Audio': 'headset',
};

const { data: existing } = await supabase.from('delivery_categories').select('id, name').limit(1000);
const byName = new Map((existing || []).map((c) => [c.name, c]));

async function getOrCreate(name) {
  if (byName.has(name)) return byName.get(name).id;
  const { data, error } = await supabase
    .from('delivery_categories')
    .insert({ name, is_active: true, sort_order: 0 })
    .select('id')
    .single();
  if (error) throw new Error(`create "${name}": ${error.message}`);
  byName.set(name, { id: data.id, name });
  return data.id;
}

const deptIds = {};
const allNames = [];
let order = 0;

for (const dept of Object.keys(MEGA)) {
  order += 1;
  const deptId = await getOrCreate(dept);
  deptIds[dept] = deptId;
  const icon = TOP_ICONS[dept];
  const { error: up } = await supabase
    .from('delivery_categories')
    .update({ parent_id: null, is_nav: true, is_top: icon ? true : false, icon: icon || null, nav_order: order })
    .eq('id', deptId);
  if (up) console.log(`  !! update "${dept}": ${up.message}`);
  else console.log(`  ✓ dept ${order}. ${dept} (is_nav, nav_order ${order})`);

  for (const sub of MEGA[dept]) {
    allNames.push(sub);
    const subId = await getOrCreate(sub);
    const subIcon = TOP_ICONS[sub];
    const { error: up2 } = await supabase
      .from('delivery_categories')
      .update({ parent_id: deptId, is_nav: false, is_top: subIcon ? true : false, icon: subIcon || null, nav_order: 0 })
      .eq('id', subId);
    if (up2) console.log(`  !! update "${sub}": ${up2.message}`);
  }
}

// "Câbles & Adaptateurs" exists under two departments in the old header — single parent:
// keep it under Périphériques PC.
if (deptIds['Périphériques PC'] && byName.has('Câbles & Adaptateurs')) {
  await supabase
    .from('delivery_categories')
    .update({ parent_id: deptIds['Périphériques PC'] })
    .eq('id', byName.get('Câbles & Adaptateurs').id);
}

// Map all nav categories to store type 'gaming'
const { data: mapRow } = await supabase
  .from('delivery_settings')
  .select('value')
  .eq('key', 'category_store_types')
  .maybeSingle();
let map = {};
if (mapRow?.value) {
  map = typeof mapRow.value === 'object' && mapRow.value ? mapRow.value : null;
  if (!map) { try { map = JSON.parse(mapRow.value); } catch { map = {}; } }
}
for (const name of allNames) {
  const c = byName.get(name);
  if (c) map[c.id] = 'gaming';
}
const { error: mapErr } = await supabase
  .from('delivery_settings')
  .upsert({ key: 'category_store_types', value: map }, { onConflict: 'key' });
if (mapErr) console.log(`  !! store-type map: ${mapErr.message}`);

console.log(`\nDone. ${Object.keys(MEGA).length} departments, ${allNames.length} sub-categories → store type "gaming".`);
