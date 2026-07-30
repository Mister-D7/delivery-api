import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Search, MessageCircle, Send, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useOrderSSE } from '../hooks/useOrderSSE';
import OrderStatusBadge, { OrderProgress } from '../components/OrderStatusBadge';
import PrintReceipt, { DownloadPdfButton } from '../components/PrintReceipt';
import { useTranslation } from 'react-i18next';

type Order = {
  id: string; secureToken: string; status: string; total: number; deliveryFee?: number;
  customerName?: string; phone?: string; address?: string;
  items?: any[]; createdAt: string;
};

type Message = { id: string; text: string; sender: string; createdAt: string };

export default function OrderTracking() {
  const { t } = useTranslation('order-tracking');
  const { token: urlToken } = useParams();
  const navigate = useNavigate();
  const { customer, token: customerToken } = useCustomerAuth();
  const [token, setToken] = useState(urlToken || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);

  const handleStatusChange = useCallback((status: string) => {
    setOrder(prev => prev ? { ...prev, status } : prev);
    const statusLabels: Record<string, string> = { PENDING: 'En attente', CONFIRMED: 'Confirmee', PREPARING: 'En preparation', ON_THE_WAY: 'En route', DELIVERED: 'Livree', CANCELLED: 'Annulee' };
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MISTER-DR', { body: `Votre commande est: ${statusLabels[status] || status}` });
    }
  }, []);

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
        // Only save token if user owns the order (customerName present = privacy not stripped)
        if (res.data.customerName) {
          localStorage.setItem('delivery_track_token', clean);
        } else {
          localStorage.removeItem('delivery_track_token');
        }
        try {
          const msgRes = await api.get(`/orders/token/${res.data.secureToken}/messages`);
          setMessages(msgRes.data || []);
        } catch {}
      } else {
        setError(t('search.placeholder'));
      }
    } catch { setError(t('search.placeholder')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (urlToken) {
      const clean = urlToken.replace(/^#/, '');
      setToken(clean);
      searchByToken(clean);
    } else {
      const saved = localStorage.getItem('delivery_track_token');
      if (saved) {
        // Only auto-load if a customer is logged in (might own the order)
        // Otherwise let the user search manually
        if (customer) {
          setToken(saved);
          searchByToken(saved);
        } else {
          localStorage.removeItem('delivery_track_token');
        }
      }
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
    navigate('/track', { replace: true });
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0a0a0a' }}>
      <div className="max-w-lg mx-auto">
        {!order ? (
          <div className="text-center">
            <Package size={48} className="mx-auto mb-6" style={{ color: '#333' }} />
            <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('title')}</h1>
            <p className="text-sm mb-8" style={{ color: '#8c8578' }}>{t('search.placeholder')}</p>

            {/* Show my orders if logged in */}
            {customer && myOrders.length > 0 && !loadingMyOrders && (
              <div className="mb-8 text-left">
                <p className="text-xs font-bold tracking-wide mb-3" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>{t('messages')}</p>
                <div className="space-y-2">
                  {myOrders.map(o => (
                    <button key={o.id} onClick={() => navigate(`/track/${o.secureToken}`)} className="w-full surface-card p-4 flex items-center gap-3 text-left hover:opacity-90 transition-opacity">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">#{(o.id || '').slice(0, 8)}</span>
                          <OrderStatusBadge status={o.status} />
                        </div>
                        <p className="text-[11px]" style={{ color: '#8c8578' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {o.items && o.items.length > 0 && (
                          <p className="text-[10px] mt-1 truncate" style={{ color: '#555' }}>
                            {o.items.slice(0, 3).map((i: any) => i.customName || i.product?.name || i.name || 'Produit').join(', ')}{o.items.length > 3 ? ` +${o.items.length - 3}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: '#bfa24e' }}>{o.total} DA</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(191,162,78,0.12)' }} />
                  <span className="text-xs" style={{ color: '#555' }}>ou chercher par token</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(191,162,78,0.12)' }} />
                </div>
              </div>
            )}

            {customer && !order && loadingMyOrders && (
              <div className="mb-8 text-left">
                <p className="text-xs font-bold tracking-wide mb-3" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>{t('messages')}</p>
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="surface-card h-16 animate-pulse" style={{ background: '#1a1a1a' }} />)}</div>
              </div>
            )}

            {customer && !order && !loadingMyOrders && myOrders.length === 0 && (
              <div className="mb-8">
                <p className="text-xs font-bold tracking-wide mb-3" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>{t('messages')}</p>
                <div className="surface-card p-6 text-center">
                  <Package size={28} className="mx-auto mb-3" style={{ color: '#333' }} />
                  <p className="text-sm" style={{ color: '#8c8578' }}>{t('status.pending')}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input value={token} onChange={e => setToken(e.target.value)} placeholder={t('search.placeholder')} className="input-field flex-1" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <button onClick={handleSearch} disabled={loading} className="gold-btn px-5 py-2.5 text-sm flex items-center gap-2">
                <Search size={14} /> {loading ? '...' : t('search.button')}
              </button>
            </div>
            {error && <p className="text-sm mt-4 p-3 rounded-xl" style={{ background: 'rgba(217,96,59,0.1)', color: '#d9603b' }}>{error}</p>}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {customer && (
              <button onClick={backToMyOrders} className="flex items-center gap-2 text-xs font-semibold mb-4 px-3 py-2 rounded-xl" style={{ color: '#bfa24e', background: 'rgba(191,162,78,0.08)' }}>
                <ArrowLeft size={14} /> {t('messages')}
              </button>
            )}
            <p className="text-xs tracking-[0.25em] font-semibold mb-2" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>{t('timeline')}</p>
            <h1 className="text-xl font-extrabold mb-1" style={{ fontFamily: "'Unbounded', sans-serif" }}>Commande #{(order.id || '').slice(0, 8)}</h1>
            <p className="text-xs mb-6" style={{ color: '#8c8578' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>

            <div className="surface-card p-5 mb-4">
              <OrderProgress status={order.status} />
            </div>

            <div className="surface-card p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-wide" style={{ color: '#8c8578' }}>{t('timeline')}</p>
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
                <div className="flex justify-between"><span style={{ color: '#8c8578' }}>Nom</span><span>{order.customerName || '-'}</span></div>
                <div className="flex justify-between"><span style={{ color: '#8c8578' }}>Téléphone</span><span>{order.phone || '-'}</span></div>
                {order.address && <div className="flex justify-between"><span style={{ color: '#8c8578' }}>Adresse</span><span className="text-right max-w-[60%]">{order.address}</span></div>}
                <div className="flex justify-between"><span style={{ color: '#8c8578' }}>Livraison</span>
                  <span>{order.deliveryFee != null ? (order.deliveryFee === 0 ? 'Gratuite' : `${order.deliveryFee} DA`) : '—'}
                    {order.status === 'PENDING' && order.deliveryFee != null && order.deliveryFee > 0 && <span className="text-[9px] ml-1 px-1 py-0.5 rounded" style={{ background: 'rgba(191,162,78,0.12)', color: '#8c8578' }}>estimation</span>}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2" style={{ borderTop: '1px solid rgba(191,162,78,0.12)' }}>
                  <span>Total</span><span style={{ color: '#bfa24e' }}>{order.total + (order.deliveryFee || 0)} DA</span>
                </div>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="surface-card p-5 mb-4">
                <p className="text-xs font-bold tracking-wide mb-3" style={{ color: '#8c8578' }}>Produits</p>
                <div className="space-y-2">
                  {order.items.map((item: any, i: number) => {
                    const img = item.product?.imageUrl || item.imageUrl || null;
                    const name = item.customName || item.product?.name || item.name || 'Produit';
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        {img ? (
                          <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ background: '#0e0e0e' }} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #d4b96a20, #9c7a3f20)', color: '#bfa24e' }}>{name.charAt(0)}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name}</p>
                          <p className="text-xs" style={{ color: '#8c8578' }}>× {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold flex-shrink-0" style={{ color: '#bfa24e' }}>{Number(item.unitPrice || 0) * item.quantity} DA</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat */}
            <div className="surface-card p-5">
              <p className="text-xs font-bold tracking-wide mb-3 flex items-center gap-1.5" style={{ color: '#8c8578' }}>
                <MessageCircle size={13} /> {t('messages')}
              </p>
              <div className="space-y-2 mb-3 max-h-48 overflow-auto">
                {messages.length === 0 && <p className="text-xs text-center py-4" style={{ color: '#555' }}>{t('messages')}</p>}
                {messages.map(m => (
                  <div key={m.id} className="p-3 rounded-xl text-sm" style={{ background: m.sender === 'customer' ? 'rgba(191,162,78,0.08)' : '#1a1a1a', textAlign: m.sender === 'customer' ? 'right' : 'left' }}>
                    {m.text && <p>{m.text}</p>}
                    {m.audioUrl && <audio controls src={m.audioUrl} className="mt-1 w-full" style={{ height: 32, maxWidth: 250 }} />}
                    {m.imageUrl && <img src={m.imageUrl} alt="" className="mt-1 rounded-lg max-w-[200px] object-cover" />}
                    <p className="text-[10px] mt-1" style={{ color: '#555' }}>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
                ))}
              </div>
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
