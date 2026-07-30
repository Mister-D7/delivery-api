import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Package, LogOut, Plus, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { WILAYAS, getCommunesByWilaya } from '../data/algeria';

type Order = { id: string; status: string; total: number; secureToken: string; createdAt: string; items?: any[] };
type Address = { id: string; label: string; address: string; wilayaCode?: number; commune?: string; lat?: number; lng?: number };

export default function CustomerProfile() {
  const { t } = useTranslation('customer-profile');
  const { customer, token, loading, logout, updateProfile } = useCustomerAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrText, setNewAddrText] = useState('');
  const [newAddrWilaya, setNewAddrWilaya] = useState<number | null>(null);
  const [newAddrCommune, setNewAddrCommune] = useState('');
  const [showAddAddr, setShowAddAddr] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!token) { navigate('/auth/login'); return; }
    setName(customer?.name || '');
    setPhone(customer?.phone || '');
    setAddresses((customer?.addresses as Address[]) || []);
    api.get('/auth/my-orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setOrders(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [token, loading, customer, navigate]);

  const handleSave = async () => {
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim(), addresses });
      setEditing(false);
      toast.success(t('saved'));
    } catch { toast.error(t('email')); }
  };

  const addAddress = () => {
    if (!newAddrLabel.trim() || (!newAddrText.trim() && !newAddrCommune)) return;
    const parts = [newAddrText.trim()];
    if (newAddrCommune) parts.push(newAddrCommune);
    const w = WILAYAS.find(x => x.code === newAddrWilaya);
    if (w) parts.push(w.name);
    setAddresses([...addresses, {
      id: Date.now().toString(),
      label: newAddrLabel.trim(),
      address: parts.filter(Boolean).join(', '),
      wilayaCode: newAddrWilaya || undefined,
      commune: newAddrCommune || undefined,
    }]);
    setNewAddrLabel('');
    setNewAddrText('');
    setNewAddrWilaya(null);
    setNewAddrCommune('');
    setShowAddAddr(false);
  };

  const removeAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  if (loading || !customer) return null;

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0a0a0a' }}>
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.25em] font-semibold mb-2" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>{t('title')}</p>
          <h1 className="text-2xl font-extrabold mb-6" style={{ fontFamily: "'Unbounded', sans-serif" }}>{customer.name}</h1>

          {/* Logout button — top */}
          <button onClick={() => { logout(); navigate('/'); }} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mb-4" style={{ background: 'rgba(217,96,59,0.1)', color: '#d9603b' }}>
            <LogOut size={15} /> {t('logout')}
          </button>

          {/* Profile */}
          <div className="surface-card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold tracking-wide" style={{ color: '#8c8578' }}>{t('title')}</p>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#bfa24e' }}>
                  <Edit3 size={12} /> Modifier
                </button>
              ) : (
                <button onClick={() => { setName(customer.name); setPhone(customer.phone || ''); setAddresses((customer?.addresses as Address[]) || []); setEditing(false); }} className="text-xs" style={{ color: '#8c8578' }}>
                  Annuler
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>{t('name')}</label>
                <input value={name} onChange={e => setName(e.target.value)} disabled={!editing} className="input-field" />
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>{t('phone')}</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} disabled={!editing} placeholder="Ex: 0555 12 34 56" className="input-field" />
              </div>
              <p className="text-xs" style={{ color: '#555' }}>{customer.email}</p>
            </div>
            {editing && (
              <button onClick={handleSave} className="gold-btn w-full py-2.5 text-xs font-bold mt-4">{t('save')}</button>
            )}
          </div>

          {/* Addresses */}
          <div className="surface-card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold tracking-wide flex items-center gap-1.5" style={{ color: '#8c8578' }}><MapPin size={13} /> {t('addresses')}</p>
              {editing && (
                <button onClick={() => setShowAddAddr(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#bfa24e' }}>
                  <Plus size={12} /> {t('add_address')}
                </button>
              )}
            </div>
            {addresses.length === 0 && !showAddAddr && (
              <p className="text-xs text-center py-3" style={{ color: '#555' }}>{t('add_address')}</p>
            )}
            <div className="space-y-2">
              {addresses.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1a1a1a' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{a.label}</p>
                    <p className="text-xs truncate" style={{ color: '#8c8578' }}>{a.address}</p>
                  </div>
                  {editing && <button onClick={() => removeAddress(a.id)}><Trash2 size={13} style={{ color: '#d9603b' }} /></button>}
                </div>
              ))}
            </div>
            {showAddAddr && (
              <div className="mt-3 p-3 rounded-xl space-y-2" style={{ background: '#1a1a1a' }}>
                <input value={newAddrLabel} onChange={e => setNewAddrLabel(e.target.value)} placeholder="Ex: Maison, Travail" className="input-field" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-semibold mb-1 block" style={{ color: '#555' }}>Wilaya</label>
                    <select value={newAddrWilaya ?? ''} onChange={e => { setNewAddrWilaya(Number(e.target.value) || null); setNewAddrCommune(''); }}
                      className="input-field text-[11px]">
                      <option value="">Wilaya</option>
                      {WILAYAS.map(w => <option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold mb-1 block" style={{ color: '#555' }}>Commune</label>
                    <select value={newAddrCommune} onChange={e => setNewAddrCommune(e.target.value)}
                      className="input-field text-[11px]" disabled={!newAddrWilaya}>
                      <option value="">Commune</option>
                      {getCommunesByWilaya(newAddrWilaya ?? 0).map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <input value={newAddrText} onChange={e => setNewAddrText(e.target.value)} placeholder="Rue, cité..." className="input-field" />
                <div className="flex gap-2">
                  <button onClick={addAddress} className="gold-btn flex-1 py-2 text-xs font-bold">{t('add_address')}</button>
                  <button onClick={() => setShowAddAddr(false)} className="flex-1 py-2 text-xs font-semibold rounded-xl" style={{ background: '#1a1a1a', color: '#8c8578' }}>Annuler</button>
                </div>
              </div>
            )}
            {editing && (
              <button onClick={handleSave} className="gold-btn w-full py-2.5 text-xs font-bold mt-3">{t('save')}</button>
            )}
          </div>

          {/* Orders */}
          <div className="surface-card p-5 mb-4">
            <p className="text-xs font-bold tracking-wide mb-3 flex items-center gap-1.5" style={{ color: '#8c8578' }}><Package size={13} /> {t('orders')}</p>
            {loadingOrders ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#1a1a1a' }} />)}</div>
            ) : orders.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: '#555' }}>{t('orders')}</p>
            ) : (
              <div className="space-y-2">
                {orders.map(o => (
                  <button key={o.id} onClick={() => navigate(`/track/${o.secureToken}`)} className="w-full flex items-center gap-3 p-3 rounded-xl text-left" style={{ background: '#1a1a1a' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">#{o.id.slice(0, 8)}</p>
                      <p className="text-[11px]" style={{ color: '#8c8578' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: '#bfa24e' }}>{o.total} DA</p>
                      <p className="text-[11px]" style={{ color: '#8c8578' }}>{o.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
