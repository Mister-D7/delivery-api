import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';

const router = Router();

// GET /banners — admin, all banners
router.get('/', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('delivery_banners')
      .select('*')
      .order('position', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

// GET /banners/active — public, active banners within time range
router.get('/active', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('delivery_banners')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    const active = (data || []).filter(b => {
      if (b.starts_at && b.starts_at > now) return false;
      if (b.ends_at && b.ends_at < now) return false;
      return true;
    });

    res.json(active);
  } catch {
    res.json([]);
  }
});

// POST /banners — admin, create
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, isActive, position, startsAt, endsAt } = req.body;
    if (!title || !imageUrl) return res.status(400).json({ error: 'Title and image required' });

    const { data, error } = await supabase
      .from('delivery_banners')
      .insert({
        title,
        subtitle: subtitle || null,
        image_url: imageUrl,
        link_url: linkUrl || null,
        is_active: isActive !== false,
        position: position || 0,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /banners/:id — admin, update
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, subtitle, imageUrl, linkUrl, isActive, position, startsAt, endsAt } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    if (linkUrl !== undefined) updates.link_url = linkUrl;
    if (isActive !== undefined) updates.is_active = isActive;
    if (position !== undefined) updates.position = position;
    if (startsAt !== undefined) updates.starts_at = startsAt;
    if (endsAt !== undefined) updates.ends_at = endsAt;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('delivery_banners')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /banners/:id — admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('delivery_banners').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
