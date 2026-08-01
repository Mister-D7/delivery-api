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
const KEY = 'category_store_types';

async function getMap() {
  const { data } = await supabase.from('delivery_settings').select('value').eq('key', KEY).single();
  try { return data?.value && typeof data.value === 'object' ? data.value : JSON.parse(data.value || '{}'); }
  catch { return {}; }
}
async function saveMap(map) {
  const { error } = await supabase.from('delivery_settings').upsert({ key: KEY, value: map }, { onConflict: 'key' });
  if (error) throw error;
}

// 1) Tag existing grocery categories
const { data: existing } = await supabase.from('delivery_categories').select('id, name');
const groceryNames = [
  'Produits Laitiers', 'Boulangerie', 'Épicerie', 'Hygiène', 'Entretien', 'Bébé',
  'Animalerie', 'Surgelés', 'Conserves', 'Épices & Condiments', 'Huiles & Vinaigres',
  'Pâtes & Riz', 'Céréales', 'Snacks', 'Confiserie', 'Boissons Gazeuses', 'Jus & Nectars',
  'Café & Thé', 'Lait & Yaourts', 'Fromages', 'Viandes', 'Poissons', 'Pain & Viennoiseries',
  'Pâtisseries', 'Glaces', 'Eaux', 'Sucs', 'Fruits & Légumes', 'Boissons', 'Boulangerie & Pain',
  'Viandes & Poissons', 'Sucres',
];
const map = await getMap();
let tagged = 0;
for (const c of existing || []) {
  if (groceryNames.includes(c.name)) {
    map[c.id] = 'grocery';
    tagged++;
  }
}
console.log(`tagged ${tagged} existing categories as grocery`);

// 2) Seed categories for the other store types
const seeds = [
  { store_type: 'tech', names: ['Smartphones', 'Ordinateurs & PC', 'Laptops & Ultrabooks', 'Composants PC', 'Périphériques', 'Écrans', 'Audio & Casques', 'TV & Home Cinema', 'Accessoires', 'Stockage', 'Réseau & WiFi'] },
  { store_type: 'gaming', names: ['Consoles', 'Manettes & Pads', 'Jeux Vidéo', 'Casques Gaming', 'Claviers & Souris', 'Chaises Gaming', 'Setup & Stream', 'Cartes Graphiques', 'Refroidissement RGB', 'Cadeaux Gamer'] },
  { store_type: 'clothes', names: ['Homme', 'Femme', 'Enfant', 'Chaussures', 'Sacs & Maroquinerie', 'Vestes & Manteaux', 'Jeans & Pantalons', 'Robes & Jupes', 'Accessoires Mode', 'Sous-vêtements', 'Sportswear'] },
  { store_type: 'food', names: ['Primeurs & Fruits', 'Viandes & Volaille', 'Poissons & Fruits de mer', 'Crèmerie & Yaourts', 'Boulangerie Artisanale', 'Huiles & Épices', 'Miels & Confitures', 'Boissons Artisanales', 'Conserves Bio', 'Snacks & Fruits secs'] },
  { store_type: 'general', names: ['Nouveautés', 'Promotions', 'Best Sellers', 'Cadeaux', 'Destockage'] },
];

let seeded = 0;
for (const group of seeds) {
  for (let i = 0; i < group.names.length; i++) {
    const name = group.names[i];
    // find or create
    let id = (existing || []).find(c => c.name === name)?.id;
    if (!id) {
      const { data, error } = await supabase.from('delivery_categories')
        .insert({ name, is_active: true, sort_order: i })
        .select()
        .single();
      if (error) { console.log('  insert error:', error.message); continue; }
      id = data.id;
    }
    map[id] = group.store_type;
    seeded++;
  }
}
console.log(`seeded/tagged ${seeded} categories`);

// grocery tags win over any accidental reuse
for (const c of existing || []) {
  if (groceryNames.includes(c.name)) {
    map[c.id] = 'grocery';
  }
}
console.log('grocery tags enforced last');

// 3) Save the mapping
await saveMap(map);
console.log('saved mapping with', Object.keys(map).length, 'entries');

// 4) Verify per store type
const { data: all } = await supabase.from('delivery_categories').select('id, name');
const byType = {};
for (const c of all || []) {
  const t = map[c.id] || 'general';
  (byType[t] = byType[t] || []).push(c.name);
}
for (const [type, names] of Object.entries(byType)) {
  console.log(`\n[${type}] (${names.length}):`);
  console.log('  ' + names.join(', '));
}
