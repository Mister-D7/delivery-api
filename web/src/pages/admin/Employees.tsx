import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';

type Employee = {
  id: string;
  name: string;
  role: string;
  grossSalary: number;
  employerCost: number;
  active: boolean;
  createdAt?: string;
};

const ROLES = ['Livreur', 'Vendeur', 'Gérant', 'Autre'];

export default function AdminEmployees() {
  const { t } = useTranslation('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ activeCount: number; grossTotal: number; employerTotal: number } | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Livreur');
  const [grossSalary, setGrossSalary] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSalary, setEditSalary] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([
        api.get('/employees'),
        api.get('/employees/summary'),
      ]);
      setEmployees(r.data.employees || []);
      setSummary(s.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createEmployee = async () => {
    if (!name.trim() || !Number(grossSalary)) {
      toast.error(t('form.error'));
      return;
    }
    setSaving(true);
    try {
      await api.post('/employees', { name, role, grossSalary: Number(grossSalary), active: true });
      setName(''); setRole('Livreur'); setGrossSalary('');
      toast.success(t('form.saved'));
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('form.error'));
    }
    finally { setSaving(false); }
  };

  const startEdit = (e: Employee) => {
    setEditId(e.id);
    setEditName(e.name);
    setEditRole(e.role);
    setEditSalary(String(e.grossSalary));
  };

  const saveEdit = async (id: string) => {
    try {
      await api.patch(`/employees/${id}`, { name: editName, role: editRole, grossSalary: Number(editSalary) || 0 });
      setEditId(null);
      toast.success(t('form.saved'));
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('form.error'));
    }
  };

  const toggleActive = async (e: Employee) => {
    try {
      await api.patch(`/employees/${e.id}`, { active: !e.active });
      fetchAll();
    } catch {}
  };

  const removeEmployee = async (e: Employee) => {
    if (!confirm(t('actions.delete_confirm'))) return;
    try {
      await api.delete(`/employees/${e.id}`);
      toast.success(t('actions.deleted'));
      fetchAll();
    } catch {}
  };

  const inputStyle = { background: 'var(--admin-bg)', border: '1px solid var(--admin-border2)', color: 'var(--admin-text)' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--admin-border2)' }}>
          <Users size={20} style={{ color: 'var(--admin-gold)' }} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('title')}</h1>
          <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{t('subtitle')}</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="surface-card p-3">
            <p className="text-[10px] font-semibold" style={{ color: 'var(--admin-muted)' }}>{t('summary.active')}</p>
            <p className="text-lg font-bold mt-1" style={{ color: 'var(--admin-gold)' }}>{summary.activeCount}</p>
          </div>
          <div className="surface-card p-3">
            <p className="text-[10px] font-semibold" style={{ color: 'var(--admin-muted)' }}>{t('summary.gross')}</p>
            <p className="text-lg font-bold mt-1" style={{ color: 'var(--admin-text)' }}>{summary.grossTotal.toLocaleString('fr-FR')} DA</p>
          </div>
          <div className="surface-card p-3">
            <p className="text-[10px] font-semibold" style={{ color: 'var(--admin-muted)' }}>{t('summary.employer')}</p>
            <p className="text-lg font-bold mt-1" style={{ color: 'var(--admin-danger)' }}>{summary.employerTotal.toLocaleString('fr-FR')} DA</p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--admin-muted2)' }}>{t('summary.cnas')}</p>
          </div>
        </div>
      )}

      <div className="surface-card p-4 mb-6">
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--admin-gold)' }}>{t('form.title')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('form.name')} className="input-field text-xs" />
          <select value={role} onChange={e => setRole(e.target.value)} className="input-field text-xs" style={inputStyle}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input type="number" min={0} value={grossSalary} onChange={e => setGrossSalary(e.target.value)} placeholder={t('form.gross')} className="input-field text-xs" />
          <button onClick={createEmployee} disabled={saving} className="gold-btn flex items-center justify-center gap-1.5 text-xs font-bold rounded-full">
            <Plus size={13} /> {t('form.add')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="surface-card h-14 animate-pulse" style={{ background: 'var(--admin-surface2)' }} />)}</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-14 surface-card">
          <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--admin-surface3)' }} />
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {employees.map(e => (
            <div key={e.id} className="surface-card p-3 flex items-center gap-3">
              {editId === e.id ? (
                <>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="input-field text-xs flex-1" style={inputStyle} />
                  <select value={editRole} onChange={e => setEditRole(e.target.value)} className="input-field text-xs w-28" style={inputStyle}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input type="number" value={editSalary} onChange={e => setEditSalary(e.target.value)} className="input-field text-xs w-28" style={inputStyle} />
                  <button onClick={() => saveEdit(e.id)} className="p-2 rounded-lg" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--admin-success)' }}><Save size={14} /></button>
                  <button onClick={() => setEditId(null)} className="p-2 rounded-lg" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}><X size={14} /></button>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'var(--admin-border2)', color: 'var(--admin-gold)' }}>{e.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold">{e.name}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--admin-border2)', color: 'var(--admin-muted2)' }}>{e.role}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>{t('row.gross')}: <span style={{ color: 'var(--admin-text)', fontWeight: 600 }}>{e.grossSalary.toLocaleString('fr-FR')} DA</span></p>
                      <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>{t('row.employer')}: <span style={{ color: 'var(--admin-danger)', fontWeight: 600 }}>{e.employerCost.toLocaleString('fr-FR')} DA</span></p>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(e)} title={e.active ? t('row.active') : t('row.inactive')} className="p-1.5 rounded-lg" style={{ color: e.active ? 'var(--admin-success)' : 'var(--admin-muted2)' }}>
                    {e.active ? <CheckCircle size={15} /> : <XCircle size={15} />}
                  </button>
                  <button onClick={() => startEdit(e)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-gold)' }}>{t('actions.edit')}</button>
                  <button onClick={() => removeEmployee(e)} className="p-2 rounded-lg" style={{ color: 'var(--admin-danger)' }}><Trash2 size={14} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
