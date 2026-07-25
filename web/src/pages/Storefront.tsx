import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, X, Plus, Minus } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import CartSheet from '../components/CartSheet';
import { useCart } from '../context/CartContext';

type RawProduct = { id: string; name?: string; productId?: string; promoPrice?: number | null; promoEndDate?: string | null; stockQty?: number; imageUrl?: string | null; displayOrder?: number; isActive?: boolean; customName?: string | null; customPrice?: number | null; customDescription?: string | null; specs?: string | null; barcode?: string | null; product?: { id: string; name: string; salePrice: number; barcode?: string | null; imageUrl?: string | null; stockQty: number } | null; category?: { id: string; name: string } | null };
type Product = { id: string; catalogId: string; erpProductId?: string | null; customName?: string | null; customPrice?: number | null; name: string; salePrice: number; promoPrice?: number | null; imageUrl?: string | null; stockQty: number; category?: { id: string; name: string } | null; barcode?: string | null; displayOrder?: number; isActive?: boolean; specs?: string | null };
type Category = { id: string; name: string; imageUrl?: string | null };

function flattenProduct(raw: RawProduct): Product {
  const p = raw.product;
  const name = raw.name || p?.name || 'Produit';
  const salePrice = raw.salePrice ?? p?.salePrice ?? 0;
  const stockQty = raw.stockQty ?? p?.stockQty ?? 0;
  return {
    id: raw.id,
    catalogId: raw.id,
    erpProductId: raw.productId || null,
    customName: raw.customName || null,
    customPrice: raw.customPrice ?? null,
    name,
    salePrice,
    promoPrice: raw.promoPrice ?? null,
    imageUrl: raw.imageUrl || p?.imageUrl || null,
    stockQty,
    category: raw.category || null,
    barcode: raw.barcode || p?.barcode || null,
    displayOrder: raw.displayOrder,
    isActive: raw.isActive,
    specs: raw.specs || null,
  };
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { count, addItem } = useCart();

  const q = searchParams.get('q') || '';
  const cat = searchParams.get('cat') || '';

  const loadData = useCallback(() => {
    return Promise.all([
      api.get('/catalog').then(r => setProducts((r.data || []).map(flattenProduct))),
      api.get('/categories/public').then(r => setCategories(r.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let list = products;
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.barcode?.includes(q));
    if (cat) list = list.filter(p => (p.category as any)?.name === cat);
    return list;
  }, [products, q, cat]);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Hero */}
      <section className="relative px-4 pt-12 pb-16 md:pt-20 md:pb-24 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(60deg, rgba(191,162,78,0.03) 0px, rgba(191,162,78,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(-60deg, rgba(191,162,78,0.03) 0px, rgba(191,162,78,0.03) 1px, transparent 1px, transparent 40px)' }} />
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.3em] font-semibold mb-4 relative" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>
          LIVRAISON RAPIDE
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-extrabold leading-tight max-w-3xl mx-auto relative" style={{ fontFamily: "'Unbounded', sans-serif" }}>
          Commandez, on vous livre
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 text-sm md:text-base max-w-lg mx-auto relative" style={{ color: '#8c8578' }}>
          Parcourez notre catalogue et recevez vos produits directement chez vous.
        </motion.p>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="px-4 pb-8">
          <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => { const p = new URLSearchParams(searchParams); p.delete('cat'); setSearchParams(p); }}
              className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
              style={{ background: !cat ? 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)' : '#1a1a1a', color: !cat ? '#0a0a0a' : '#8c8578', border: '1px solid rgba(191,162,78,0.12)' }}
            >
              Tout
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { const p = new URLSearchParams(searchParams); p.set('cat', c.name); setSearchParams(p); }}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
                style={{ background: cat === c.name ? 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)' : '#1a1a1a', color: cat === c.name ? '#0a0a0a' : '#8c8578', border: '1px solid rgba(191,162,78,0.12)' }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products grid */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="surface-card overflow-hidden animate-pulse">
                  <div className="aspect-square" style={{ background: '#1a1a1a' }} />
                  <div className="p-3">
                    <div className="h-4 rounded mb-2" style={{ background: '#1a1a1a', width: '70%' }} />
                    <div className="h-3 rounded" style={{ background: '#1a1a1a', width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package size={40} className="mx-auto mb-4" style={{ color: '#333' }} />
              <p className="text-sm" style={{ color: '#8c8578' }}>
                {q || cat ? 'Aucun produit trouvé pour cette recherche.' : 'Aucun produit disponible.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} id={p.id} catalogId={p.catalogId} erpProductId={p.erpProductId} customName={p.customName} customPrice={p.customPrice} name={p.name} price={p.salePrice} promoPrice={p.promoPrice} imageUrl={p.imageUrl} stockQty={p.stockQty} specs={p.specs} index={i} onClick={() => setDetailProduct(p)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mobile cart FAB */}
      {count > 0 && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-5 right-5 z-40 gold-btn flex items-center gap-2 px-5 py-3.5 rounded-full shadow-lg md:hidden">
          <span className="text-sm font-bold">Panier</span>
          <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: '#0a0a0a', color: '#d4b96a' }}>{count}</span>
        </button>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {detailProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setDetailProduct(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="w-full max-w-lg max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden relative flex flex-col" style={{ background: '#111', border: '1px solid rgba(191,162,78,0.15)' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setDetailProduct(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                <X size={16} />
              </button>

              <div className="overflow-y-auto flex-1 overscroll-contain">
                {detailProduct.imageUrl ? (
                  <div className="w-full" style={{ background: '#0a0a0a' }}>
                    <img src={detailProduct.imageUrl} alt={detailProduct.name} className="w-full" style={{ display: 'block' }} />
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center py-16" style={{ background: '#0a0a0a' }}>
                    <div className="w-24 h-24 rounded-3xl" style={{ background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', opacity: 0.2 }} />
                  </div>
                )}

                <div className="p-5">
                  {detailProduct.category && (
                    <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>{(detailProduct.category as any).name?.toUpperCase()}</p>
                  )}
                  <h2 className="text-lg font-extrabold mb-1" style={{ fontFamily: "'Unbounded', sans-serif" }}>{detailProduct.name}</h2>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl font-bold" style={{ color: '#bfa24e' }}>{detailProduct.promoPrice ?? detailProduct.salePrice} DA</span>
                    {detailProduct.promoPrice != null && detailProduct.promoPrice < detailProduct.salePrice && (
                      <>
                        <span className="text-sm line-through" style={{ color: '#8c8578' }}>{detailProduct.salePrice} DA</span>
                        <span className="badge badge-danger text-xs">-{Math.round((1 - detailProduct.promoPrice / detailProduct.salePrice) * 100)}%</span>
                      </>
                    )}
                  </div>

                  {detailProduct.specs && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: '#555', fontFamily: "'IBM Plex Mono', monospace" }}>SPÉCIFICATIONS</p>
                      <div className="rounded-xl p-3" style={{ background: '#0a0a0a' }}>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{detailProduct.specs}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(191,162,78,0.1)' }}>
                <button
                  onClick={() => {
                    if (detailProduct.stockQty == null || detailProduct.stockQty > 0) {
                      addItem({
                        id: detailProduct.id, catalogId: detailProduct.catalogId, erpProductId: detailProduct.erpProductId || undefined,
                        customName: detailProduct.customName || undefined, customPrice: detailProduct.customPrice || undefined,
                        name: detailProduct.name, price: detailProduct.salePrice, promoPrice: detailProduct.promoPrice, imageUrl: detailProduct.imageUrl,
                      });
                      setDetailProduct(null);
                    }
                  }}
                  disabled={detailProduct.stockQty != null && detailProduct.stockQty <= 0}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: (detailProduct.stockQty == null || detailProduct.stockQty > 0) ? 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)' : '#333', color: (detailProduct.stockQty == null || detailProduct.stockQty > 0) ? '#0a0a0a' : '#666', cursor: (detailProduct.stockQty == null || detailProduct.stockQty > 0) ? 'pointer' : 'not-allowed' }}
                >
                  <Plus size={16} />
                  {detailProduct.stockQty != null && detailProduct.stockQty <= 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
