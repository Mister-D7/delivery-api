import { useState, useEffect } from 'react';
import { Truck, Save, MapPin } from '../../components/adminIcons';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const adminPinIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;background:#d4b96a;border:3px solid #0a0a0a;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

type DeliveryPricing = {
  shopLat: number;
  shopLng: number;
  baseFee: number;
  baseKm: number;
  extraPerKm: number;
  freeThreshold: number;
  maxRadius: number;
  shopName: string;
};

const DEFAULT: DeliveryPricing = {
  shopLat: 36.7538,
  shopLng: 3.0588,
  baseFee: 200,
  baseKm: 5,
  extraPerKm: 50,
  freeThreshold: 3000,
  maxRadius: 30,
  shopName: 'Mon Magasin',
};

export default function DeliveryPricingTab() {
  const { t } = useTranslation('delivery-pricing');
  const [pricing, setPricing] = useState<DeliveryPricing>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/storefront/settings/delivery_pricing')
      .then(r => { if (r.data) setPricing({ ...DEFAULT, ...r.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/storefront/settings/delivery_pricing', pricing);
      toast.success(t('saved'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('title'));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="surface-card h-32 animate-pulse" style={{ background: '#1a1a1a' }} />;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Truck size={18} style={{ color: '#bfa24e' }} />
        <h3 className="text-sm font-bold" style={{ color: '#bfa24e' }}>{t('title')}</h3>
      </div>

      <div className="surface-card p-4 mb-4">
        <p className="text-xs font-semibold mb-3" style={{ color: '#8c8578' }}>{t('shop_location')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>{t('shop_location')}</label>
            <input value={pricing.shopName} onChange={e => setPricing({ ...pricing, shopName: e.target.value })} className="input-field" />
          </div>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ height: 250, border: '1px solid rgba(191,162,78,0.12)' }}>
          <MapContainer center={[pricing.shopLat, pricing.shopLng]} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
            <LocationMarker position={[pricing.shopLat, pricing.shopLng] as [number, number]} onMove={pos => setPricing({ ...pricing, shopLat: pos[0], shopLng: pos[1] })} />
          </MapContainer>
        </div>
        <div className="flex gap-4 mt-2 text-[10px]" style={{ color: '#555' }}>
          <span><strong style={{ color: '#8c8578' }}>Lat:</strong> {pricing.shopLat.toFixed(5)}</span>
          <span><strong style={{ color: '#8c8578' }}>Lng:</strong> {pricing.shopLng.toFixed(5)}</span>
        </div>
      </div>

      <div className="surface-card p-4 mb-4">
        <p className="text-xs font-semibold mb-3" style={{ color: '#8c8578' }}>{t('title')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>{t('base_fee')}</label>
            <input type="number" value={pricing.baseFee} onChange={e => setPricing({ ...pricing, baseFee: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Km inclus</label>
            <input type="number" step="0.5" value={pricing.baseKm} onChange={e => setPricing({ ...pricing, baseKm: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Extra / km</label>
            <input type="number" value={pricing.extraPerKm} onChange={e => setPricing({ ...pricing, extraPerKm: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>{t('free_threshold')}</label>
            <input type="number" value={pricing.freeThreshold} onChange={e => setPricing({ ...pricing, freeThreshold: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>{t('max_radius')}</label>
            <input type="number" value={pricing.maxRadius} onChange={e => setPricing({ ...pricing, maxRadius: Number(e.target.value) })} className="input-field" />
          </div>
        </div>
      </div>

      <div className="surface-card p-4 mb-4" style={{ background: 'rgba(191,162,78,0.05)' }}>
        <p className="text-xs" style={{ color: '#8c8578' }}>
          <strong style={{ color: '#bfa24e' }}>Formule:</strong> {pricing.baseFee} DA pour les {pricing.baseKm} premiers km.
          {pricing.extraPerKm > 0 && <> Au-delà: +{pricing.extraPerKm} DA / km supplémentaire.</>}
          {pricing.freeThreshold > 0 && <> Livraison gratuite si commande ≥ {pricing.freeThreshold} DA.</>}
          {' '}Rayon max: {pricing.maxRadius} km.
        </p>
      </div>

      <button onClick={save} disabled={saving} className="gold-btn px-6 py-2.5 text-xs font-semibold rounded-full flex items-center gap-2">
        <Save size={13} /> {saving ? t('saved') : t('save')}
      </button>
    </div>
  );
}

function LocationMarker({ position, onMove }: { position: [number, number]; onMove: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onMove([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} icon={adminPinIcon} />;
}
