import { useState, useRef } from 'react';
import { X, ImagePlus, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

type Category = { id: string; name: string; imageUrl?: string | null };

export default function ProductForm({ categories, initial, onClose, onSaved }: {
  categories: Category[];
  initial?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [salePrice, setSalePrice] = useState(initial?.salePrice ?? initial?.sale_price ?? '');
  const [promoPrice, setPromoPrice] = useState(initial?.promoPrice ?? initial?.promo_price ?? '');
  const [stockQty, setStockQty] = useState(initial?.stockQty ?? initial?.stock_qty ?? 0);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? initial?.category?.id ?? initial?.category_id ?? '');
  const [specs, setSpecs] = useState(initial?.specs || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || initial?.image_url || '');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Nom du produit requis');
    if (salePrice === '' && promoPrice === '') return toast.error('Prix requis');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('salePrice', String(salePrice));
      if (promoPrice !== '') fd.append('promoPrice', String(promoPrice));
      fd.append('stockQty', String(stockQty));
      if (categoryId) fd.append('categoryId', categoryId);
      if (specs.trim()) fd.append('specs', specs.trim());
      if (description.trim()) fd.append('description', description.trim());
      if (file) {
        fd.append('image', file);
      } else if (imageUrl.trim()) {
        fd.append('imageUrl', imageUrl.trim());
      }
      if (initial?.id) fd.append('catalogId', initial.id);

      await api.post('/products', fd);
      toast.success(initial?.id ? 'Produit modifié' : 'Produit ajouté');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--admin-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--admin-border2)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--admin-gold)' }}>{initial?.id ? 'Modifier le produit' : 'Ajouter un produit'}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--admin-muted)' }}><X size={16} /></button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Nom du produit *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: RTX 4070 Super, Ryzen 7 · 32GB · 1TB NVMe"
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Prix (DA) *</label>
              <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="180000"
                className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Prix promo (DA)</label>
              <input type="number" value={promoPrice} onChange={e => setPromoPrice(e.target.value)} placeholder="150000"
                className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Stock</label>
              <input type="number" value={stockQty} onChange={e => setStockQty(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Catégorie</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }}>
                <option value="">— Aucune —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Image du produit</label>
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
                style={{ background: 'var(--admin-gold-bg)', color: 'var(--admin-gold)' }}>
                <Upload size={14} /> {file ? file.name : 'Téléverser'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { setFile(e.target.files?.[0] || null); setImageUrl(''); }} />
              <span className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>ou</span>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL de l'image"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
            </div>
            {(file || imageUrl) && (
              <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border2)' }}>
                <img src={file ? URL.createObjectURL(file) : imageUrl} alt="preview" className="w-full h-full object-cover" />
                <button onClick={() => { setFile(null); setImageUrl(''); }} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Spécifications</label>
            <textarea value={specs} onChange={e => setSpecs(e.target.value)} rows={3} placeholder={'ex: GPU: RTX 4070 Super\nCPU: Ryzen 7 7800X3D\nRAM: 32GB DDR5\nSSD: 1TB NVMe'}
              className="w-full px-3 py-2 rounded-lg text-xs resize-none" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
          </div>

          <div>
            <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg text-xs resize-none" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--admin-border2)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ color: 'var(--admin-muted)' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving}
            className="gold-btn px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
