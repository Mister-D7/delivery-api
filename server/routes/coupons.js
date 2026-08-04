import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';
import { verifyToken } from '../lib/auth.js';

const router = Router();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `FIDEL-${s}`;
}

async function generateUniqueCode() {
  for (let i = 0; i < 12; i++) {
    const code = generateCode();
    const { data } = await supabase.from('delivery_coupons').select('id').eq('code', code).maybeSingle();
    if (!data) return code;
  }
  return null;
}

function mapCoupon(c) {
  if (!c) return c;
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minOrder: c.min_order,
    active: c.active,
    expiresAt: c.expires_at,
    maxUses: c.max_uses,
    usedCount: c.used_count,
    customerId: c.customer_id,
    customer: c.delivery_customers
      ? { name: c.delivery_customers.name, email: c.delivery_customers.email, phone: c.delivery_customers.phone }
      : null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

async function attachCustomers(coupons) {
  const list = coupons || [];
  const ids = [...new Set(list.map(c => c.customer_id).filter(Boolean))];
  const byId = {};
  if (ids.length) {
    const { data: customers } = await supabase
      .from('delivery_customers')
      .select('id, name, email, phone')
      .in('id', ids);
    (customers || []).forEach(c => (byId[c.id] = c));
  }
  list.forEach(c => {
    c.delivery_customers = c.customer_id ? byId[c.customer_id] || null : null;
  });
  return list;
}

export async function resolveCustomerFromRequest(req) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    const decoded = verifyToken(header.slice(7));
    if (!decoded?.email) return null;
    const { data: customer } = await supabase
      .from('delivery_customers')
      .select('id')
      .eq('email', decoded.email)
      .maybeSingle();
    return customer?.id || null;
  } catch {
    return null;
  }
}

export function computeDiscount(coupon, subtotal) {
  const sub = Math.max(0, Number(subtotal) || 0);
  const value = Number(coupon.value) || 0;
  if (coupon.type === 'percent') {
    return Math.min(sub, Math.round((sub * value) / 100));
  }
  return Math.min(sub, value);
}

export async function validateCouponForCheckout({ code, subtotal, customerId }) {
  const normalized = String(code || '').trim().toUpperCase();
  const sub = Math.max(0, Number(subtotal) || 0);
  if (!normalized) return { valid: false, reason: 'NOT_FOUND' };

  const { data: coupon, error } = await supabase
    .from('delivery_coupons')
    .select('*')
    .eq('code', normalized)
    .maybeSingle();
  if (error) throw error;
  if (!coupon) return { valid: false, reason: 'NOT_FOUND' };
  if (!coupon.active) return { valid: false, reason: 'INACTIVE' };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { valid: false, reason: 'EXPIRED' };
  if ((coupon.used_count || 0) >= (coupon.max_uses || 1)) return { valid: false, reason: 'MAX_USES' };
  if ((coupon.min_order || 0) > 0 && sub < Number(coupon.min_order)) {
    return { valid: false, reason: 'MIN_ORDER', minOrder: Number(coupon.min_order) };
  }
  if (coupon.customer_id && coupon.customer_id !== customerId) return { valid: false, reason: 'CUSTOMER_ONLY' };

  return { valid: true, coupon, discount: computeDiscount(coupon, sub) };
}

export async function consumeCoupon(couponId) {
  const { data, error } = await supabase.rpc('consume_coupon_usage', { p_coupon_id: couponId });
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

router.get('/', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('delivery_coupons')
      .select('*')
      .order('created_at', { ascending: false });
    const coupons = await attachCustomers(data || []);
    res.json({ coupons: coupons.map(mapCoupon) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const { code, type, value, minOrder, expiresAt, maxUses, customerId } = req.body;
    if (!type || !['percent', 'fixed'].includes(type)) {
      return res.status(400).json({ error: 'Type requis (percent ou fixed)' });
    }
    const finalCode = code ? String(code).trim().toUpperCase() : await generateUniqueCode();
    if (!finalCode) return res.status(400).json({ error: 'Code invalide' });

    const { data, error } = await supabase
      .from('delivery_coupons')
      .insert({
        code: finalCode,
        type,
        value: Math.max(0, Number(value) || 0),
        min_order: Math.max(0, Number(minOrder) || 0),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        max_uses: Math.max(1, Number(maxUses) || 1),
        customer_id: customerId || null,
      })
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    const [coupon] = await attachCustomers([data]);
    res.status(201).json(mapCoupon(coupon));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers', adminAuth, async (req, res) => {
  try {
    const { data: customers } = await supabase
      .from('delivery_customers')
      .select('id, name, email, phone')
      .order('name');
    const { data: orders } = await supabase.from('delivery_orders').select('customer_id');
    const count = {};
    (orders || []).forEach(o => {
      if (o.customer_id) count[o.customer_id] = (count[o.customer_id] || 0) + 1;
    });
    res.json(
      (customers || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        orderCount: count[c.id] || 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', adminAuth, async (req, res) => {
  try {
    const code = await generateUniqueCode();
    if (!code) return res.status(500).json({ error: 'Impossible de générer un code unique' });
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const customerId = await resolveCustomerFromRequest(req);
    const result = await validateCouponForCheckout({ code, subtotal, customerId });
    if (!result.valid) {
      return res.json({ valid: false, reason: result.reason, minOrder: result.minOrder });
    }
    res.json({
      valid: true,
      discount: result.discount,
      coupon: {
        code: result.coupon.code,
        type: result.coupon.type,
        value: result.coupon.value,
        minOrder: result.coupon.min_order,
        expiresAt: result.coupon.expires_at,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const { code, type, value, minOrder, expiresAt, maxUses, customerId, active } = req.body;
    const updates = {};
    if (code !== undefined) updates.code = String(code).trim().toUpperCase();
    if (type !== undefined) {
      if (!['percent', 'fixed'].includes(type)) return res.status(400).json({ error: 'Type invalide' });
      updates.type = type;
    }
    if (value !== undefined) updates.value = Math.max(0, Number(value) || 0);
    if (minOrder !== undefined) updates.min_order = Math.max(0, Number(minOrder) || 0);
    if (expiresAt !== undefined) updates.expires_at = expiresAt ? new Date(expiresAt).toISOString() : null;
    if (maxUses !== undefined) updates.max_uses = Math.max(1, Number(maxUses) || 1);
    if (customerId !== undefined) updates.customer_id = customerId || null;
    if (active !== undefined) updates.active = !!active;

    const { data, error } = await supabase
      .from('delivery_coupons')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Coupon introuvable' });
    const [coupon] = await attachCustomers([data]);
    res.json(mapCoupon(coupon));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const { data: current } = await supabase
      .from('delivery_coupons')
      .select('active')
      .eq('id', req.params.id)
      .single();
    if (!current) return res.status(404).json({ error: 'Coupon introuvable' });

    const { data, error } = await supabase
      .from('delivery_coupons')
      .update({ active: !current.active })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    const [coupon] = await attachCustomers([data]);
    res.json(mapCoupon(coupon));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('delivery_coupons').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
