import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Search, MessageCircle, Send, ArrowLeft, Copy, X, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useCustomerTheme } from '../context/CustomerThemeContext';
import { useOrderSSE } from '../hooks/useOrderSSE';
import OrderStatusBadge, { OrderProgress } from '../components/OrderStatusBadge';
import PrintReceipt, { DownloadPdfButton } from '../components/PrintReceipt';
import { useTranslation } from 'react-i18next';

type Order = {
  id: string; secureToken: string; status: string; total: number; deliveryFee?: number;
  customerName?: string; phone?: string; address?: string;
  items?: any[]; createdAt: string;
};

type Message = { id: string; text: string; sender: string; createdAt: string; audioUrl?: string; imageUrl?: string };

type HistoryEntry = {
  token: string;
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items?: string;
};

const HISTORY_KEY = 'delivery_track_history';

function loadHistory(): HistoryEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function persistHistory(list: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {}
}

function notifyViaServiceWorker(title: string, body: string) {
  const payload = { type: 'ORDER_STATUS', title, body };
  try {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage(payload);
    } else {
      navigator.serviceWorker?.ready.then(reg => reg.active?.postMessage(payload));
    }
  } catch {}
}

function notifyStatus(title: string, body: string) {
  notifyViaServiceWorker(title, body);
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body }); } catch {}
  }
}

export default function OrderTracking() {
  const { t } = useTranslation('order-tracking');
  const { token: urlToken } = useParams();
  const navigate = useNavigate();
  const { customer, token: customerToken } = useCustomerAuth();
  const { brand } = useCustomerTheme();
  const [token, setToken] = useState(urlToken || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const orderTokenRef = useRef<string | null>(null);
  useEffect(() => { orderTokenRef.current = order?.secureToken || null; }, [order?.secureToken]);

  const handleStatusChange = useCallback((status: string) => {
    setOrder(prev => prev ? { ...prev, status } : prev);
    const statusLabels: Record<string, string> = { PENDING: t('status.pending'), CONFIRMED: t('status.confirmed'), PREPARING: t('status.preparing'), ON_THE_WAY: t('status.out_for_delivery'), DELIVERED: t('status.delivered'), CANCELLED: t('status.cancelled') };
    const label = statusLabels[status] || status;
    setStatusNotice(label);
    toast(`${brand.name} — ${label}`, { duration: 4000, id: 'order-status-toast' });
    notifyStatus(brand.name, `Votre commande est: ${label}`);
    const token = orderTokenRef.current;
    if (token) {
      api.get(`/orders/${token}`)
        .then(r => {
          if (r.data?.id) {
            setOrder(prev => prev && prev.id === r.data.id ? { ...prev, ...r.data } : prev);
            setHistory(prev => {
              const updated = prev.map(h => h.token === token && r.data ? { ...h, status: r.data.status, total: r.data.total } : h);
              persistHistory(updated);
              return updated;
            });
          }
        })
        .catch(() => {});
    }
  }, [brand]);

  const handleNewMessage = useCallback((msg: any) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  useOrderSSE(order?.id || null, order?.secureToken || null, handleStatusChange, handleNewMessage);

  const fetchMyOrders = useCallback(() => {
    if (customer && customerToken) {
      setLoadingMyOrders(true);
      api.get('/auth/my-orders')
        .then(r => setMyOrders(r.data || []))
        .catch(() => {})
        .finally(() => setLoadingMyOrders(false));
    }
  }, [customer, customerToken]);

  useEffect(() => { fetchMyOrders(); }, [fetchMyOrders]);

  useEffect(() => {
    if (order || customer || history.length === 0) return;
    let active = true;
    Promise.all(history.map(h => api.get(`/orders/${h.token}`).then(r => r.data).catch(() => null)))
      .then(results => {
        if (!active) return;
        setHistory(prev => {
          const updated = prev.map(h => {
            const fresh = results.find((r: any) => r && r.id === h.id);
            return fresh ? { ...h, status: fresh.status, total: fresh.total, createdAt: fresh.createdAt } : h;
          });
          persistHistory(updated);
          return updated;
        });
      });
    return () => { active = false; };
  }, [order, customer, history.length]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const searchByToken = useCallback(async (searchToken: string) => {
    const clean = searchToken.trim().replace(/^#/, '');
    if (!clean) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setMessages([]);
    try {
      const res = await api.get(`/orders/${clean}`);
      if (res.data && res.data.id) {
        setOrder(res.data);
        setStatusNotice(null);
        const entry: HistoryEntry = {
          token: clean,
          id: res.data.id,
          status: res.data.status,
          total: res.data.total,
          createdAt: res.data.createdAt,
          items: (res.data.items || []).slice(0, 3).map((i: any) => i.customName || i.product?.name || i.name || 'Produit').join(', '),
        };
        setHistory(prev => {
          const next = [entry, ...prev.filter(h => h.token !== clean)];
          persistHistory(next);
          return next;
        });
        try {
          const msgRes = await api.get(`/orders/token/${res.data.secureToken}/messages`);
          setMessages(msgRes.data || []);
        } catch {}
      } else {
        setError(t('search.placeholder'));
      }
    } catch (err: any) {
      setError(t('search.placeholder'));
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (urlToken) {
      const clean = urlToken.replace(/^#/, '');
      setToken(clean);
      searchByToken(clean);
    }
  }, [urlToken, searchByToken]);

  const handleSearch = () => {
    const clean = token.trim().replace(/^#/, '');
    setToken(clean);
    searchByToken(clean);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !order) return;
    setSending(true);
    try {
      await api.post(`/orders/token/${order.secureToken}/messages`, { text: newMsg.trim(), sender: 'customer' });
      setNewMsg('');
    } catch {}
    finally { setSending(false); }
  };

  const backToMyOrders = () => {
    setOrder(null);
    setMessages([]);
    setToken('');
    setStatusNotice(null);
    navigate('/track', { replace: true });
  };

  const clearTracking = () => {
    setOrder(null);
    setMessages([]);
    setToken('');
    setStatusNotice(null);
    navigate('/track', { replace: true });
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const copyCode = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(order?.secureToken || '');
      toast.success(t('copied'));
    } catch {
      toast.error(t('copy'));
    }
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--pt-bg)' }}>
      <div className="max-w-lg mx-auto">
        {!order ? (
          <div className="text-center">
            <Package size={48} className="mx-auto mb-6" style={{ color: 'var(--pt-icon-dim)' }} />
            <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: 'var(--pt-font)' }}>{t('title')}</h1>
            <p className="text-sm mb-8" style={{ color: 'var(--pt-muted)' }}>{t('search.placeholder')}</p>

            {/* Show my orders if logged in */}
            {customer && myOrders.length > 0 && !loadingMyOrders && (
              <div className="mb-8 text-left">
                <p className="text-xs font-bold tracking-wide mb-3" style={{ color: 'var(--pt-accent)', fontFamily: 'var(--pt-mono)' }}>{t('history')}</p>
                <div className="space-y-2">
                  {myOrders.map(o => (
                    <button key={o.id} onClick={() => navigate(`/track/${o.secureToken}`)} className="w-full surface-card p-4 flex items-center gap-3 text-left hover:opacity-90 transition-opacity">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">#{(o.id || '').slice(0, 8)}</span>
                          <OrderStatusBadge status={o.status} />
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--pt-muted)' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {o.items && o.items.length > 0 && (
                          <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--pt-muted2)' }}>
                            {o.items.slice(0, 3).map((i: any) => i.customName || i.product?.name || i.name || 'Produit').join(', ')}{o.items.length > 3 ? ` +${o.items.length - 3}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: 'var(--pt-accent)' }}>{o.total} DA</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'var(--pt-border-strong)' }} />
                  <span className="text-xs" style={{ color: 'var(--pt-muted2)' }}>ou chercher par token</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--pt-border-strong)' }} />
                </div>
              </div>
            )}

            {customer && !order && loadingMyOrders && (
              <div className="mb-8 text-left">
                <p className="text-xs font-bold tracking-wide mb-3" style={{ color: 'var(--pt-accent)', fontFamily: 'var(--pt-mono)' }}>{t('history')}</p>
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="surface-card h-16 animate-pulse" style={{ background: 'var(--pt-surface3)' }} />)}</div>
              </div>
            )}

            {customer && !order && !loadingMyOrders && myOrders.length === 0 && (
              <div className="mb-8">
                <p className="text-xs font-bold tracking-wide mb-3" style={{ color: 'var(--pt-accent)', fontFamily: 'var(--pt-mono)' }}>{t('history')}</p>
                <div className="surface-card p-6 text-center">
                  <Package size={28} className="mx-auto mb-3" style={{ color: 'var(--pt-icon-dim)' }} />
                  <p className="text-sm" style={{ color: 'var(--pt-muted)' }}>{t('status.pending')}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input value={token} onChange={e => setToken(e.target.value)} placeholder={t('search.placeholder')} className="input-field flex-1" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <button onClick={handleSearch} disabled={loading} className="gold-btn px-5 py-2.5 text-sm flex items-center gap-2">
                <Search size={14} /> {loading ? '...' : t('search.button')}
              </button>
            </div>
            {error && <p className="text-sm mt-4 p-3 rounded-xl" style={{ background: 'var(--pt-danger-soft)', color: 'var(--pt-danger)' }}>{error}</p>}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {statusNotice && (
              <div className="mb-4 flex items-center gap-3 p-3 rounded-xl surface-card" style={{ background: 'var(--pt-grad-soft)' }}>
                <Bell size={16} className="flex-shrink-0" style={{ color: 'var(--pt-accent)' }} />
                <p className="text-sm flex-1 min-w-0">
                  <span className="font-bold">{brand.name}</span> — Statut mis à jour : <span className="font-semibold">{statusNotice}</span>
                </p>
                <button onClick={() => setStatusNotice(null)} aria-label="Fermer" className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: 'var(--pt-muted)', background: 'var(--pt-border-faint)' }}>
                  <X size={13} />
                </button>
              </div>
            )}
            {customer && (
              <button onClick={backToMyOrders} className="flex items-center gap-2 text-xs font-semibold mb-4 px-3 py-2 rounded-xl" style={{ color: 'var(--pt-accent)', background: 'var(--pt-border-faint)' }}>
                <ArrowLeft size={14} /> {t('messages')}
              </button>
            )}
            <p className="text-xs tracking-[0.25em] font-semibold mb-2" style={{ color: 'var(--pt-accent)', fontFamily: 'var(--pt-mono)' }}>{t('timeline')}</p>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="text-xl font-extrabold" style={{ fontFamily: 'var(--pt-font)' }}>Commande #{(order.id || '').slice(0, 8)}</h1>
              <button onClick={clearTracking} aria-label="Fermer" title="Fermer" className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0" style={{ color: 'var(--pt-muted)', background: 'var(--pt-border-faint)' }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-xs mb-6" style={{ color: 'var(--pt-muted)' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>

            <div className="surface-card p-5 mb-4">
              <OrderProgress status={order.status} />
            </div>

            <div className="surface-card p-5 mb-4">
              <p className="text-xs font-bold tracking-wide mb-2" style={{ color: 'var(--pt-muted)' }}>{t('tracking_code')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 text-sm font-bold tracking-wide break-all" style={{ color: 'var(--pt-accent)', fontFamily: 'var(--pt-mono)' }}>{order.secureToken}</code>
                <button onClick={copyCode} className="gold-btn px-3 py-2 text-xs flex items-center gap-1.5 rounded-lg flex-shrink-0">
                  <Copy size={13} /> {t('copy')}
                </button>
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--pt-muted2)' }}>{t('tracking_code_hint')}</p>
            </div>

            <div className="surface-card p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-wide" style={{ color: 'var(--pt-muted)' }}>{t('timeline')}</p>
                <div className="flex items-center gap-1">
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
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: 'var(--pt-muted)' }}>Nom</span><span>{order.customerName || '-'}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--pt-muted)' }}>Téléphone</span><span>{order.phone || '-'}</span></div>
                {order.address && <div className="flex justify-between"><span style={{ color: 'var(--pt-muted)' }}>Adresse</span><span className="text-right max-w-[60%]">{order.address}</span></div>}
                <div className="flex justify-between"><span style={{ color: 'var(--pt-muted)' }}>Livraison</span>
                  <span>{order.deliveryFee != null ? (order.deliveryFee === 0 ? 'Gratuite' : `${order.deliveryFee} DA`) : '—'}
                    {order.status === 'PENDING' && order.deliveryFee != null && order.deliveryFee > 0 && <span className="text-[9px] ml-1 px-1 py-0.5 rounded" style={{ background: 'var(--pt-border-strong)', color: 'var(--pt-muted)' }}>estimation</span>}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2" style={{ borderTop: '1px solid var(--pt-border-strong)' }}>
                  <span>Total</span><span style={{ color: 'var(--pt-accent)' }}>{order.total + (order.deliveryFee || 0)} DA</span>
                </div>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="surface-card p-5 mb-4">
                <p className="text-xs font-bold tracking-wide mb-3" style={{ color: 'var(--pt-muted)' }}>Produits</p>
                <div className="space-y-2">
                  {order.items.map((item: any, i: number) => {
                    const img = item.product?.imageUrl || item.imageUrl || null;
                    const name = item.customName || item.product?.name || item.name || 'Produit';
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: i % 2 === 0 ? 'transparent' : 'var(--pt-row-alt)' }}>
                        {img ? (
                          <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ background: 'var(--pt-surface2)' }} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: 'var(--pt-grad-soft)', color: 'var(--pt-accent)' }}>{name.charAt(0)}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name}</p>
                          <p className="text-xs" style={{ color: 'var(--pt-muted)' }}>× {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--pt-accent)' }}>{Number(item.unitPrice || 0) * item.quantity} DA</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat */}
            <div className="surface-card p-5">
              <p className="text-xs font-bold tracking-wide mb-3 flex items-center gap-1.5" style={{ color: 'var(--pt-muted)' }}>
                <MessageCircle size={13} /> {t('messages')}
              </p>
              <div className="space-y-2 mb-3 max-h-48 overflow-auto">
                {messages.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--pt-muted2)' }}>{t('messages')}</p>}
                {messages.map(m => (
                  <div key={m.id} className="p-3 rounded-xl text-sm" style={{ background: m.sender === 'customer' ? 'var(--pt-border-faint)' : 'var(--pt-surface3)', textAlign: m.sender === 'customer' ? 'right' : 'left' }}>
                    {m.text && <p>{m.text}</p>}
                    {m.audioUrl && <audio controls src={m.audioUrl} className="mt-1 w-full" style={{ height: 32, maxWidth: 250 }} />}
                    {m.imageUrl && <img src={m.imageUrl} alt="" className="mt-1 rounded-lg max-w-[200px] object-cover" />}
                    <p className="text-[10px] mt-1" style={{ color: 'var(--pt-muted2)' }}>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
                ))}
              </div>
            {!customer && history.length > 0 && (
              <div className="mb-8 text-left">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold tracking-wide" style={{ color: 'var(--pt-accent)', fontFamily: 'var(--pt-mono)' }}>{t('history')}</p>
                  <button onClick={clearHistory} className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ color: 'var(--pt-muted)', background: 'var(--pt-border-faint)' }}>
                    {t('history_clear')}
                  </button>
                </div>
                <div className="space-y-2">
                  {history.map(h => (
                    <button key={h.token} onClick={() => navigate(`/track/${h.token}`)} className="w-full surface-card p-4 flex items-center gap-3 text-left hover:opacity-90 transition-opacity">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">#{(h.id || h.token).slice(0, 8)}</span>
                          <OrderStatusBadge status={h.status} />
                        </div>
                        <p className="text-[11px]" style={{ color: 'var(--pt-muted)' }}>{h.createdAt ? new Date(h.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : h.token}</p>
                        {h.items && <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--pt-muted2)' }}>{h.items}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: 'var(--pt-accent)' }}>{h.total} DA</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder={t('chat_placeholder')} className="input-field flex-1" onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="gold-btn w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
