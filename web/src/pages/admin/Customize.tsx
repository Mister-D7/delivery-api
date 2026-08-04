import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Package, Pencil, Upload, Truck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DeliveryPricingTab from './DeliveryPricingTab';
import { useTranslation } from 'react-i18next';
import AdminSelect from './AdminSelect';
import ProductForm from './ProductForm';
import CategoryForm from './CategoryForm';
import ContextMenu, { useContextMenu } from '../../components/ContextMenu';
import { getStoreType, storeTypeForTheme, STORE_TYPES, type StoreType } from '../../themes';

type Product = {
  id: string; name: string; salePrice: number; costPrice?: number | null; promoPrice?: number | null;
  stockQty: number; imageUrl?: string | null; modelUrl?: string | null; barcode?: string | null;
  category?: any; customName?: string | null; customPrice?: number | null; customDescription?: string | null;
  productId?: string | null; specs?: string | null; description?: string | null; storeType?: string | null;
};
type Category = { id: string; name: string; imageUrl?: string | null; createdAt?: string; storeType?: string | null };
type RawCatalog = {
  id: string; name?: string; productId?: string; barcode?: string | null; salePrice?: number; costPrice?: number | null;
  promoPrice?: number | null; stockQty?: number; imageUrl?: string | null; modelUrl?: string | null;
  description?: string | null; storeType?: string | null; customName?: string | null; customPrice?: number | null;
  customDescription?: string | null; specs?: string | null;
  product?: { id: string; name: string; salePrice: number; barcode?: string | null; stockQty: number; imageUrl?: string | null } | null;
  category?: { id: string; name: string; imageUrl?: string | null } | null;
};

function isVedetteName(name?: string | null) {
  return String(name || '').trim().toLowerCase() === 'vedette';
}

function flattenCatalogItem(raw: RawCatalog): Product {
  const p = raw.product;
  return {
    id: raw.id,
    name: raw.name || p?.name || 'Produit',
    salePrice: raw.salePrice ?? p?.salePrice ?? 0,
    costPrice: raw.costPrice ?? null,
    promoPrice: raw.promoPrice ?? null,
    stockQty: raw.stockQty ?? p?.stockQty ?? 0,
    imageUrl: raw.imageUrl || p?.imageUrl || null,
    modelUrl: raw.modelUrl || null,
    barcode: raw.barcode || p?.barcode || null,
    category: raw.category || null,
    customName: raw.customName || null,
    customPrice: raw.customPrice ?? null,
    customDescription: raw.customDescription || null,
    productId: raw.productId || null,
    specs: raw.specs || null,
    description: raw.description || null,
    storeType: raw.storeType || 'tech',
  };
}

export default function AdminCustomize() {
  const { t } = useTranslation('customize');
  const [storeType, setStoreType] = useState<StoreType>(() => getStoreType());
  const [tab, setTab] = useState<'products' | 'categories' | 'delivery'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/storefront/settings/storefront');
        if (r.data && typeof r.data === 'object' && r.data.theme) {
          setStoreType(storeTypeForTheme(r.data.theme));
        }
      } catch {}
    })();
  }, []);

  const loadAll = useCallback(() => {
    return Promise.all([
      api.get('/catalog/admin', { params: { storeType } }).then(r => setProducts((r.data || []).map(flattenCatalogItem))),
      api.get('/categories', { params: { storeType } }).then(r => setCategories(r.data || [])),
    ]);
  }, [storeType]);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  const tabs = [
    { key: 'products' as const, label: t('tabs.products'), icon: Package },
    { key: 'categories' as const, label: t('tabs.categories'), icon: Package },
    { key: 'delivery' as const, label: t('tabs.pricing'), icon: Truck },
  ];

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-6" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('title')}</h1>

      <div className="mb-4" style={{ maxWidth: 320 }}>
        <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Boutique / thème</label>
        <AdminSelect
          value={storeType}
          onChange={v => setStoreType(v as StoreType)}
          options={STORE_TYPES.map(s => ({ value: s.type, label: `${s.emoji} ${s.label}` }))}
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5" style={{ background: tab === t.key ? 'var(--admin-gold-bg)' : 'var(--admin-surface2)', color: tab === t.key ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-xs" style={{ color: 'var(--admin-muted)' }}>Chargement...</p>
      ) : (
        <>
          {tab === 'products' && <ProductsTab products={products} categories={categories} storeType={storeType} refresh={loadAll} />}
          {tab === 'categories' && <CategoriesTab categories={categories} storeType={storeType} refresh={loadAll} />}
          {tab === 'delivery' && <DeliveryPricingTab />}
        </>
      )}
    </div>
  );
}

function ProductsTab({ products, categories, storeType, refresh }: { products: Product[]; categories: Category[]; storeType: StoreType; refresh: () => void }) {
  const { t } = useTranslation('customize');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [ctxProduct, setCtxProduct] = useState<Product | null>(null);
  const { menu, onContextMenu, closeMenu } = useContextMenu();

  const closeAll = () => { closeMenu(); setCtxProduct(null); };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Supprimer le produit « ${p.name} » ?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success('Produit supprimé');
      refresh();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="gold-btn px-4 py-2 text-xs flex items-center gap-2 rounded-full">
          <Plus size={13} /> {t('product.add')}
        </button>
      </div>

      {formOpen && (
        <ProductForm
          categories={categories}
          initial={editing || undefined}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}

      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="surface-card p-3 flex items-center gap-3 cursor-default select-none"
            onContextMenu={e => { onContextMenu(e); setCtxProduct(p); }}>
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--admin-surface2)' }}>
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : p.modelUrl ? (
                <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--admin-gold)' }}><Package size={14} /></div>
              ) : <div className="w-full h-full flex items-center justify-center"><Package size={14} style={{ color: 'var(--admin-muted3)' }} /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs">
                {p.costPrice ? <span style={{ color: 'var(--admin-muted)' }}>Achat {p.costPrice} DA · </span> : null}
                <span style={{ color: 'var(--admin-text)' }}>Vente {p.salePrice} DA</span>
                <span style={{ color: 'var(--admin-muted)' }}> · Stock: {p.stockQty}</span>
              </p>
              {p.specs && <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--admin-muted2)' }}>{p.specs}</p>}
            </div>
            <button onClick={() => { setEditing(p); setFormOpen(true); }} className="p-2 rounded-lg flex-shrink-0" style={{ color: 'var(--admin-gold)' }} title="Modifier">
              <Pencil size={14} />
            </button>
          </div>
        ))}
      </div>

      <ContextMenu
        position={menu}
        onClose={closeAll}
        items={ctxProduct ? [
          { label: 'Modifier', icon: <Pencil size={12} />, onClick: () => { setEditing(ctxProduct); setFormOpen(true); } },
          { label: 'Supprimer', icon: <Trash2 size={12} />, color: '#ef4444', onClick: () => handleDelete(ctxProduct) },
        ] : []}
      />
    </div>
  );
}

function CategoriesTab({ categories, storeType, refresh }: { categories: Category[]; storeType: StoreType; refresh: () => void }) {
  const { t } = useTranslation('customize');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [ctxCat, setCtxCat] = useState<Category | null>(null);
  const { menu, onContextMenu, closeMenu } = useContextMenu();

  const closeAll = () => { closeMenu(); setCtxCat(null); };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/categories', { name: name.trim(), imageUrl: imageUrl || undefined, storeType });
      toast.success(t('category.add'));
      setName(''); setImageUrl('');
      refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (c: Category) => {
    if (isVedetteName(c.name)) {
      toast.error('La catégorie Vedette est protégée et ne peut pas être supprimée.');
      return;
    }
    if (!confirm(`Supprimer la catégorie « ${c.name} » ?`)) return;
    try {
      await api.delete(`/categories/${c.id}`, { params: { storeType } });
      toast.success('Catégorie supprimée');
      refresh();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const seedDefaults = async () => {
    try {
      const r = await api.post('/categories/seed');
      toast.success(r.data.message || t('category.seed')); refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  return (
    <div>
      {categories.length === 0 && (
        <button onClick={seedDefaults} className="gold-btn w-full py-3 text-sm mb-4 flex items-center justify-center gap-2">
          {t('category.seed')}
        </button>
      )}
      <div className="flex gap-2 mb-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder={t('category.name')} className="input-field flex-1" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder={t('category.image_url')} className="input-field flex-1" />
        <button onClick={handleAdd} disabled={submitting} className="gold-btn px-4 py-2 text-xs rounded-full flex items-center gap-2">
          <Plus size={13} /> {t('category.add')}
        </button>
      </div>

      {formOpen && (
        <CategoryForm
          initial={editing || undefined}
          storeType={storeType}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}

      <div className="space-y-2">
        {categories.map(c => {
          const vedette = isVedetteName(c.name);
          return (
            <div key={c.id} className="surface-card p-3 flex items-center gap-3 cursor-default select-none"
              onContextMenu={e => { onContextMenu(e); setCtxCat(c); }}>
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--admin-surface2)' }}>
                {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={14} style={{ color: 'var(--admin-muted3)' }} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {c.name}
                  {vedette && <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--admin-gold-bg)', color: 'var(--admin-gold)' }}>3D</span>}
                </p>
                {c.createdAt && <p className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>}
              </div>
              {!vedette && (
                <button onClick={() => handleDelete(c)} className="p-2 rounded-lg flex-shrink-0" style={{ color: 'var(--admin-danger)' }} title="Supprimer">
                  <Trash2 size={14} />
                </button>
              )}
              <button onClick={() => { setEditing(c); setFormOpen(true); }} className="p-2 rounded-lg flex-shrink-0" style={{ color: 'var(--admin-gold)' }} title="Modifier">
                <Pencil size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <ContextMenu
        position={menu}
        onClose={closeAll}
        items={ctxCat ? [
          { label: 'Modifier', icon: <Pencil size={12} />, onClick: () => { setEditing(ctxCat); setFormOpen(true); } },
          ...(isVedetteName(ctxCat.name) ? [] : [
            { label: 'Supprimer', icon: <Trash2 size={12} />, color: '#ef4444', onClick: () => handleDelete(ctxCat) },
          ]),
        ] : []}
      />
    </div>
  );
}
