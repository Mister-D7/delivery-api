import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';

const router = Router();

function productRetailPrice(p) {
  return Number(p?.promo_price ?? p?.sale_price ?? 0);
}

async function resolveCombos(list) {
  const ids = new Set();
  (list || []).forEach(c => {
    (c.products || []).forEach(p => {
      if (p && p.productId) ids.add(p.productId);
    });
  });

  let map = {};
  if (ids.size) {
    const { data } = await supabase
      .from('delivery_products')
      .select('id, name, sale_price, promo_price, image_url')
      .in('id', [...ids]);
    (data || []).forEach(p => {
      map[p.id] = p;
    });
  }

  return (list || []).map(c => {
    const products = (c.products || []).map(p => {
      const prod = map[p.productId];
      if (prod) {
        return {
          productId: prod.id,
          name: prod.name,
          price: productRetailPrice(prod),
          imageUrl: prod.image_url,
          qty: Number(p.qty) || 1,
        };
      }
      return {
        productId: p.productId,
        name: 'Produit supprimé',
        price: 0,
        imageUrl: null,
        qty: Number(p.qty) || 1,
      };
    });
    const totalValue = products.reduce((s, p) => s + p.price * p.qty, 0);
    const comboPrice = Number(c.price) || 0;
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      price: comboPrice,
      imageUrl: c.image_url,
      isActive: c.is_active,
      products,
      totalValue,
      savings: Math.max(0, totalValue - comboPrice),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  });
}

async function validateProducts(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return { ok: false, error: 'Au moins un produit est requis' };
  }
  const clean = products
    .filter(p => p && p.productId)
    .map(p => ({ productId: String(p.productId), qty: Math.max(1, Number(p.qty) || 1) }));
  if (clean.length === 0) {
    return { ok: false, error: 'Au moins un produit est requis' };
  }

  const ids = clean.map(p => p.productId);
  const { data, error } = await supabase
    .from('delivery_products')
    .select('id')
    .in('id', ids);
  if (error) return { ok: false, error: error.message };

  const found = new Set((data || []).map(p => p.id));
  const missing = ids.filter(id => !found.has(id));
  if (missing.length > 0) {
    return { ok: false, error: 'Produit(s) introuvable(s) dans le catalogue' };
  }
  return { ok: true, products: clean };
}

router.get('/', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('delivery_combos')
      .select('*')
      .order('created_at', { ascending: false });
    const combos = await resolveCombos(data || []);
    res.json({ combos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const { data } = await supabase
      .from('delivery_combos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    const combos = await resolveCombos(data || []);
    res.json({ combos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, price, imageUrl, products } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Nom du combo requis' });
    }
    const checked = await validateProducts(products);
    if (!checked.ok) return res.status(400).json({ error: checked.error });

    const { data, error } = await supabase
      .from('delivery_combos')
      .insert({
        name: String(name).trim(),
        description: description != null ? String(description) : null,
        price: Math.max(0, Number(price) || 0),
        image_url: imageUrl || null,
        products: checked.products,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    const combos = await resolveCombos([data]);
    res.status(201).json(combos[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, price, imageUrl, products } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ error: 'Nom du combo requis' });
      updates.name = String(name).trim();
    }
    if (description !== undefined) updates.description = description != null ? String(description) : null;
    if (price !== undefined) updates.price = Math.max(0, Number(price) || 0);
    if (imageUrl !== undefined) updates.image_url = imageUrl || null;
    if (products !== undefined) {
      const checked = await validateProducts(products);
      if (!checked.ok) return res.status(400).json({ error: checked.error });
      updates.products = checked.products;
    }

    const { data, error } = await supabase
      .from('delivery_combos')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Combo introuvable' });
    const combos = await resolveCombos([data]);
    res.json(combos[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const { data: current } = await supabase
      .from('delivery_combos')
      .select('is_active')
      .eq('id', req.params.id)
      .single();
    if (!current) return res.status(404).json({ error: 'Combo introuvable' });

    const { data, error } = await supabase
      .from('delivery_combos')
      .update({ is_active: !current.is_active })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    const combos = await resolveCombos([data]);
    res.json(combos[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('delivery_combos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
