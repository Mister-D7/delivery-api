import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';

const router = Router();

// GET /themes — admin, all themes
router.get('/', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('delivery_themes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

// GET /themes/active — public
router.get('/active', async (req, res) => {
  try {
    const { data: settings } = await supabase
      .from('delivery_settings')
      .select('value')
      .eq('key', 'main')
      .single();

    if (!settings?.value?.activeThemeId) {
      const { data: allThemes } = await supabase.from('delivery_themes').select('*').order('created_at', { ascending: false }).limit(1);
      return res.json(allThemes?.[0] || getDefaultTheme());
    }

    const { data: theme } = await supabase
      .from('delivery_themes')
      .select('*')
      .eq('id', settings.value.activeThemeId)
      .single();

    res.json(theme || getDefaultTheme());
  } catch {
    res.json(getDefaultTheme());
  }
});

// GET /themes/:id — admin
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('delivery_themes')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Theme not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /themes — admin, create
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, primaryColor, accentColor, bgColor, surfaceColor, textColor, fontFamily, borderStyle } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const { data, error } = await supabase
      .from('delivery_themes')
      .insert({
        name,
        primary_color: primaryColor || '#7C5CFC',
        accent_color: accentColor || '#43E6FF',
        bg_color: bgColor || '#0B0E1A',
        surface_color: surfaceColor || '#111827',
        text_color: textColor || '#F4F4F5',
        font_family: fontFamily || 'Inter',
        border_style: borderStyle || 'sharp',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /themes/:id — admin, update
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, primaryColor, accentColor, bgColor, surfaceColor, textColor, fontFamily, borderStyle } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (primaryColor !== undefined) updates.primary_color = primaryColor;
    if (accentColor !== undefined) updates.accent_color = accentColor;
    if (bgColor !== undefined) updates.bg_color = bgColor;
    if (surfaceColor !== undefined) updates.surface_color = surfaceColor;
    if (textColor !== undefined) updates.text_color = textColor;
    if (fontFamily !== undefined) updates.font_family = fontFamily;
    if (borderStyle !== undefined) updates.border_style = borderStyle;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('delivery_themes')
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

// DELETE /themes/:id — admin
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('delivery_themes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getDefaultTheme() {
  return {
    id: 'default',
    name: 'Default',
    primary_color: '#D4A843',
    accent_color: '#ffffff',
    bg_color: '#0a0a0a',
    surface_color: '#1a1a1a',
    text_color: '#f5f5f5',
    font_family: 'Inter',
    border_style: 'rounded',
  };
}

export default router;
