import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, TrendingUp, ChevronDown, ChevronUp, MessageCircle, Send, Search, Printer, CheckCircle, XCircle, Truck, AlertTriangle, Copy, Eye, Archive } from 'lucide-react';
import api, { apiBaseURL } from '../../services/api';
import toast from 'react-hot-toast';
import { useOrderSSE } from '../../hooks/useOrderSSE';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import PrintReceipt, { DownloadPdfButton } from '../../components/PrintReceipt';
import ContextMenu, { useContextMenu } from '../../components/ContextMenu';
import { useTranslation } from 'react-i18next';
import { getDeliveryPricing, calcDeliveryFee } from '../../services/deliveryPricing';
import type { DeliveryPricing } from '../../services/deliveryPricing';

type Order = {
  id: string; secureToken: string; status: string; total: number; deliveryFee?: number;
  customerName?: string; phone?: string; address?: string;
  latitude?: number | null; longitude?: number | null;
  items?: any[]; voiceOrderUrl?: string;
  createdAt: string; updatedAt: string;
};

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'];

export default function AdminDashboard() {
  const { t } = useTranslation('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { menu: orderMenu, onContextMenu: orderCtx, closeMenu: closeOrderCtx } = useContextMenu();
  const [ctxOrder, setCtxOrder] = useState<Order | null>(null);
  const [pricing, setPricing] = useState<DeliveryPricing | null>(null);
  const [customFeeInput, setCustomFeeInput] = useState<number | null>(null);

  useEffect(() => { getDeliveryPricing().then(setPricing); }, []);

  // Reset custom fee when expanding a different order
  useEffect(() => { setCustomFeeInput(null); }, [expandedId]);

  const fetchOrders = useCallback(() => {
    api.get('/orders').then(r => setOrders(r.data.orders || [])).catch(e => {
      if (e.response?.status === 401) setAuthError(true);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const adminToken = localStorage.getItem('delivery_token') || '';
    const url = `${apiBaseURL}/events/admin?token=${encodeURIComponent(adminToken)}`;
    const es = new EventSource(url);

    es.addEventListener('new_order', () => { fetchOrders(); });
    es.addEventListener('status_changed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
      } catch {}
    });

    return () => { es.close(); };
  }, [fetchOrders]);

  const handleChatStatusChange = useCallback((status: string) => {
    setOrders(prev => prev.map(o => o.id === chatOrderId ? { ...o, status } : o));
  }, [chatOrderId]);

  const handleChatNewMessage = useCallback((msg: any) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  useOrderSSE(chatOrderId, null, handleChatStatusChange, handleChatNewMessage);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/orders/${id}/status`, { status });
  };

  const archiveOrder = async (id: string) => {
    try {
      await api.post(`/orders/${id}/archive`);
      toast.success('Commande archivée');
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch {
      toast.error('Erreur lors de l\'archivage');
    }
  };

  const confirmWithFee = async (id: string, fee: number) => {
    await api.patch(`/orders/${id}/status`, { status: 'CONFIRMED', deliveryFee: fee });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CONFIRMED', deliveryFee: fee } : o));
  };

  const getSuggestedFee = (order: Order): { fee: number; distance: number } | null => {
    if (!pricing || order.latitude == null || order.longitude == null) return null;
    const result = calcDeliveryFee(pricing, order.total, order.latitude, order.longitude);
    if (result.outOfRange) return null;
    return { fee: result.fee, distance: result.distance };
  };

  const getOrderMenuItems = (o: Order) => {
    const statusIcons: Record<string, any> = {
      PENDING: <Clock size={12} />, CONFIRMED: <CheckCircle size={12} />,
      PREPARING: <Package size={12} />, ON_THE_WAY: <Truck size={12} />,
      DELIVERED: <CheckCircle size={12} />, CANCELLED: <XCircle size={12} />,
    };
    return [
      { label: expandedId === o.id ? t('order.hide') : t('order.show'), icon: <Eye size={12} />, onClick: () => setExpandedId(expandedId === o.id ? null : o.id), color: '#ccc' },
      { label: t('order.chat'), icon: <MessageCircle size={12} />, onClick: () => openChat(o.id), color: 'var(--admin-gold)' },
      { divider: true, label: '', onClick: () => {} },
      ...STATUSES.map(s => ({
        label: s.replace('_', ' '), icon: statusIcons[s],
        onClick: () => updateStatus(o.id, s), color: o.status === s ? 'var(--admin-gold)' : 'var(--admin-muted2)',
      })),
      { divider: true, label: '', onClick: () => {} },
      { label: 'Archiver', icon: <Archive size={12} />, onClick: () => archiveOrder(o.id), color: '#888' },
      { label: 'Copier l\'ID', icon: <Copy size={12} />, onClick: () => { navigator.clipboard?.writeText(o.id); }, color: '#ccc' },
    ];
  };

  const filtered = useMemo(() => {
    let result = orders;
    if (filter !== 'ALL') {
      result = result.filter(o => o.status === filter);
    } else {
      result = result.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.customerName?.toLowerCase().includes(q) ||
        o.phone?.includes(q) ||
        o.id.slice(0, 8).includes(q)
      );
    }
    if (dateFrom) result = result.filter(o => new Date(o.createdAt) >= new Date(dateFrom));
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      result = result.filter(o => new Date(o.createdAt) <= to);
    }
    return result;
  }, [orders, filter, searchQuery, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    onWay: orders.filter(o => o.status === 'ON_THE_WAY').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
  }), [orders]);

  const openChat = async (orderId: string) => {
    setChatOrderId(orderId);
    try { const r = await api.get(`/orders/${orderId}/messages`); setMessages(r.data || []); } catch { setMessages([]); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatOrderId) return;
    setSending(true);
    try {
      await api.post(`/orders/${chatOrderId}/messages`, { text: newMsg.trim(), sender: 'admin' });
      setNewMsg('');
    } catch {}
    finally { setSending(false); }
  };

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-6" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('title')}</h1>

      {authError && (
        <div className="text-center py-12 surface-card">
          <p className="text-sm mb-4" style={{ color: 'var(--admin-danger)' }}>{t('order.chat')}</p>
          <a href="/admin" className="gold-btn px-6 py-2.5 text-sm font-bold rounded-full inline-block">{t('filters.all')}</a>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: t('stats.total_orders'), value: stats.total, icon: Package, color: 'var(--admin-gold)' },
          { label: t('stats.pending'), value: stats.pending, icon: Clock, color: '#ff9800' },
          { label: t('filters.status'), value: stats.onWay, icon: TrendingUp, color: '#2196f3' },
          { label: t('stats.delivered'), value: stats.delivered, icon: Package, color: 'var(--admin-success)' },
          { label: t('order.delete'), value: stats.cancelled, icon: Package, color: 'var(--admin-danger)' },
        ].map((s, i) => (
          <div key={i} className="surface-card p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} style={{ color: s.color }} />
              <span className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>{s.label}</span>
            </div>
            <p className="text-sm font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Date filters */}
      <div className="surface-card p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('filters.search_placeholder')}</label>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('filters.search_placeholder')} className="input-field w-full" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('filters.date')}</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--admin-muted2)' }}>{t('filters.date')}</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-xs" />
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {['ALL', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: filter === s ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)', color: filter === s ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>
            {s === 'ALL' ? t('filters.all') : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="surface-card h-20 animate-pulse" style={{ background: 'var(--admin-surface2)' }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><Package size={40} className="mx-auto mb-4" style={{ color: 'var(--admin-surface3)' }} /><p className="text-sm" style={{ color: 'var(--admin-muted)' }}>{t('empty')}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="surface-card overflow-hidden" onContextMenu={(e) => { setCtxOrder(order); orderCtx(e); }}>
              <div className="w-full p-4 flex items-center gap-3 text-left" style={{ background: 'transparent' }}>
                <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">#{order.id.slice(0, 8)}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--admin-muted)' }}>{order.customerName} · {order.phone}</p>
                </button>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--admin-gold)' }}>{order.total} DA</p>
                  <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <PrintReceipt order={{
                  id: order.id, secureToken: order.secureToken, status: order.status,
                  customerName: order.customerName || 'Client', phone: order.phone || '',
                  address: order.address, total: order.total, deliveryFee: order.deliveryFee,
                  createdAt: order.createdAt,
                  items: (order.items || []).map((i: any) => ({
                    customName: i.customName, product: i.product,
                    quantity: i.quantity, unitPrice: Number(i.unitPrice),
                  })),
                }} />
                <DownloadPdfButton order={{
                  id: order.id, secureToken: order.secureToken, status: order.status,
                  customerName: order.customerName || 'Client', phone: order.phone || '',
                  address: order.address, total: order.total, deliveryFee: order.deliveryFee,
                  createdAt: order.createdAt,
                  items: (order.items || []).map((i: any) => ({
                    customName: i.customName, product: i.product,
                    quantity: i.quantity, unitPrice: Number(i.unitPrice),
                  })),
                }} />
                <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-1">
                  {expandedId === order.id ? <ChevronUp size={16} style={{ color: 'var(--admin-muted2)' }} /> : <ChevronDown size={16} style={{ color: 'var(--admin-muted2)' }} />}
                </button>
              </div>

              {expandedId === order.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pb-4 border-t" style={{ borderColor: 'var(--admin-border2)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2 text-sm">
                      <p><span style={{ color: 'var(--admin-muted)' }}>Adresse: </span>{order.address || '-'}</p>
                      {order.latitude != null && order.longitude != null && <p><span style={{ color: 'var(--admin-muted)' }}>GPS: </span>{order.latitude.toFixed(5)}, {order.longitude.toFixed(5)}</p>}
                      {order.voiceOrderUrl && <audio controls src={order.voiceOrderUrl} className="mt-2 w-full" style={{ height: 36 }} />}
                      {order.items && (
                        <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--admin-surface2)' }}>
                          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--admin-muted)' }}>{t('order.items')}:</p>
                          {order.items.map((item: any, i: number) => {
                            const img = item.product?.imageUrl || null;
                            const name = item.customName || item.product?.name || item.name || 'Produit';
                            return (
                              <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i < order.items!.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                {img ? (
                                  <img src={img} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" style={{ background: 'var(--admin-bg)' }} />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #d4b96a20, #9c7a3f20)', color: 'var(--admin-gold)' }}>{name.charAt(0)}</div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{name}</p>
                                  <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>× {item.quantity} — {Number(item.unitPrice || 0) * item.quantity} DA</p>
                                  {item.costPrice != null && Number(item.costPrice) > 0 && (
                                    <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>
                                      Achat {(Number(item.costPrice) * item.quantity).toLocaleString('fr-FR')} DA · Profit{' '}
                                      <span style={{ color: '#4ade80' }}>+{((Number(item.unitPrice || 0) - Number(item.costPrice)) * item.quantity).toLocaleString('fr-FR')} DA</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {order.items && order.items.length > 0 && (() => {
                        const itemCost = order.items.reduce((s: number, i: any) => s + (Number(i.costPrice) || 0) * i.quantity, 0);
                        const itemSell = order.items.reduce((s: number, i: any) => s + (Number(i.unitPrice) || 0) * i.quantity, 0);
                        const profit = itemSell - itemCost;
                        return (
                          <div className="mt-2 p-3 rounded-xl" style={{ background: 'var(--admin-surface2)' }}>
                            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--admin-muted)' }}>Coûts & marge</p>
                            <div className="flex justify-between text-[11px]"><span style={{ color: 'var(--admin-muted)' }}>Achat (coût)</span><span>{itemCost.toLocaleString('fr-FR')} DA</span></div>
                            <div className="flex justify-between text-[11px]"><span style={{ color: 'var(--admin-muted)' }}>Vente</span><span>{itemSell.toLocaleString('fr-FR')} DA</span></div>
                            <div className="flex justify-between text-xs font-bold mt-1" style={{ borderTop: '1px solid var(--admin-border2)', paddingTop: 6 }}>
                              <span style={{ color: 'var(--admin-gold)' }}>Marge (hors livraison)</span>
                              <span style={{ color: profit >= 0 ? '#4ade80' : 'var(--admin-danger)' }}>{profit >= 0 ? '+' : ''}{profit.toLocaleString('fr-FR')} DA</span>
                            </div>
                          </div>
                        );
                      })()}
                      {/* Delivery fee section */}
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(191,162,78,0.04)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--admin-gold)' }}>Livraison</p>
                        {(() => {
                          const suggested = getSuggestedFee(order);
                          const isPending = order.status === 'PENDING';
                          const currentFee = customFeeInput ?? suggested?.fee ?? order.deliveryFee;
                          return (
                            <>
                              {suggested ? (
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between"><span style={{ color: 'var(--admin-muted)' }}>Distance:</span><span>{suggested.distance.toFixed(1)} km</span></div>
                                  <div className="flex justify-between"><span style={{ color: 'var(--admin-muted)' }}>Suggéré:</span><span style={{ color: 'var(--admin-gold)' }}>{suggested.fee} DA</span></div>
                                </div>
                              ) : (
                                <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>GPS non disponible — impossible de calculer la distance</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>Frais:</span>
                                {isPending ? (
                                  <input type="number" value={currentFee ?? ''} onChange={e => setCustomFeeInput(Number(e.target.value))}
                                    className="flex-1 px-2 py-1 rounded-lg text-xs outline-none" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border2)', color: 'var(--admin-text)', width: 90 }}
                                    placeholder="Frais" />
                                ) : (
                                  <span style={{ color: 'var(--admin-gold)', fontWeight: 700 }}>{order.deliveryFee != null ? `${order.deliveryFee} DA` : '—'}</span>
                                )}
                              </div>
                              {isPending && suggested && (
                                <button onClick={() => confirmWithFee(order.id, currentFee ?? suggested.fee)}
                                  className="mt-2 w-full px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5"
                                  style={{ background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', color: 'var(--admin-bg)' }}>
                                  <CheckCircle size={12} /> Confirmer avec {currentFee ?? suggested.fee} DA
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--admin-muted)' }}>{t('order.status')}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map(s => (
                          <button key={s} onClick={() => updateStatus(order.id, s)} className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: order.status === s ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)', color: order.status === s ? 'var(--admin-gold)' : 'var(--admin-muted2)' }}>
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => openChat(order.id)} className="mt-3 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-gold)' }}>
                        <MessageCircle size={13} /> {t('order.chat')}
                      </button>
                    </div>
                  </div>

                  {chatOrderId === order.id && (
                    <div className="mt-4 p-3 rounded-xl" style={{ background: 'var(--admin-bg)' }}>
                      <div className="space-y-2 mb-3 max-h-40 overflow-auto">
                        {messages.map((m: any) => (
                          <div key={m.id} className="p-2 rounded-lg text-xs" style={{ background: m.sender === 'admin' ? 'var(--admin-border2)' : 'var(--admin-surface2)', textAlign: m.sender === 'admin' ? 'right' : 'left' }}>
                            {m.text}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Message..." className="input-field flex-1" style={{ padding: '6px 12px', fontSize: 12 }} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                        <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="gold-btn w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
      <ContextMenu items={ctxOrder ? getOrderMenuItems(ctxOrder) : []} position={orderMenu} onClose={closeOrderCtx} />
    </div>
  );
}
