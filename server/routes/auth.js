import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { signToken, hashPassword, comparePassword } from '../lib/auth.js';
import { customerAuth, adminAuth } from '../middleware/auth.js';
import { getAuthUrl } from '../lib/cloud.js';

const router = Router();

// GET /auth/google — get Google login URL (admin)
router.get('/google', (req, res) => {
  try {
    const { url } = getAuthUrl('google_drive', 'auth');
    res.json({ url });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /auth/google/customer — get Google login URL (customer)
router.get('/google/customer', (req, res) => {
  try {
    const { url } = getAuthUrl('google_drive', 'auth-customer');
    res.json({ url });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /auth/me — get current user info (admin or customer)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.replace('Bearer ', '');
    const { verifyToken } = await import('../lib/auth.js');
    const decoded = verifyToken(token);

    // Try admin first
    const { data: admin } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url')
      .eq('email', decoded.email)
      .maybeSingle();

    if (admin) return res.json({ user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role || 'admin', avatarUrl: admin.avatar_url } });

    // Try customer
    const { data: customer } = await supabase
      .from('delivery_customers')
      .select('id, name, email, phone, addresses')
      .eq('email', decoded.email)
      .maybeSingle();

    if (customer) return res.json({ user: { ...customer, role: 'customer' } });

    res.status(401).json({ error: 'User not found' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /auth/login — admin or customer
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { data: admin } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (admin && comparePassword(password, admin.password_hash)) {
      const token = signToken({ email: admin.email, role: admin.role || 'admin' });
      return res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role || 'admin' } });
    }

    const { data: customer } = await supabase
      .from('delivery_customers')
      .select('*')
      .eq('email', email)
      .single();

    if (customer && comparePassword(password, customer.password_hash)) {
      const token = signToken({ email: customer.email, role: 'customer' });
      return res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, addresses: customer.addresses } });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/register — customer
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, name required' });

    const { data: existing } = await supabase.from('delivery_customers').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = hashPassword(password);
    const { data: customer, error } = await supabase
      .from('delivery_customers')
      .insert({ email, password_hash, name, phone: phone || null })
      .select('id, name, email, phone, addresses')
      .single();

    if (error) throw error;

    const token = signToken({ email: customer.email, role: 'customer' });
    res.status(201).json({ token, customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /auth/profile — customer
router.put('/profile', customerAuth, async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (addresses !== undefined) updates.addresses = addresses;

    const { data, error } = await supabase
      .from('delivery_customers')
      .update(updates)
      .eq('id', req.customer.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ id: data.id, name: data.name, email: data.email, phone: data.phone, addresses: data.addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapOrder(o) {
  if (!o) return o;
  return { ...o, createdAt: o.created_at, updatedAt: o.updated_at, secureToken: o.secure_token, customerId: o.customer_id, customerName: o.customer_name, deliveryFee: o.delivery_fee, voiceOrderUrl: o.voice_order_url, items: o.delivery_order_items || o.items || [] };
}

// GET /auth/my-orders — customer
router.get('/my-orders', customerAuth, async (req, res) => {
  try {
    const { data: orders } = await supabase
      .from('delivery_orders')
      .select('*, delivery_order_items(*)')
      .eq('customer_id', req.customer.id)
      .order('created_at', { ascending: false });

    res.json((orders || []).map(mapOrder));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
