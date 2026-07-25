import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';

const router = Router();

// GET /storefront/settings — public, all settings
router.get('/settings', async (req, res) => {
  try {
    const { data } = await supabase.from('delivery_settings').select('*');
    const settings = {};
    (data || []).forEach(s => { settings[s.key] = s.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /storefront/settings/:key — public, specific setting
router.get('/settings/:key', async (req, res) => {
  try {
    const { data } = await supabase
      .from('delivery_settings')
      .select('value')
      .eq('key', req.params.key)
      .single();

    res.json(data?.value || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /storefront/settings/:key — admin, save setting
router.put('/settings/:key', adminAuth, async (req, res) => {
  try {
    const value = req.body.value !== undefined ? req.body.value : req.body;
    const { error } = await supabase
      .from('delivery_settings')
      .upsert({ key: req.params.key, value }, { onConflict: 'key' });

    if (error) throw error;
    res.json({ ok: true, key: req.params.key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
