import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';

const router = Router();

const CNAS_RATE = 1.26;

function mapEmployee(e) {
  if (!e) return e;
  const grossSalary = Number(e.gross_salary) || 0;
  return {
    id: e.id,
    name: e.name,
    role: e.role || 'Employé',
    grossSalary,
    employerCost: Math.round(grossSalary * CNAS_RATE),
    active: e.active !== false,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}

// GET /employees — admin list
router.get('/', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('delivery_employees')
      .select('*')
      .order('name');
    res.json({ employees: (data || []).map(mapEmployee) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /employees/summary — admin monthly payroll totals
router.get('/summary', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase.from('delivery_employees').select('*').eq('active', true);
    const list = data || [];
    const grossTotal = list.reduce((s, e) => s + (Number(e.gross_salary) || 0), 0);
    res.json({
      activeCount: list.length,
      grossTotal,
      employerTotal: Math.round(grossTotal * CNAS_RATE),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /employees — admin create
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, role, grossSalary, active } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Nom requis' });
    }
    const { data, error } = await supabase
      .from('delivery_employees')
      .insert({
        name: String(name).trim(),
        role: role || 'Employé',
        gross_salary: Math.max(0, Number(grossSalary) || 0),
        active: active !== false,
      })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(mapEmployee(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /employees/:id — admin update
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const { name, role, grossSalary, active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (role !== undefined) updates.role = role;
    if (grossSalary !== undefined) updates.gross_salary = Math.max(0, Number(grossSalary) || 0);
    if (active !== undefined) updates.active = !!active;

    const { data, error } = await supabase
      .from('delivery_employees')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Employé introuvable' });
    res.json(mapEmployee(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /employees/:id — admin delete
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('delivery_employees').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
