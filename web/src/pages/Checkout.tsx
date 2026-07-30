import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import {
  X, Minus, Plus, MapPin, Mic, Square, Play, Pause, Trash2, Type,
  Send, ShoppingBag, ArrowRight, Truck, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import api from '../services/api';
import { getDeliveryPricing, calcDeliveryFee, DeliveryPricing } from '../services/deliveryPricing';
import { useTranslation } from 'react-i18next';
import { WILAYAS, getCommunesByWilaya, getWilayaByCode, getCommuneCoords } from '../data/algeria';

const goldIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#bfa24e;transform:rotate(-45deg);border:2px solid #0a0a0a;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function LocationPicker({ position, onPick }: { position: [number, number]; onPick: (pos: [number, number]) => void }) {
  useMapEvents({ click(e) { onPick([e.latlng.lat, e.latlng.lng]); } });
  return <Marker position={position} icon={goldIcon} />;
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 16);
  return null;
}

function DeliveryMap({ position: externalPos, onLocationChange }: { position?: [number, number]; onLocationChange: (pos: [number, number]) => void }) {
  const [position, setPosition] = useState<[number, number]>([36.7525, 3.042]);
  const [satellite, setSatellite] = useState(true);
  const [locating, setLocating] = useState(false);
  // Sync from external position (commune/wilaya selection)
  useEffect(() => {
    if (externalPos) setPosition(externalPos);
  }, [externalPos]);
  const locate = () => {
    if (!navigator.geolocation) return toast.error('Géolocalisation non disponible');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      res => { const p: [number, number] = [res.coords.latitude, res.coords.longitude]; setPosition(p); onLocationChange(p); setLocating(false); },
      () => { toast.error('Impossible de vous localiser'); setLocating(false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };
  const streetUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  return (
    <div className="rounded-xl overflow-hidden relative" style={{ border: '1px solid rgba(191,162,78,0.12)', height: 200 }}>
      <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer url={satellite ? satUrl : streetUrl} attribution={satellite ? '&copy; Google' : '&copy; OSM'} />
        {externalPos && <MapCenterUpdater center={externalPos} />}
        <LocationPicker position={position} onPick={p => { setPosition(p); onLocationChange(p); }} />
      </MapContainer>
      <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1.5">
        <button onClick={() => setSatellite(!satellite)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.7)', color: satellite ? '#4ade80' : '#bfa24e', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {satellite ? '🛰 Satellite' : '🗺 Plan'}
        </button>
        <button onClick={locate} disabled={locating} className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.7)', color: '#60a5fa', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {locating ? '📍...' : '📍 Me localiser'}
        </button>
      </div>
    </div>
  );
}

function VoiceRecorder({ onVoiceReady }: { onVoiceReady: (blob: Blob | null) => void }) {
  const { t } = useTranslation('checkout');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        onVoiceReady(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch { toast.error(t('form.voice_note')); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#1a1a1a', border: '1px solid rgba(191,162,78,0.12)' }}>
      {!audioUrl ? (
        <>
          <button onClick={recording ? stopRecording : startRecording} className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: recording ? '#d9603b' : 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', color: '#fff' }}>
            {recording ? <Square size={16} /> : <Mic size={17} />}
          </button>
          <div className="text-xs" style={{ color: '#8c8578' }}>
            {recording ? <span style={{ color: '#d9603b' }} className="font-semibold">● {t('form.voice_note')} {fmt(seconds)}</span> : t('form.voice_record')}
          </div>
        </>
      ) : (
        <>
          <button onClick={() => { if (audioRef.current) { playing ? audioRef.current.pause() : audioRef.current.play(); setPlaying(!playing); } }} className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', color: '#0a0a0a' }}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} className="hidden" />
          <span className="text-xs flex-1" style={{ color: '#8c8578' }}>{t('form.voice_note')} · {fmt(seconds)}</span>
          <button onClick={() => { setAudioUrl(null); onVoiceReady(null); setSeconds(0); }}><Trash2 size={16} style={{ color: '#d9603b' }} /></button>
        </>
      )}
    </div>
  );
}

export default function Checkout() {
  const { t } = useTranslation('checkout');
  const { items, updateQty, removeItem, total, clearCart } = useCart();
  const { customer, token } = useCustomerAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState('');
  const [wilayaCode, setWilayaCode] = useState<number | null>(null);
  const [communeName, setCommuneName] = useState('');
  const [gps, setGps] = useState<[number, number] | null>(null);
  const [noteType, setNoteType] = useState<'text' | 'voice'>('text');
  const [textNote, setTextNote] = useState('');
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pricing, setPricing] = useState<DeliveryPricing | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [outOfRange, setOutOfRange] = useState(false);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);

  // Sync from profile when customer data loads
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
    }
  }, [customer]);

  const setGpsFromCommune = (wCode: number | null, cName: string) => {
    if (wCode && cName) {
      const coords = getCommuneCoords(wCode, cName);
      if (coords) setGps(coords);
    } else if (wCode && !cName) {
      const w = getWilayaByCode(wCode);
      if (w) setGps([w.lat, w.lng]);
    }
  };

  const savedAddresses: { id: string; label: string; address: string; wilayaCode?: number; commune?: string }[] =
    customer?.addresses && Array.isArray(customer.addresses) ? customer.addresses : [];

  const selectAddress = (a: { id: string; label: string; address: string; wilayaCode?: number; commune?: string }) => {
    setSelectedAddrId(a.id);
    setAddress(a.address);
    if (a.wilayaCode) setWilayaCode(a.wilayaCode);
    if (a.commune) setCommuneName(a.commune);
    setGpsFromCommune(a.wilayaCode ?? null, a.commune ?? '');
  };

  const useCustomAddress = () => {
    setSelectedAddrId(null);
    setAddress('');
    setWilayaCode(null);
    setCommuneName('');
    setGps(null);
  };

  const communes = wilayaCode ? getCommunesByWilaya(wilayaCode) : [];

  const formatFullAddress = () => {
    const parts = [address];
    if (communeName) parts.push(communeName);
    if (wilayaCode) {
      const w = getWilayaByCode(wilayaCode);
      if (w) parts.push(w.name);
    }
    return parts.filter(Boolean).join(', ');
  };

  useEffect(() => {
    getDeliveryPricing().then(setPricing);
  }, []);

  useEffect(() => {
    if (!pricing || !gps) { setDeliveryFee(null); setDeliveryDistance(null); setOutOfRange(false); return; }
    const result = calcDeliveryFee(pricing, total, gps[0], gps[1]);
    if (result.outOfRange) { setOutOfRange(true); setDeliveryFee(null); setDeliveryDistance(result.distance); }
    else { setOutOfRange(false); setDeliveryFee(result.fee); setDeliveryDistance(result.distance); }
  }, [pricing, gps, total]);

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const submitOrder = async () => {
    if (!name.trim() || !phone.trim()) { toast.error(t('form.name')); return; }
    if (!address.trim() && !communeName) { toast.error(t('form.address_placeholder')); return; }
    if (items.length === 0) { toast.error(t('form.submit')); return; }
    if (outOfRange) { toast.error(t('form.address')); return; }
    setSubmitting(true);
    try {
      const payload: any = {
        items: items.map(i => ({
          catalogItemId: i.catalogId || i.id,
          productId: i.erpProductId || null,
          quantity: i.qty,
          unitPrice: Number(i.promoPrice ?? i.price),
          name: i.name || undefined,
          customName: i.customName || undefined,
          customPrice: i.customPrice || undefined,
          imageUrl: i.imageUrl || undefined,
        })),
        total,
        customerName: name,
        phone,
        address: formatFullAddress(),
        latitude: gps ? gps[0] : null,
        longitude: gps ? gps[1] : null,
        customerId: customer?.id || undefined,
        deliveryFee: deliveryFee ?? 0,
      };
      const res = await api.post('/orders', payload);
      const orderId = res.data.id;
      const secureToken = res.data.secureToken;

      if (noteType === 'voice' && voiceBlob) {
        try {
          const fd = new FormData();
          fd.append('audio', voiceBlob, 'voice.webm');
          const upRes = await api.post('/upload/voice/public', fd);
          const audioUrl = upRes.data?.url;
          if (audioUrl && secureToken) {
            await api.post(`/orders/token/${secureToken}/messages`, { text: null, sender: 'customer', audioUrl });
          }
        } catch {}
      } else if (noteType === 'text' && textNote.trim()) {
        try {
          if (secureToken) {
            await api.post(`/orders/token/${secureToken}/messages`, { text: textNote.trim(), sender: 'customer' });
          }
        } catch {}
      }

      clearCart();
      toast.success(t('success.title'));
      if (secureToken) navigate(`/track/${secureToken}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || t('form.submitting'));
    } finally { setSubmitting(false); }
  };

  if (items.length === 0 && !submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: '#333' }} />
          <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('form.submit')}</h2>
          <p className="text-sm mb-6" style={{ color: '#8c8578' }}>{t('form.address_placeholder')}</p>
          <button onClick={() => navigate('/')} className="gold-btn px-6 py-3 text-sm font-bold rounded-full flex items-center gap-2 mx-auto">
            {t('form.location')} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left: form */}
        <div>
          <p className="text-xs tracking-[0.25em] font-semibold mb-2" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>CHECKOUT</p>
          <h1 className="text-2xl font-extrabold mb-6" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('title')}</h1>

          <div className="surface-card p-5 mb-4">
            <p className="text-xs font-bold tracking-wide mb-3" style={{ color: '#8c8578' }}>{t('form.name')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>{t('form.name')}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ahmed Benali" className="input-field" />
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>{t('form.phone')}</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 0555 12 34 56" className="input-field" />
              </div>
            </div>
          </div>

          <div className="surface-card p-5 mb-4">
            <p className="text-xs font-bold tracking-wide mb-3 flex items-center gap-1.5" style={{ color: '#8c8578' }}>
              <MapPin size={13} /> {t('form.location')}
            </p>
            {savedAddresses.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {savedAddresses.map(a => (
                  <button key={a.id} onClick={() => selectAddress(a)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                    style={{ background: selectedAddrId === a.id ? 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)' : '#1a1a1a', color: selectedAddrId === a.id ? '#0a0a0a' : '#8c8578', border: selectedAddrId === a.id ? 'none' : '1px solid rgba(191,162,78,0.12)' }}>
                    {a.label}
                  </button>
                ))}
                <button onClick={useCustomAddress}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{ background: selectedAddrId === null ? 'rgba(191,162,78,0.15)' : '#1a1a1a', color: selectedAddrId === null ? '#bfa24e' : '#8c8578', border: '1px solid rgba(191,162,78,0.12)' }}>
                  Autre adresse
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Wilaya</label>
                <select value={wilayaCode ?? ''} onChange={e => { const v = Number(e.target.value) || null; setWilayaCode(v); setCommuneName(''); setGpsFromCommune(v, ''); }}
                  className="input-field text-xs">
                  <option value="">Sélectionnez une wilaya</option>
                  {WILAYAS.map(w => <option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Commune</label>
                <select value={communeName} onChange={e => { const v = e.target.value; setCommuneName(v); setGpsFromCommune(wilayaCode, v); }}
                  className="input-field text-xs" disabled={!wilayaCode}>
                  <option value="">Sélectionnez une commune</option>
                  {communes.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rue, cité, numéro..." className="input-field mb-3" />
            <DeliveryMap position={gps ?? undefined} onLocationChange={setGps} />
            {gps && <p className="text-[11px] mt-2" style={{ color: '#8c8578', fontFamily: "'IBM Plex Mono', monospace" }}>GPS: {gps[0].toFixed(5)}, {gps[1].toFixed(5)}</p>}
          </div>

          <div className="surface-card p-5">
            <p className="text-xs font-bold tracking-wide mb-3" style={{ color: '#8c8578' }}>{t('form.voice_note')}</p>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setNoteType('text')} className="flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5" style={{ background: noteType === 'text' ? 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)' : '#1a1a1a', color: noteType === 'text' ? '#0a0a0a' : '#8c8578' }}>
                <Type size={13} /> {t('form.voice_record')}
              </button>
              <button onClick={() => setNoteType('voice')} className="flex-1 py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5" style={{ background: noteType === 'voice' ? 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)' : '#1a1a1a', color: noteType === 'voice' ? '#0a0a0a' : '#8c8578' }}>
                <Mic size={13} /> {t('form.voice_stop')}
              </button>
            </div>
            {noteType === 'text' ? (
              <textarea value={textNote} onChange={e => setTextNote(e.target.value)} placeholder={t('form.address_placeholder')} rows={3} className="input-field resize-none" />
            ) : (
              <VoiceRecorder onVoiceReady={setVoiceBlob} />
            )}
          </div>
        </div>

        {/* Right: summary */}
        <div className="surface-card p-5 h-fit sticky top-20">
          <p className="text-xs font-bold tracking-wide mb-4 flex items-center gap-1.5" style={{ color: '#8c8578' }}>
            <ShoppingBag size={13} /> {t('success.track')}
          </p>
          <div className="space-y-3 mb-4 max-h-64 overflow-auto">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#1a1a1a' }}><Minus size={10} /></button>
                    <span className="text-xs w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#1a1a1a' }}><Plus size={10} /></button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold" style={{ color: '#bfa24e' }}>{(item.promoPrice ?? item.price) * item.qty} DA</p>
                  <button onClick={() => removeItem(item.id)} className="mt-1"><X size={12} style={{ color: '#8c8578' }} /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="py-3 mb-2 space-y-2" style={{ borderTop: '1px solid rgba(191,162,78,0.12)' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: '#8c8578' }}>Total des produits</span>
              <span className="text-sm font-semibold">{total} DA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs flex items-center gap-1" style={{ color: '#8c8578' }}>
                <Truck size={12} /> {t('form.delivery_fee')}
                {deliveryDistance !== null && <span className="text-[10px]" style={{ color: '#555' }}>({deliveryDistance.toFixed(1)} km)</span>}
              </span>
              <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: deliveryFee === 0 ? '#4ade80' : '#bfa24e' }}>
                {deliveryFee === null ? '—' : deliveryFee === 0 ? t('form.use_my_location') : `${deliveryFee} DA`}
                {deliveryFee !== null && deliveryFee > 0 && <span className="text-[9px] font-normal px-1 py-0.5 rounded" style={{ background: 'rgba(191,162,78,0.12)', color: '#8c8578' }}>estimation</span>}
              </span>
            </div>
            {outOfRange && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg" style={{ background: 'rgba(217,96,59,0.1)' }}>
                <AlertTriangle size={13} style={{ color: '#d9603b' }} />
                <span className="text-[11px]" style={{ color: '#d9603b' }}>Hors zone de livraison (max {pricing?.maxRadius} km)</span>
              </div>
            )}
            {pricing && pricing.freeThreshold > 0 && deliveryFee === 0 && total < pricing.freeThreshold && (
              <p className="text-[10px]" style={{ color: '#4ade80' }}>{t('form.total')}</p>
            )}
          </div>
          <div className="flex justify-between items-center py-3 mb-4" style={{ borderTop: '1px solid rgba(191,162,78,0.12)' }}>
            <span className="text-sm font-bold">{t('form.total')}</span>
            <span className="text-lg font-bold" style={{ color: '#bfa24e' }}>{total + (deliveryFee || 0)} DA</span>
          </div>
          <button onClick={submitOrder} disabled={submitting || outOfRange} className="gold-btn w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
            <Send size={15} /> {submitting ? t('form.submitting') : t('form.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
