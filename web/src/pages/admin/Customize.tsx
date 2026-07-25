import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Package, Edit2, Save, X, Upload, Truck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DeliveryPricingTab from './DeliveryPricingTab';

type Product = { id: string; name: string; salePrice: number; stockQty: number; imageUrl?: string | null; barcode?: string | null; category?: any; customName?: string | null; customPrice?: number | null; customDescription?: string | null; productId?: string | null; specs?: string | null };
type Category = { id: string; name: string; imageUrl?: string | null; createdAt?: string };
type RawCatalog = { id: string; name?: string; productId?: string; promoPrice?: number | null; stockQty?: number; imageUrl?: string | null; customName?: string | null; customPrice?: number | null; customDescription?: string | null; specs?: string | null; product?: { id: string; name: string; salePrice: number; barcode?: string | null; stockQty: number; imageUrl?: string | null } | null; category?: { id: string; name: string; imageUrl?: string | null } | null };

function flattenCatalogItem(raw: RawCatalog): Product {
  const p = raw.product;
  return {
    id: raw.id,
    name: raw.name || p?.name || 'Produit',
    salePrice: raw.salePrice ?? p?.salePrice ?? 0,
    stockQty: raw.stockQty ?? p?.stockQty ?? 0,
    imageUrl: raw.imageUrl || p?.imageUrl || null,
    barcode: raw.barcode || p?.barcode || null,
    category: raw.category || null,
    customName: raw.customName || null,
    customPrice: raw.customPrice ?? null,
    customDescription: raw.customDescription || null,
    productId: raw.productId || null,
    specs: raw.specs || null,
  };
}

export default function AdminCustomize() {
  const [tab, setTab] = useState<'products' | 'categories' | 'delivery'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/catalog').then(r => setProducts((r.data || []).map(flattenCatalogItem))),
      api.get('/categories').then(r => setCategories(r.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    api.get('/catalog').then(r => setProducts((r.data || []).map(flattenCatalogItem)));
    api.get('/categories').then(r => setCategories(r.data || []));
  };

  const tabs = [
    { key: 'products' as const, label: 'Produits', icon: Package },
    { key: 'categories' as const, label: 'Catégories', icon: Package },
    { key: 'delivery' as const, label: 'Livraison', icon: Truck },
  ];

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-6" style={{ fontFamily: "'Unbounded', sans-serif" }}>Catalogue</h1>
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5" style={{ background: tab === t.key ? 'rgba(191,162,78,0.15)' : '#1a1a1a', color: tab === t.key ? '#bfa24e' : '#8c8578' }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'products' && <ProductsTab products={products} categories={categories} refresh={refresh} />}
      {tab === 'categories' && <CategoriesTab categories={categories} refresh={() => api.get('/categories').then(r => setCategories(r.data || []))} />}
      {tab === 'delivery' && <DeliveryPricingTab />}
    </div>
  );
}

function ProductsTab({ products, categories, refresh }: { products: Product[]; categories: Category[]; refresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', salePrice: '', stockQty: '0', categoryId: '', specs: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('salePrice', String(Number(form.salePrice)));
      fd.append('stockQty', String(Number(form.stockQty)));
      if (form.categoryId) fd.append('categoryId', form.categoryId);
      if (imageFile) fd.append('image', imageFile);
      if (form.specs.trim()) fd.append('specs', form.specs.trim());
      await api.post('/products', fd);
      toast.success('Produit ajouté');
      setForm({ name: '', salePrice: '', stockQty: '0', categoryId: '', specs: '' });
      setImageFile(null);
      setAdding(false);
      refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setAdding(!adding)} className="gold-btn px-4 py-2 text-xs flex items-center gap-2 rounded-full">
          {adding ? <X size={13} /> : <Plus size={13} />} {adding ? 'Annuler' : 'Ajouter un produit'}
        </button>
      </div>

      {adding && (
        <div className="surface-card p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom du produit" className="input-field" />
            <input type="number" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })} placeholder="Prix de vente" className="input-field" />
            <input type="number" value={form.stockQty} onChange={e => setForm({ ...form, stockQty: e.target.value })} placeholder="Stock" className="input-field" />
            <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="input-field">
              <option value="">Sans catégorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="mt-3">
            <label className="text-xs font-semibold block mb-1" style={{ color: '#8c8578' }}>Spécifications</label>
            <textarea value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} placeholder="Ex: Intel Core i5 13ème Gen, 4.5GHz, 16GB RAM DDR5, 512GB SSD..." rows={3} className="input-field w-full resize-none" />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <input ref={fileRef} type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl" style={{ background: '#1a1a1a', color: '#8c8578' }}>
              <Upload size={13} /> {imageFile ? imageFile.name : 'Image'}
            </button>
            <button onClick={handleAdd} disabled={submitting} className="gold-btn px-4 py-2 text-xs rounded-full ml-auto">
              {submitting ? '...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="surface-card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#1a1a1a' }}>
              {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs" style={{ color: '#8c8578' }}>{p.salePrice} DA · Stock: {p.stockQty}</p>
              {p.specs && <p className="text-[10px] truncate mt-0.5" style={{ color: '#555' }}>{p.specs}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab({ categories, refresh }: { categories: Category[]; refresh: () => void }) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/categories', { name: name.trim(), imageUrl: imageUrl || undefined });
      toast.success('Catégorie ajoutée');
      setName(''); setImageUrl('');
      refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Supprimer "${catName}" ?`)) return;
    try { await api.delete(`/categories/${id}`); toast.success('Supprimé'); refresh(); } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const seedDefaults = async () => {
    try {
      const r = await api.post('/categories/seed');
      toast.success(r.data.message || 'Catégories par défaut créées'); refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  return (
    <div>
      {categories.length === 0 && (
        <button onClick={seedDefaults} className="gold-btn w-full py-3 text-sm mb-4 flex items-center justify-center gap-2">
          Charger les catégories par défaut (20 rayons supermarché)
        </button>
      )}
      <div className="flex gap-2 mb-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nouvelle catégorie" className="input-field flex-1" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL" className="input-field flex-1" />
        <button onClick={handleAdd} disabled={submitting} className="gold-btn px-4 py-2 text-xs rounded-full flex items-center gap-2">
          <Plus size={13} /> Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.id} className="surface-card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#1a1a1a' }}>
              {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={14} style={{ color: '#444' }} /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              {c.createdAt && <p className="text-[10px]" style={{ color: '#555' }}>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>}
            </div>
            <button onClick={() => handleDelete(c.id, c.name)} className="p-2 rounded-lg" style={{ color: '#d9603b' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
