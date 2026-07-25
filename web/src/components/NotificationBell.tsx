import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Send, MessageCircle, Package, ChevronDown, ChevronUp, Volume2, Minus, CheckCheck } from 'lucide-react';
import api, { apiBaseURL } from '../services/api';

type Order = {
  id: string; secureToken: string; status: string; total: number; deliveryFee?: number;
  customerName?: string; phone?: string; address?: string; voiceOrderUrl?: string;
  items?: any[]; createdAt: string; updatedAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#ff9800', CONFIRMED: '#2196f3', PREPARING: '#a855f7',
  ON_THE_WAY: '#3b82f6', DELIVERED: '#4ade80', CANCELLED: '#d9603b',
};

const DISMISSED_KEY = 'delivery_notifications_dismissed';

function loadDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); } catch { return []; }
}

function saveDismissed(ids: string[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}

const LAST_SEEN_KEY = 'delivery_notifications_last_seen';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const visibleOrders = orders.filter(o => !dismissed.includes(o.id));

  const fetchOrders = useCallback(async () => {
    try {
      const r = await api.get('/orders?limit=20');
      const list = r.data.orders || [];
      setOrders(list);

      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
      const unread = list.filter(o => new Date(o.createdAt).getTime() > lastSeenTime && o.status === 'PENDING' && !dismissed.includes(o.id)).length;
      setUnreadCount(unread);
    } catch {}
  }, [dismissed]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const adminToken = localStorage.getItem('delivery_token') || '';
    if (!adminToken) return;
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

  useEffect(() => {
    const iv = setInterval(fetchOrders, 30000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  const markSeen = () => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setUnreadCount(0);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) markSeen();
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dismissOrder = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    saveDismissed(next);
    if (expandedId === id) setExpandedId(null);
    if (chatOrderId === id) { setChatOrderId(null); setMessages([]); }
  };

  const dismissAll = () => {
    const ids = orders.map(o => o.id);
    const next = [...new Set([...dismissed, ...ids])];
    setDismissed(next);
    saveDismissed(next);
    setExpandedId(null);
    setChatOrderId(null);
    setMessages([]);
  };

  const openChat = async (orderId: string) => {
    if (chatOrderId === orderId) { setChatOrderId(null); return; }
    setChatOrderId(orderId);
    try { const r = await api.get(`/orders/${orderId}/messages`); setMessages(r.data || []); } catch { setMessages([]); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatOrderId) return;
    setSending(true);
    try {
      await api.post(`/orders/${chatOrderId}/messages`, { text: newMsg.trim(), sender: 'admin' });
      setNewMsg('');
      const r = await api.get(`/orders/${chatOrderId}/messages`);
      setMessages(r.data || []);
    } catch {}
    finally { setSending(false); }
  };

  return (
    <>
      <button onClick={toggle} className="relative p-1.5 rounded-lg transition-colors" style={{ color: open ? '#bfa24e' : '#8c8578' }} title="Notifications">
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: '#d9603b', color: '#fff' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setOpen(false)} />

            <motion.div ref={panelRef} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 flex flex-col border-l overflow-hidden"
              style={{ width: 380, maxWidth: '90vw', background: '#0e0e0e', borderColor: 'rgba(191,162,78,0.12)' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(191,162,78,0.1)' }}>
                <div className="flex items-center gap-2">
                  <Bell size={16} style={{ color: '#bfa24e' }} />
                  <p className="text-sm font-bold" style={{ color: '#bfa24e' }}>Notifications</p>
                  {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(217,96,59,0.15)', color: '#d9603b' }}>{unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}</span>}
                </div>
                <div className="flex items-center gap-1">
                  {visibleOrders.length > 0 && (
                    <button onClick={dismissAll} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold" style={{ color: '#8c8578' }} title="Tout marquer comme lu">
                      <CheckCheck size={12} /> Tout lu
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1 rounded-lg" style={{ color: '#555' }}><X size={16} /></button>
                </div>
              </div>

              {/* Orders list */}
              <div className="flex-1 overflow-y-auto">
                {visibleOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                    <Package size={32} style={{ color: '#222' }} />
                    <p className="text-xs mt-3" style={{ color: '#555' }}>{orders.length === 0 ? 'Aucune commande pour le moment' : 'Toutes les notifications lues'}</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1.5">
                    {visibleOrders.map(order => {
                      const isExpanded = expandedId === order.id;
                      const isPending = order.status === 'PENDING';
                      return (
                        <div key={order.id} className="rounded-xl overflow-hidden" style={{ background: isPending ? 'rgba(255,152,0,0.04)' : '#141414', border: `1px solid ${isPending ? 'rgba(255,152,0,0.12)' : 'rgba(191,162,78,0.06)'}` }}>
                          <div className="flex items-center gap-2.5 px-3 py-2.5">
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-bold" style={{ color: '#bfa24e' }}>#{order.id.slice(0, 8)}</span>
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[order.status] || '#555'}20`, color: STATUS_COLORS[order.status] || '#8c8578' }}>
                                  {order.status.replace('_', ' ')}
                                </span>
                                {isPending && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff9800' }} />}
                              </div>
                              <p className="text-[11px] truncate" style={{ color: '#8c8578' }}>{order.customerName || 'Client'} · {order.phone}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold" style={{ color: '#bfa24e' }}>{order.total?.toLocaleString()} DA</p>
                              <p className="text-[9px]" style={{ color: '#555' }}>{timeAgo(order.createdAt)}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); dismissOrder(order.id); }} className="p-1 flex-shrink-0 rounded-lg transition-colors" style={{ color: '#555' }} title="Supprimer">
                              <Minus size={14} />
                            </button>
                            <button onClick={() => setExpandedId(isExpanded ? null : order.id)} className="p-1 flex-shrink-0">
                              {isExpanded ? <ChevronUp size={12} style={{ color: '#555' }} /> : <ChevronDown size={12} style={{ color: '#555' }} />}
                            </button>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid rgba(191,162,78,0.06)' }}>
                                  <div className="pt-2 space-y-1">
                                    <p className="text-[10px]" style={{ color: '#8c8578' }}><span style={{ color: '#555' }}>Adresse:</span> {order.address || '-'}</p>
                                    {order.voiceOrderUrl && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <Volume2 size={11} style={{ color: '#bfa24e' }} />
                                        <audio controls src={order.voiceOrderUrl} className="flex-1" style={{ height: 28 }} />
                                      </div>
                                    )}
                                    {order.items && order.items.length > 0 && (
                                      <div className="mt-1.5 p-2 rounded-lg" style={{ background: '#0a0a0a' }}>
                                        {order.items.map((item: any, i: number) => (
                                          <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: i < order.items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                            <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-bold" style={{ background: 'rgba(191,162,78,0.1)', color: '#bfa24e' }}>
                                              {item.quantity}×
                                            </div>
                                            <p className="text-[10px] flex-1 truncate" style={{ color: '#8c8578' }}>{item.customName || item.product?.name || 'Item'}</p>
                                            <p className="text-[10px] font-semibold" style={{ color: '#bfa24e' }}>{Number(item.unitPrice) * item.quantity} DA</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-1">
                                    {['CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'].map(s => (
                                      <button key={s} onClick={async () => { await api.patch(`/orders/${order.id}/status`, { status: s }); setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: s } : o)); }}
                                        className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: order.status === s ? `${STATUS_COLORS[s]}20` : '#1a1a1a', color: order.status === s ? STATUS_COLORS[s] : '#555' }}>
                                        {s.replace('_', ' ')}
                                      </button>
                                    ))}
                                  </div>

                                  <button onClick={() => openChat(order.id)} className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg w-full" style={{ background: chatOrderId === order.id ? 'rgba(191,162,78,0.1)' : '#1a1a1a', color: '#bfa24e' }}>
                                    <MessageCircle size={11} />
                                    {chatOrderId === order.id ? 'Fermer le chat' : 'Répondre au client'}
                                  </button>

                                  {chatOrderId === order.id && (
                                    <div className="rounded-lg p-2 space-y-1.5" style={{ background: '#0a0a0a' }}>
                                      <div className="max-h-32 overflow-y-auto space-y-1">
                                        {messages.length === 0 && <p className="text-[9px] text-center py-2" style={{ color: '#444' }}>Aucun message</p>}
                                        {messages.map((m: any) => (
                                          <div key={m.id} className="px-2 py-1.5 rounded-lg text-[10px]" style={{ background: m.sender === 'admin' ? 'rgba(191,162,78,0.08)' : '#1a1a1a', textAlign: m.sender === 'admin' ? 'right' : 'left', color: '#8c8578' }}>
                                            {m.text}
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex gap-1.5">
                                        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Répondre..."
                                          className="flex-1 px-2 py-1 rounded-lg text-[10px] outline-none" style={{ background: '#1a1a1a', border: '1px solid rgba(191,162,78,0.1)', color: '#f5f1e8' }}
                                          onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                                        <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#bfa24e', color: '#0a0a0a' }}>
                                          <Send size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-4 py-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(191,162,78,0.08)' }}>
                <a href="/admin" className="text-[10px] font-semibold text-center block py-1 no-underline" style={{ color: '#bfa24e' }}>
                  Voir toutes les commandes →
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
