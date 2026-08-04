import { useState, useEffect, useMemo, useCallback } from 'react';
import { Archive, ArchiveRestore, Package, RefreshCw, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import OrderStatusBadge from '../../components/OrderStatusBadge';

type Order = {
  id: string; secureToken: string; status: string; total: number; deliveryFee?: number;
  customerName?: string; phone?: string; address?: string;
  items?: any[];
  createdAt: string; updatedAt: string; archivedAt?: string | null;
};

export default function ArchiveView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [savingDays, setSavingDays] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchArchived = useCallback(() => {
    api.get('/orders', { params: { archived: true, limit: 100 } })
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast.error('Erreur lors du chargement des archives'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchArchived();
    api.get('/storefront/settings/archive_after_days').then(r => {
      const n = Number(r.data);
      if (Number.isFinite(n) && n > 0) setDays(Math.floor(n));
    }).catch(() => {});
  }, [fetchArchived]);

  const saveDays = async () => {
    const n = Number(days);
    if (!Number.isFinite(n) || n < 1) return toast.error('Valeur invalide');
    setSavingDays(true);
    try {
      await api.put('/storefront/settings/archive_after_days', { value: Math.floor(n) });
      toast.success('Paramètre enregistré');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSavingDays(false);
    }
  };

  const unarchive = async (id: string) => {
    try {
      await api.post(`/orders/${id}/unarchive`);
      toast.success('Commande restaurée');
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch {
      toast.error('Erreur lors de la restauration');
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of orders) {
      const key = new Date(o.archivedAt || o.updatedAt || o.createdAt).toLocaleDateString('fr-FR');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] > b[0] ? -1 : 1));
  }, [orders]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--admin-border2)' }}>
          <Archive size={20} style={{ color: 'var(--admin-gold)' }} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>Archives</h1>
          <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Commandes livrées / annulées archivées</p>
        </div>
      </div>

      <div className="surface-card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 size={14} style={{ color: 'var(--admin-gold)' }} />
          <p className="text-xs font-bold" style={{ color: 'var(--admin-gold)' }}>Archivage automatique</p>
        </div>
        <p className="text-[11px] mb-3" style={{ color: 'var(--admin-muted)' }}>
          Les commandes livrées ou annulées depuis plus de X jours seront archivées automatiquement.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <input type="number" min={1} value={days} onChange={e => setDays(Number(e.target.value))}
            className="input-field text-xs" style={{ width: 120 }} placeholder="Jours" />
          <button onClick={saveDays} disabled={savingDays}
            className="gold-btn px-4 py-2 text-xs font-bold rounded-full">
            {savingDays ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button onClick={fetchArchived}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}>
            <RefreshCw size={12} /> Rafraîchir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="surface-card h-20 animate-pulse" style={{ background: 'var(--admin-surface2)' }} />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 surface-card">
          <Archive size={40} className="mx-auto mb-4" style={{ color: 'var(--admin-surface3)' }} />
          <p className="text-sm" style={{ color: 'var(--admin-muted)' }}>Aucune commande archivée</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([date, list]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <p className="text-xs font-bold" style={{ color: 'var(--admin-gold)' }}>{date}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted2)' }}>{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map(order => (
                  <div key={order.id} className="surface-card overflow-hidden">
                    <div className="w-full p-3 flex items-center gap-3">
                      <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">#{order.id.slice(0, 8)}</span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>{order.customerName} · {order.phone}</p>
                      </button>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: 'var(--admin-gold)' }}>{order.total} DA</p>
                        {order.archivedAt && <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>Archivée le {new Date(order.archivedAt).toLocaleDateString('fr-FR')}</p>}
                      </div>
                      <button onClick={() => unarchive(order.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold flex-shrink-0"
                        style={{ background: 'rgba(74,222,128,0.08)', color: 'var(--admin-success)' }}>
                        <ArchiveRestore size={12} /> Restaurer
                      </button>
                      <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-1 flex-shrink-0">
                        {expandedId === order.id ? <ChevronUp size={16} style={{ color: 'var(--admin-muted2)' }} /> : <ChevronDown size={16} style={{ color: 'var(--admin-muted2)' }} />}
                      </button>
                    </div>
                    {expandedId === order.id && (
                      <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--admin-border2)' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 text-xs">
                          <p><span style={{ color: 'var(--admin-muted)' }}>Client: </span>{order.customerName || '-'}</p>
                          <p><span style={{ color: 'var(--admin-muted)' }}>Téléphone: </span>{order.phone || '-'}</p>
                          <p className="col-span-1 sm:col-span-2"><span style={{ color: 'var(--admin-muted)' }}>Adresse: </span>{order.address || '-'}</p>
                          <p><span style={{ color: 'var(--admin-muted)' }}>Passée le: </span>{new Date(order.createdAt).toLocaleString('fr-FR')}</p>
                          <p><span style={{ color: 'var(--admin-muted)' }}>Livraison: </span>{order.deliveryFee != null ? `${order.deliveryFee} DA` : '—'}</p>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--admin-surface2)' }}>
                            <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--admin-muted)' }}>Articles:</p>
                            {order.items.map((item: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: i < order.items!.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium truncate">{item.customName || item.product?.name || item.name || 'Produit'}</p>
                                  <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>× {item.quantity} — {Number(item.unitPrice || 0) * item.quantity} DA</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
