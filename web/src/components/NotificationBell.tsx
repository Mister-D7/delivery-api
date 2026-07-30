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
  ON_THE_WAY: '#3b82f6', DELIVERED: 'var(--admin-success)', CANCELLED: 'var(--admin-danger)',
};

const DISMISSED_KEY = 'delivery_notifications_dismissed';
const LAST_SEEN_KEY = 'delivery_notifications_last_seen';
const KNOWN_IDS_KEY = 'delivery_known_order_ids';

let _syncing = false;
async function syncDismissedToServer(ids: string[]) {
  if (_syncing) return;
  _syncing = true;
  try { await api.post('/dismissed', { ids }); } catch {}
  finally { _syncing = false; }
}

async function loadDismissedFromServer(): Promise<string[]> {
  try { const r = await api.get('/dismissed'); return Array.isArray(r.data) ? r.data : []; } catch { return []; }
}

function loadDismissed(): string[] {
  try {
    const ls = localStorage.getItem(DISMISSED_KEY);
    if (ls) return JSON.parse(ls);
    const ck = document.cookie.split('; ').find(r => r.startsWith(DISMISSED_KEY + '='));
    if (ck) {
      const val = decodeURIComponent(ck.split('=')[1]);
      const parsed = JSON.parse(val);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch {}
  return [];
}

function saveDismissed(ids: string[]) {
  const data = JSON.stringify(ids.slice(-100));
  localStorage.setItem(DISMISSED_KEY, data);
  try { document.cookie = `${DISMISSED_KEY}=${encodeURIComponent(data)};path=/;max-age=2592000`; } catch {}
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "a l'instant";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}

function playNewOrderSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch {}
}

function showWinNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, tag: 'delivery-new-order' });
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dismissedRef = useRef<string[]>(loadDismissed());
  const [dismissedTick, setDismissedTick] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const prevOrderCountRef = useRef(0);

  const dismissed = dismissedRef.current;
  const visibleOrders = orders.filter(o => !dismissed.includes(o.id));

  const fetchOrders = useCallback(async () => {
    try {
      dismissedRef.current = loadDismissed();
      const token = localStorage.getItem('delivery_token');
      if (!token) { setOrders([]); return; }
      const [r, serverDismissed] = await Promise.all([
        api.get('/orders?limit=30'),
        loadDismissedFromServer(),
      ]);
      if (serverDismissed.length > 0) {
        const merged = [...new Set([...dismissedRef.current, ...serverDismissed])];
        dismissedRef.current = merged;
        saveDismissed(merged);
      }
      const list = r.data?.orders || [];
      setOrders(list);

      const currentIds = list.map((o: Order) => o.id);
      const prevKnown = knownIdsRef.current;

      if (prevKnown.size > 0) {
        const newOrders = list.filter((o: Order) => !prevKnown.has(o.id));
        if (newOrders.length > 0) {
          playNewOrderSound();
          showWinNotification(
            `Nouvelle commande! ${newOrders[0].customerName || ''}`,
            `${newOrders[0].total} DA - ${newOrders[0].items?.length || 0} article(s)`
          );
        }
      }
      knownIdsRef.current = new Set(currentIds);

      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
      const unread = list.filter((o: Order) =>
        new Date(o.createdAt).getTime() > lastSeenTime &&
        o.status === 'PENDING' &&
        !dismissedRef.current.includes(o.id)
      ).length;
      setUnreadCount(unread);
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [fetchOrders]);

  useEffect(() => {
    const adminToken = localStorage.getItem('delivery_token') || '';
    if (!adminToken) return;
    const url = `${apiBaseURL}/events/admin?token=${encodeURIComponent(adminToken)}`;
    const es = new EventSource(url);
    es.addEventListener('new_order', () => { fetchOrders(); });
    es.addEventListener('status_changed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status, updatedAt: data.updatedAt } : o));
      } catch {}
    });
    es.onerror = () => {};
    return () => { es.close(); };
  }, [fetchOrders]);

  useEffect(() => {
    const iv = setInterval(fetchOrders, 20000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  const markSeen = () => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setUnreadCount(0);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) { markSeen(); fetchOrders(); }
    else { setChatOrderId(null); setMessages([]); }
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
    dismissedRef.current = [...dismissedRef.current, id];
    saveDismissed(dismissedRef.current);
    syncDismissedToServer(dismissedRef.current);
    setDismissedTick(t => t + 1);
    if (expandedId === id) setExpandedId(null);
    if (chatOrderId === id) { setChatOrderId(null); setMessages([]); }
  };

  const dismissAll = () => {
    const ids = orders.map(o => o.id);
    dismissedRef.current = [...new Set([...dismissedRef.current, ...ids])];
    saveDismissed(dismissedRef.current);
    syncDismissedToServer(dismissedRef.current);
    setDismissedTick(t => t + 1);
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
      <button onClick={toggle} className="relative p-1.5 rounded-lg transition-colors" style={{ color: open ? 'var(--admin-gold)' : 'var(--admin-muted)' }} title="Notifications">
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse" style={{ background: 'var(--admin-danger)', color: '#fff' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setOpen(false)} />
        )}
        {open && (
          <motion.div key="panel" ref={panelRef} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 border-l"
            style={{ width: 440, maxWidth: '92vw', background: 'var(--admin-bg)', borderColor: 'var(--admin-gold-bg)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border3)' }}>
                <div className="flex items-center gap-2">
                  <Bell size={16} style={{ color: 'var(--admin-gold)' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--admin-gold)' }}>Notifications</p>
                  {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(217,96,59,0.15)', color: 'var(--admin-danger)' }}>{unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}</span>}
                </div>
                <div className="flex items-center gap-1">
                  {visibleOrders.length > 0 && (
                    <button onClick={dismissAll} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold" style={{ color: 'var(--admin-muted)' }} title="Tout marquer comme lu">
                      <CheckCheck size={12} /> Tout lu
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1 rounded-lg" style={{ color: 'var(--admin-muted2)' }}><X size={16} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, height: 'calc(100vh - 88px)' }}>
                {visibleOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                    <Package size={32} style={{ color: 'var(--admin-surface3)' }} />
                    <p className="text-xs mt-3" style={{ color: 'var(--admin-muted2)' }}>{orders.length === 0 ? 'Aucune commande pour le moment' : 'Toutes les notifications lues'}</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1.5">
                    {visibleOrders.map(order => {
                      const isExpanded = expandedId === order.id;
                      const isPending = order.status === 'PENDING';
                      return (
                        <div key={order.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-warning-bg)' }}>
                          <div className="flex items-center gap-2.5 px-3 py-2.5">
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-bold" style={{ color: 'var(--admin-gold)' }}>#{order.secureToken || order.id.slice(0, 8)}</span>
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[order.status] || 'var(--admin-muted2)'}20`, color: STATUS_COLORS[order.status] || 'var(--admin-muted)' }}>
                                  {order.status.replace('_', ' ')}
                                </span>
                                {isPending && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ff9800' }} />}
                              </div>
                              <p className="text-[11px] truncate" style={{ color: 'var(--admin-muted)' }}>{order.customerName || 'Client'} · {order.phone}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold" style={{ color: 'var(--admin-gold)' }}>{order.total?.toLocaleString()} DA</p>
                              <p className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>{timeAgo(order.createdAt)}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); dismissOrder(order.id); }} className="p-1 flex-shrink-0 rounded-lg transition-colors" style={{ color: 'var(--admin-muted2)' }} title="Supprimer">
                              <Minus size={14} />
                            </button>
                            <button onClick={() => setExpandedId(isExpanded ? null : order.id)} className="p-1 flex-shrink-0">
                              {isExpanded ? <ChevronUp size={12} style={{ color: 'var(--admin-muted2)' }} /> : <ChevronDown size={12} style={{ color: 'var(--admin-muted2)' }} />}
                            </button>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid rgba(191,162,78,0.06)' }}>
                                  <div className="pt-2 space-y-1">
                                    <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}><span style={{ color: 'var(--admin-muted2)' }}>Adresse:</span> {order.address || '-'}</p>
                                    {order.voiceOrderUrl && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <Volume2 size={11} style={{ color: 'var(--admin-gold)' }} />
                                        <audio controls src={order.voiceOrderUrl} className="flex-1" style={{ height: 28 }} />
                                      </div>
                                    )}
                                    {order.items && order.items.length > 0 && (
                                      <div className="mt-1.5 p-2 rounded-lg" style={{ background: 'var(--admin-bg)' }}>
                                        {order.items.map((item: any, i: number) => (
                                          <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: i < order.items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                            <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-bold" style={{ background: 'var(--admin-border3)', color: 'var(--admin-gold)' }}>
                                              {item.quantity}x
                                            </div>
                                            <p className="text-[10px] flex-1 truncate" style={{ color: 'var(--admin-muted)' }}>{item.customName || item.name || 'Produit'}</p>
                                            <p className="text-[10px] font-semibold" style={{ color: 'var(--admin-gold)' }}>{Number(item.unitPrice || 0) * item.quantity} DA</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-1">
                                    {['CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'].map(s => (
                                      <button key={s} onClick={async () => { await api.patch(`/orders/${order.id}/status`, { status: s }); setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: s } : o)); }}
                                        className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: order.status === s ? `${STATUS_COLORS[s]}20` : 'var(--admin-surface2)', color: order.status === s ? STATUS_COLORS[s] : 'var(--admin-muted2)' }}>
                                        {s.replace('_', ' ')}
                                      </button>
                                    ))}
                                  </div>

                                  <button onClick={() => openChat(order.id)} className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg w-full" style={{ background: chatOrderId === order.id ? 'var(--admin-border3)' : 'var(--admin-surface2)', color: 'var(--admin-gold)' }}>
                                    <MessageCircle size={11} />
                                    {chatOrderId === order.id ? 'Fermer le chat' : 'Repondre au client'}
                                  </button>

                                  {chatOrderId === order.id && (
                                    <div className="rounded-lg p-2 space-y-1.5" style={{ background: 'var(--admin-bg)' }}>
                                      <div className="max-h-32 overflow-y-auto space-y-1">
                                        {messages.length === 0 && <p className="text-[9px] text-center py-2" style={{ color: 'var(--admin-muted2)' }}>Aucun message</p>}
                                        {messages.map((m: any) => (
                                          <div key={m.id} className="px-2 py-1.5 rounded-lg text-[10px]" style={{ background: m.sender === 'admin' ? 'var(--admin-border2)' : 'var(--admin-surface2)', textAlign: m.sender === 'admin' ? 'right' : 'left', color: 'var(--admin-muted)' }}>
                                            {m.text}
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex gap-1.5">
                                        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Repondre..."
                                          className="flex-1 px-2 py-1 rounded-lg text-[10px] outline-none" style={{ background: 'var(--admin-surface2)', border: '1px solid var(--admin-border3)', color: 'var(--admin-text)' }}
                                          onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                                        <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--admin-gold)', color: 'var(--admin-bg)' }}>
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

              <div className="px-4 py-2 flex-shrink-0" style={{ borderTop: '1px solid var(--admin-border2)' }}>
                <a href="/admin" className="text-[10px] font-semibold text-center block py-1 no-underline" style={{ color: 'var(--admin-gold)' }}>
                  Voir toutes les commandes
                </a>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
