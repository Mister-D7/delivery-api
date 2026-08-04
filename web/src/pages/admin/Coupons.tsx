import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

type CouponCustomer = { id: string; name: string; email?: string; phone?: string; orderCount?: number };

type Coupon = {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder?: number | null;
  active: boolean;
  expiresAt?: string | null;
  maxUses?: number | null;
  usedCount: number;
  customerId?: string | null;
  customer?: { name?: string; email?: string; phone?: string } | null;
  createdAt?: string;
};

export default function Coupons() {
  const { t } = useTranslation('coupons');
  const { t: tc } = useTranslation('common');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<CouponCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchCoupons = useCallback(() => {
    api.get('/coupons')
      .then(r => setCoupons(r.data.coupons || []))
      .catch(() => toast.error(t('toasts.error')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  useEffect(() => {
    api.get('/coupons/customers').then(r => setCustomers(r.data || [])).catch(() => {});
  }, []);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/coupons/generate', {});
      setCode(r.data.code || '');
    } catch { toast.error(t('toasts.error')); }
    finally { setGenerating(false); }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number(value)) { toast.error(t('toasts.error')); return; }
    setSaving(true);
    try {
      const body: any = {
        type,
        value: Number(value),
        minOrder: minOrder ? Number(minOrder) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        customerId: customerId || undefined,
      };
      if (code.trim()) body.code = code.trim().toUpperCase();
      const r = await api.post('/coupons', body);
      setCoupons(prev => [r.data, ...prev]);
      toast.success(t('toasts.created'));
      setShowForm(false);
      setCode(''); setType('percent'); setValue(''); setMinOrder('');
      setExpiresAt(''); setMaxUses(''); setCustomerId('');
    } catch { toast.error(t('toasts.error')); }
    finally { setSaving(false); }
  };

  const toggle = async (c: Coupon) => {
    try {
      const r = await api.post(`/coupons/${c.id}/toggle`);
      const updated: Coupon = r.data;
      setCoupons(prev => prev.map(x => x.id === c.id ? updated : x));
      toast.success(updated.active ? t('toasts.toggled_on') : t('toasts.toggled_off'));
    } catch { toast.error(t('toasts.error')); }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t('delete'))) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(x => x.id !== id));
      toast.success(t('toasts.deleted'));
    } catch { toast.error(t('toasts.error')); }
  };

  const resetForm = () => {
    setShowForm(false);
    setCode(''); setType('percent'); setValue(''); setMinOrder('');
    setExpiresAt(''); setMaxUses(''); setCustomerId('');
  };

  const fmtDate = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '';
  const isExpired = (iso?: string | null) => !!iso && new Date(iso).getTime() < Date.now();

  const inputStyle = { background: 'var(--admin-bg)', border: '1px solid var(--admin-border2)', color: 'var(--admin-text)' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--admin-border2)' }}>
          <Ticket size={20} style={{ color: 'var(--admin-gold)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('title')}</h1>
          <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>{t('subtitle')}</p>
        </div>
        <button onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="gold-btn px-4 py-2 text-xs font-bold rounded-full flex items-center gap-1.5 flex-shrink-0">
          <Plus size={14} /> {t('new')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="surface-card p-4 mb-4">
          <p className="text-xs font-bold mb-3" style={{ color: 'var(--admin-gold)' }}>{t('form.create_title')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('form.code')}</label>
              <div className="flex gap-2">
                <input value={code} onChange={e => setCode(e.target.value)} placeholder={t('form.code_placeholder')} className="input-field text-xs flex-1" style={inputStyle} />
                <button type="button" onClick={generateCode} disabled={generating}
                  className="px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 flex-shrink-0"
                  style={{ background: 'rgba(191,162,78,0.12)', color: 'var(--admin-gold)' }}>
                  <Sparkles size={12} /> {generating ? '...' : t('form.generate')}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('form.type')}</label>
              <select value={type} onChange={e => setType(e.target.value as 'percent' | 'fixed')} className="input-field text-xs" style={inputStyle}>
                <option value="percent">{t('type.percent')}</option>
                <option value="fixed">{t('type.fixed')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('form.value')}</label>
              <input type="number" min={1} value={value} onChange={e => setValue(e.target.value)} className="input-field text-xs" style={inputStyle}
                placeholder={type === 'percent' ? t('form.value_percent_hint') : t('form.value_fixed_hint')} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('form.min_order')}</label>
              <input type="number" min={0} value={minOrder} onChange={e => setMinOrder(e.target.value)} className="input-field text-xs" style={inputStyle} placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('form.expiry')}</label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="input-field text-xs" style={inputStyle} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('form.max_uses')}</label>
              <input type="number" min={1} value={maxUses} onChange={e => setMaxUses(e.target.value)} className="input-field text-xs" style={inputStyle} placeholder="1" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('form.customer')}</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="input-field text-xs" style={inputStyle}>
                <option value="">{t('customer.all')}</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.orderCount != null ? ` (${t('form.orders', { count: c.orderCount })})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={saving} className="gold-btn px-5 py-2 text-xs font-bold rounded-full">
              {saving ? t('form.save') + '...' : t('form.save')}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-full text-xs font-semibold"
              style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}>
              {t('form.cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="surface-card h-20 animate-pulse" style={{ background: 'var(--admin-surface2)' }} />)}</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 surface-card">
          <Ticket size={40} className="mx-auto mb-4" style={{ color: 'var(--admin-surface3)' }} />
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>{t('empty')}</p>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left" style={{ color: 'var(--admin-muted2)' }}>
                <th className="p-3 font-semibold">{t('table.code')}</th>
                <th className="p-3 font-semibold">{t('table.type')}</th>
                <th className="p-3 font-semibold">{t('table.value')}</th>
                <th className="p-3 font-semibold">{t('table.min_order')}</th>
                <th className="p-3 font-semibold">{t('table.expiry')}</th>
                <th className="p-3 font-semibold">{t('table.uses')}</th>
                <th className="p-3 font-semibold">{t('table.customer')}</th>
                <th className="p-3 font-semibold text-center">{t('table.status')}</th>
                <th className="p-3 font-semibold text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-t" style={{ borderColor: 'var(--admin-border2)' }}>
                  <td className="p-3">
                    <p className="font-bold" style={{ color: 'var(--admin-gold)', fontFamily: 'var(--pt-mono)' }}>{c.code}</p>
                    <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : ''}</p>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: c.type === 'percent' ? 'rgba(191,162,78,0.12)' : 'rgba(74,222,128,0.08)', color: c.type === 'percent' ? 'var(--admin-gold)' : 'var(--admin-success)' }}>
                      {c.type === 'percent' ? t('type.percent') : t('type.fixed')}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">{c.type === 'percent' ? `${c.value}%` : `${c.value} DA`}</td>
                  <td className="p-3" style={{ color: 'var(--admin-muted)' }}>{c.minOrder ? `${c.minOrder} DA` : '—'}</td>
                  <td className="p-3">
                    {c.expiresAt ? (
                      <span style={{ color: isExpired(c.expiresAt) ? 'var(--admin-danger)' : 'var(--admin-text)' }}>
                        {fmtDate(c.expiresAt)}
                        {isExpired(c.expiresAt) && <span className="ml-1 text-[10px] font-bold">{t('expired_badge')}</span>}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--admin-muted)' }}>{t('no_expiry')}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold">{c.usedCount ?? 0}</span>
                    <span style={{ color: 'var(--admin-muted)' }}> / {c.maxUses ?? 1}</span>
                  </td>
                  <td className="p-3">
                    {c.customer ? (
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.customer.name || '—'}</p>
                        {c.customer.email && <p className="text-[10px] truncate" style={{ color: 'var(--admin-muted2)' }}>{c.customer.email}</p>}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--admin-muted)' }}>{c.customerId ? t('customer.all') : '—'}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggle(c)} title={t('toggle_active')}
                      className="w-9 h-5 rounded-full relative inline-flex items-center transition-colors"
                      style={{ background: c.active ? 'var(--admin-success)' : 'var(--admin-surface3)' }}>
                      <span className="absolute w-4 h-4 rounded-full bg-white transition-all"
                        style={{ top: 2, left: c.active ? 18 : 2 }} />
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg"
                      style={{ background: 'rgba(217,96,59,0.08)', color: 'var(--admin-danger)' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-2 p-3 border-t" style={{ borderColor: 'var(--admin-border2)' }}>
            <button onClick={fetchCoupons} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}>
              <RefreshCw size={12} /> {tc('actions.refresh')}
            </button>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted2)' }}>{coupons.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
