import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('delivery_settings')
      .select('value')
      .eq('key', 'admin_dismissed')
      .single();
    res.json(data?.value || []);
  } catch {
    res.json([]);
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.slice(-200) : [];
    await supabase
      .from('delivery_settings')
      .upsert({ key: 'admin_dismissed', value: ids }, { onConflict: 'key' });
    res.json({ ok: true, count: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
