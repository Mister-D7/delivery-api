import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { signToken, hashPassword, comparePassword } from '../lib/auth.js';
import { customerAuth } from '../middleware/auth.js';

const router = Router();

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

// GET /auth/my-orders — customer
router.get('/my-orders', customerAuth, async (req, res) => {
  try {
    const { data: orders } = await supabase
      .from('delivery_orders')
      .select('*, delivery_order_items(*)')
      .eq('customer_id', req.customer.id)
      .order('created_at', { ascending: false });

    res.json(orders || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
