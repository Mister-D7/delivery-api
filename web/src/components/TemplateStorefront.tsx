import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, X, Plus, Minus, Search, Loader2, Eye, Package, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import CartSheet from './CartSheet';
import {
  getStoreType, getActiveTheme, filterProductsForStore, mergeSettings,
  loadSavedSettings,
  type ThemeSettings, type ThemeProduct, type ThemeCategory, type ThemeData,
} from '../themes';
import { ThemeRoot, type ThemeActions } from '../themes/ThemeRoot';
import ContextMenu from './ContextMenu';

type RawProduct = { id: string; name?: string; productId?: string; promoPrice?: number | null; stockQty?: number; imageUrl?: string | null; isActive?: boolean; customName?: string | null; specs?: string | null; barcode?: string | null; product?: { id: string; name: string; salePrice: number; barcode?: string | null; imageUrl?: string | null; stockQty: number } | null; category?: { id: string; name: string } | null; storeType?: string | null };

export default function TemplateStorefront() {
  const [products, setProducts] = useState<ThemeProduct[]>([]);
  const [categories, setCategories] = useState<ThemeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState<ThemeProduct | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const { count, addItem } = useCart();
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const [ctxProduct, setCtxProduct] = useState<ThemeProduct | null>(null);

  const storeType = useMemo(() => getStoreType(), []);
  const theme = useMemo(() => getActiveTheme(storeType), [storeType]);

  const settings = useMemo<ThemeSettings>(() => {
    const saved = theme ? loadSavedSettings(theme.id) : {};
    return mergeSettings(theme?.defaults || {} as any, saved);
  }, [theme]);

  const storeText = useMemo(() => {
    let saved: Record<string, any> = {};
    if (theme) saved = loadSavedSettings(theme.id);
    return {
      storeName: saved.storeName || localStorage.getItem('delivery_store_name') || 'Ma Boutique',
      tagline: saved.tagline || localStorage.getItem('delivery_tagline') || '',
      bannerText: saved.bannerText || localStorage.getItem('delivery_banner_text') || 'Bienvenue',
    };
  }, [theme]);

  const pinnedOrder = useMemo(() => {
    try {
      const v = JSON.parse(localStorage.getItem('delivery_pinned_products') || '[]');
      return Array.isArray(v) ? v.filter((x: unknown): x is string => typeof x === 'string') : [];
    } catch { return []; }
  }, []);

  useEffect(() => {
    if (!theme) { setLoading(false); return; }
    Promise.all([
      api.get('/catalog').then(r => setProducts((r.data || []).map((p: RawProduct): ThemeProduct => ({
        id: p.id,
        name: p.name || p.product?.name || 'Produit',
        price: p.promoPrice ?? p.product?.salePrice ?? 0,
        oldPrice: p.promoPrice ? p.product?.salePrice ?? undefined : undefined,
        imageUrl: p.imageUrl || p.product?.imageUrl || undefined,
        category: p.category?.name,
        specs: p.specs || undefined,
        stockQty: p.stockQty ?? p.product?.stockQty ?? 0,
        storeType: p.storeType || 'general',
      })))),
      api.get('/categories/public', { params: { storeType } }).then(r => setCategories((r.data || []).map((c: any): ThemeCategory => ({
        id: c.id, name: c.name, imageUrl: c.image_url || c.imageUrl || undefined,
      })))),
    ]).finally(() => setLoading(false));
  }, [storeType, theme]);

  const filtered = useMemo(() => {
    let list = filterProductsForStore(products, storeType);
    if (pinnedOrder.length > 0) {
      const map = new Map(list.map(p => [p.id, p]));
      const pinnedItems = pinnedOrder.map(id => map.get(id)).filter((p): p is ThemeProduct => Boolean(p));
      const rest = list.filter(p => !pinnedOrder.includes(p.id));
      list = [...pinnedItems, ...rest];
    }
    if (catFilter) list = list.filter(p => p.category === catFilter);
    if (searchQ) list = list.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()));
    return list;
  }, [products, catFilter, searchQ, storeType, pinnedOrder]);

  const data: ThemeData = useMemo(() => ({
    storeName: storeText.storeName,
    tagline: storeText.tagline,
    bannerText: storeText.bannerText,
    products: filtered,
    categories,
  }), [storeText, filtered, categories]);

  const addToCart = useCallback((p: ThemeProduct, qty = 1) => {
    if (p.stockQty != null && p.stockQty <= 0) return;
    addItem({ id: p.id, catalogId: p.id, name: p.name, price: p.price, promoPrice: p.oldPrice ? p.oldPrice : undefined, imageUrl: p.imageUrl }, qty);
  }, [addItem]);

  const actions: ThemeActions = useMemo(() => ({
    viewProduct: (p) => { setDetailProduct(p); setDetailQty(1); },
    contextMenu: (p, x, y) => { setCtxProduct(p); setCtxPos({ x, y }); },
    openCart: () => setCartOpen(true),
    catFilter,
    setCatFilter,
  }), [catFilter]);

  if (!theme) return null;

  return (
    <div className="relative min-h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#fff' }} />
        </div>
      )}

      <ThemeRoot settings={settings} actions={actions}>
        <theme.Component {...data} />
      </ThemeRoot>

      {/* Search overlay */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#999' }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm shadow-lg border-0"
            style={{ background: 'rgba(255,255,255,0.95)', color: '#333', backdropFilter: 'blur(10px)' }}
          />
        </div>
      </div>

      {/* Cart FAB */}
      {count > 0 && (
        <button onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full shadow-xl"
          style={{ background: settings.accent, color: settings.bg }}>
          <ShoppingCart size={20} />
          <span className="font-bold text-sm">{count}</span>
        </button>
      )}

      {/* Category filter chip */}
      {catFilter && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40">
          <button onClick={() => setCatFilter(null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
            style={{ background: 'rgba(255,255,255,0.95)', color: '#333' }}>
            {catFilter} <X size={12} />
          </button>
        </div>
      )}

      {/* Product detail modal */}
      <AnimatePresence>
        {detailProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setDetailProduct(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="w-full max-w-lg max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#fff' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setDetailProduct(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                <X size={16} />
              </button>
              <div className="overflow-y-auto flex-1">
                {detailProduct.imageUrl ? (
                  <img src={detailProduct.imageUrl} alt={detailProduct.name} className="w-full" />
                ) : (
                  <div className="w-full py-16 flex items-center justify-center" style={{ background: '#f5f5f5' }}>
                    <Package size={32} style={{ color: '#ccc' }} />
                  </div>
                )}
                <div className="p-5">
                  {detailProduct.category && (
                    <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: settings.accent }}>
                      {detailProduct.category.toUpperCase()}
                    </p>
                  )}
                  <h2 className="text-lg font-extrabold mb-1">{detailProduct.name}</h2>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl font-bold" style={{ color: settings.accent }}>{detailProduct.price} DA</span>
                    {detailProduct.oldPrice != null && detailProduct.oldPrice > detailProduct.price && (
                      <span className="text-sm line-through" style={{ color: '#999' }}>{detailProduct.oldPrice} DA</span>
                    )}
                  </div>
                  {detailProduct.specs && (
                    <div className="mb-4 p-3 rounded-xl" style={{ background: '#f5f5f5' }}>
                      <p className="text-sm whitespace-pre-line">{detailProduct.specs}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t flex-shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#f0f0f0' }}>
                    <button onClick={() => setDetailQty(q => Math.max(1, q - 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#fff' }}><Minus size={12} /></button>
                    <span className="text-sm font-bold w-6 text-center">{detailQty}</span>
                    <button onClick={() => setDetailQty(q => q + 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#fff' }}><Plus size={12} /></button>
                  </div>
                  <p className="text-sm font-bold" style={{ color: settings.accent }}>{detailProduct.price * detailQty} DA</p>
                </div>
                <button
                  onClick={() => {
                    if (detailProduct.stockQty != null && detailProduct.stockQty <= 0) return;
                    addToCart(detailProduct, detailQty);
                    setDetailProduct(null);
                    toast.success('Ajouté au panier');
                  }}
                  className="w-full py-3 rounded-xl text-sm font-bold"
                  style={{ background: settings.accent, color: settings.bg }}>
                  Ajouter au panier
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />

      <ContextMenu
        items={ctxProduct ? [
          { label: 'Voir le produit', icon: <Eye size={12} />, onClick: () => { setDetailProduct(ctxProduct); setDetailQty(1); }, color: '#bfa24e' },
          { label: 'Ajouter au panier', icon: <Plus size={12} />, onClick: () => { addToCart(ctxProduct); toast.success('Ajouté au panier'); }, color: '#ccc', disabled: ctxProduct.stockQty != null && ctxProduct.stockQty <= 0 },
          { divider: true, label: '', onClick: () => {} },
          { label: 'Partager le lien', icon: <Share2 size={12} />, onClick: async () => {
            const url = window.location.href;
            if (navigator.share) { try { await navigator.share({ title: ctxProduct.name, text: `${ctxProduct.name} — ${ctxProduct.price} DA`, url }); } catch {} }
            else { try { await navigator.clipboard.writeText(url); } catch {} }
          }, color: '#ccc' },
        ] : []}
        position={ctxPos}
        onClose={() => { setCtxPos(null); setCtxProduct(null); }}
      />
    </div>
  );
}
