import { useState, useEffect } from 'react';
import { Truck, Save, MapPin } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

type DeliveryPricing = {
  shopLat: number;
  shopLng: number;
  baseFee: number;
  perKm: number;
  freeThreshold: number;
  maxRadius: number;
  shopName: string;
};

const DEFAULT: DeliveryPricing = {
  shopLat: 36.7538,
  shopLng: 3.0588,
  baseFee: 200,
  perKm: 30,
  freeThreshold: 3000,
  maxRadius: 30,
  shopName: 'Mon Magasin',
};

export default function DeliveryPricingTab() {
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
      toast.success('Paramètres de livraison sauvegardés');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="surface-card h-32 animate-pulse" style={{ background: '#1a1a1a' }} />;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Truck size={18} style={{ color: '#bfa24e' }} />
        <h3 className="text-sm font-bold" style={{ color: '#bfa24e' }}>Tarification Livraison</h3>
      </div>

      <div className="surface-card p-4 mb-4">
        <p className="text-xs font-semibold mb-3" style={{ color: '#8c8578' }}>POSITION DU MAGASIN</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Nom du magasin</label>
            <input value={pricing.shopName} onChange={e => setPricing({ ...pricing, shopName: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Latitude</label>
            <input type="number" step="0.00001" value={pricing.shopLat} onChange={e => setPricing({ ...pricing, shopLat: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Longitude</label>
            <input type="number" step="0.00001" value={pricing.shopLng} onChange={e => setPricing({ ...pricing, shopLng: Number(e.target.value) })} className="input-field" />
          </div>
        </div>
      </div>

      <div className="surface-card p-4 mb-4">
        <p className="text-xs font-semibold mb-3" style={{ color: '#8c8578' }}>TARIFS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Frais de base (DA)</label>
            <input type="number" value={pricing.baseFee} onChange={e => setPricing({ ...pricing, baseFee: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Prix par km (DA/km)</label>
            <input type="number" value={pricing.perKm} onChange={e => setPricing({ ...pricing, perKm: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Livraison gratuite au-dessus de (DA)</label>
            <input type="number" value={pricing.freeThreshold} onChange={e => setPricing({ ...pricing, freeThreshold: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Rayon max (km)</label>
            <input type="number" value={pricing.maxRadius} onChange={e => setPricing({ ...pricing, maxRadius: Number(e.target.value) })} className="input-field" />
          </div>
        </div>
      </div>

      <div className="surface-card p-4 mb-4" style={{ background: 'rgba(191,162,78,0.05)' }}>
        <p className="text-xs" style={{ color: '#8c8578' }}>
          <strong style={{ color: '#bfa24e' }}>Formule:</strong> Frais = {pricing.baseFee} DA (base) + {pricing.perKm} DA × distance (km).
          {pricing.freeThreshold > 0 && <> Livraison gratuite si commande ≥ {pricing.freeThreshold} DA.</>}
          {' '}Rayon max: {pricing.maxRadius} km.
        </p>
      </div>

      <button onClick={save} disabled={saving} className="gold-btn px-6 py-2.5 text-xs font-semibold rounded-full flex items-center gap-2">
        <Save size={13} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  );
}
