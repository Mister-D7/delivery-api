import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tmpDir = path.join(__dirname, '..', '..', 'uploads', 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) cb(null, true);
    else cb(new Error('Only .jpg, .png, .webp images accepted'));
  },
});

async function uploadToStorage(filePath, upsertPath) {
  const fileBuffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage
    .from('delivery')
    .upload(upsertPath, fileBuffer, {
      contentType: getContentType(filePath),
      upsert: true,
    });
  fs.unlinkSync(filePath);
  if (error) throw error;
  const { data } = supabase.storage.from('delivery').getPublicUrl(upsertPath);
  return data.publicUrl;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'application/octet-stream';
}

const router = Router();

// ── Store-type ↔ category mapping (stored in delivery_settings to avoid schema migrations) ──
const STORE_TYPE_SETTINGS_KEY = 'category_store_types';

async function getCategoryStoreTypes() {
  const { data, error } = await supabase
    .from('delivery_settings')
    .select('value')
    .eq('key', STORE_TYPE_SETTINGS_KEY)
    .single();
  if (error) return {};
  try { return typeof data?.value === 'object' && data.value ? data.value : (JSON.parse(data.value || '{}')); }
  catch { return {}; }
}

async function setCategoryStoreType(categoryId, storeType) {
  const map = await getCategoryStoreTypes();
  if (storeType && storeType !== 'general') map[categoryId] = storeType;
  else delete map[categoryId];
  const { error } = await supabase
    .from('delivery_settings')
    .upsert({ key: STORE_TYPE_SETTINGS_KEY, value: map }, { onConflict: 'key' });
  return error;
}

async function deleteCategoryStoreType(categoryId) {
  const map = await getCategoryStoreTypes();
  delete map[categoryId];
  await supabase
    .from('delivery_settings')
    .upsert({ key: STORE_TYPE_SETTINGS_KEY, value: map }, { onConflict: 'key' });
}

function categoryStoreType(c, map) {
  return map[c.id] || 'general';
}


// GET /catalog — public, active products with category + flash sales
router.get('/catalog', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const catMap = await getCategoryStoreTypes();

    const { data: products } = await supabase
      .from('delivery_products')
      .select('*, delivery_categories(id, name, image_url, sort_order)')
      .eq('is_active', true)
      .order('product_order', { ascending: true });

    const catalog = (products || []).map(p => {
      let effectivePrice = p.sale_price;
      let isFlashSale = false;

      if (p.flash_sale_price != null && p.flash_sale_end_date) {
        if (!p.flash_sale_starts || now >= p.flash_sale_starts) {
          if (now <= p.flash_sale_end_date) {
            effectivePrice = p.flash_sale_price;
            isFlashSale = true;
          }
        }
      }

      return {
        id: p.id,
        barcode: p.catalog_id || p.id,
        name: p.name,
        description: p.description,
        specs: p.specs,
        salePrice: p.sale_price,
        costPrice: p.cost_price,
        promoPrice: p.promo_price,
        flashSalePrice: isFlashSale ? p.flash_sale_price : null,
        flashSaleEnds: isFlashSale ? p.flash_sale_end_date : null,
        effectivePrice,
        imageUrl: p.image_url,
        stockQty: p.stock_qty,
        isCustom: p.is_custom,
        isFlashSale,
        category: p.delivery_categories ? {
          id: p.delivery_categories.id,
          name: p.delivery_categories.name,
          imageUrl: p.delivery_categories.image_url,
          sortOrder: p.delivery_categories.sort_order,
        } : null,
        storeType: p.delivery_categories ? (catMap[p.delivery_categories.id] || 'general') : 'general',
      };
    });

    res.json(catalog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /categories/public — public active categories, optionally filtered by store type
router.get('/categories/public', async (req, res) => {
  try {
    const storeType = req.query.storeType;
    const { data } = await supabase
      .from('delivery_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    let list = data || [];
    if (storeType) {
      const map = await getCategoryStoreTypes();
      list = list.filter(c => categoryStoreType(c, map) === storeType);
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /categories — admin, all categories (with storeType attached)
router.get('/categories', adminAuth, async (req, res) => {
  try {
    const storeType = req.query.storeType;
    const { data } = await supabase
      .from('delivery_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    const map = await getCategoryStoreTypes();
    let list = (data || []).map(c => ({ ...c, storeType: categoryStoreType(c, map) }));
    if (storeType) list = list.filter(c => c.storeType === storeType);

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /categories — admin, create
router.post('/categories', adminAuth, async (req, res) => {
  try {
    const { name, imageUrl, sortOrder, storeType } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const { data, error } = await supabase
      .from('delivery_categories')
      .insert({ name, image_url: imageUrl || null, sort_order: sortOrder || 0 })
      .select()
      .single();

    if (error) throw error;
    if (storeType) {
      const mapError = await setCategoryStoreType(data.id, storeType);
      if (mapError) throw mapError;
    }
    res.status(201).json({ ...data, storeType: storeType || 'general' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /categories/:id — admin, update
router.put('/categories/:id', adminAuth, async (req, res) => {
  try {
    const { name, imageUrl, sortOrder, isActive, storeType } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    if (sortOrder !== undefined) updates.sort_order = sortOrder;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from('delivery_categories')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (storeType !== undefined) {
      const mapError = await setCategoryStoreType(data.id, storeType);
      if (mapError) throw mapError;
    }
    const map = await getCategoryStoreTypes();
    res.json({ ...data, storeType: categoryStoreType(data, map) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /categories/:id — admin
router.delete('/categories/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('delivery_categories').delete().eq('id', req.params.id);
    if (error) throw error;
    await deleteCategoryStoreType(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /categories/seed — admin, seed default categories
router.post('/categories/seed', adminAuth, async (req, res) => {
  try {
    const defaults = [
      { name: 'Fruits & Légumes', icon: '🍊' },
      { name: 'Viandes & Poissons', icon: '🥩' },
      { name: 'Produits Laitiers', icon: '🧀' },
      { name: 'Fromages', icon: '🧀' },
      { name: 'Boulangerie & Pain', icon: '🍞' },
      { name: 'Pâtisseries', icon: '🧁' },
      { name: 'Boissons', icon: '🥤' },
      { name: 'Eaux', icon: '💧' },
      { name: 'Jus & Nectars', icon: '🧃' },
      { name: 'Café & Thé', icon: '☕' },
      { name: 'Céréales', icon: '🥣' },
      { name: 'Pâtes & Riz', icon: '🍝' },
      { name: 'Conserves', icon: '🥫' },
      { name: 'Épicerie', icon: '🛒' },
      { name: 'Épices & Condiments', icon: '🧂' },
      { name: 'Huiles & Vinaigres', icon: '🫒' },
      { name: 'Surgelés', icon: '🧊' },
      { name: 'Snacks', icon: '🍿' },
      { name: 'Confiserie', icon: '🍬' },
      { name: 'Sucres', icon: '🍯' },
      { name: 'Hygiène', icon: '🧴' },
      { name: 'Entretien', icon: '🧹' },
      { name: 'Bébé', icon: '👶' },
      { name: 'Animalerie', icon: '🐾' },
    ];

    let count = 0;
    for (let i = 0; i < defaults.length; i++) {
      const { data, error } = await supabase
        .from('delivery_categories')
        .upsert({ name: defaults[i].name, sort_order: i, is_active: true }, { onConflict: 'name' })
        .select()
        .single();
      if (!error && data?.id) {
        await setCategoryStoreType(data.id, 'grocery');
        count++;
      }
    }

    res.json({ message: `Seeded ${count} categories`, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /products — admin, create product (supports JSON + FormData with file)
router.post('/products', adminAuth, imageUpload.single('image'), async (req, res) => {
  try {
    const body = req.body;
    const name = body.name || body.customName;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const salePrice = body.salePrice ?? body.customPrice ?? 0;
    const costPrice = body.costPrice ?? 0;
    const stockQty = body.stockQty ?? body.stock ?? 0;
    const categoryId = body.categoryId || null;
    const specs = body.specs || null;
    const description = body.description || body.customDescription || null;
    let imageUrl = body.imageUrl || null;

    if (req.file) {
      const upsertPath = `products/${req.file.filename}`;
      imageUrl = await uploadToStorage(req.file.path, upsertPath);
    }

    const productData = {
      name,
      sale_price: Number(salePrice) || 0,
      cost_price: Number(costPrice) || 0,
      stock_qty: Number(stockQty) || 0,
      image_url: imageUrl,
      category_id: categoryId,
      specs,
      description,
    };

    if (body.promoPrice !== undefined) productData.promo_price = body.promoPrice ? Number(body.promoPrice) : null;
    if (body.flashSalePrice !== undefined) productData.flash_sale_price = body.flashSalePrice ? Number(body.flashSalePrice) : null;
    if (body.flashSaleEnds !== undefined) productData.flash_sale_end_date = body.flashSaleEnds || null;
    if (body.isActive !== undefined) productData.is_active = body.isActive;

    const catalogId = body.catalogId;
    if (catalogId) {
      const { data, error } = await supabase
        .from('delivery_products')
        .update(productData)
        .eq('id', catalogId)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    productData.is_custom = true;
    productData.is_active = true;
    const { data, error } = await supabase
      .from('delivery_products')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /products/:id — admin
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('delivery_products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /erp-products — admin, list all for picker
router.get('/erp-products', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('delivery_products')
      .select('*, delivery_categories(id, name)')
      .order('name');

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
