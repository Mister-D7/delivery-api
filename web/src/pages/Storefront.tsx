import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, X, Plus, Minus, ShoppingCart, ArrowDown, ArrowUp, Share2, User, ZoomIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import CartSheet from '../components/CartSheet';
import ContextMenu, { useContextMenu, type ContextMenuItem } from '../components/ContextMenu';
import { useCart } from '../context/CartContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import VideoBackground from '../components/theme/VideoBackground';
import StorefrontRenderer from '../components/StorefrontRenderer';
import { getStoreType } from '../themes';

type RawProduct = { id: string; name?: string; productId?: string; promoPrice?: number | null; promoEndDate?: string | null; stockQty?: number; imageUrl?: string | null; displayOrder?: number; isActive?: boolean; customName?: string | null; customPrice?: number | null; customDescription?: string | null; specs?: string | null; barcode?: string | null; product?: { id: string; name: string; salePrice: number; barcode?: string | null; imageUrl?: string | null; stockQty: number } | null; category?: { id: string; name: string } | null; storeType?: string | null };
type Product = { id: string; catalogId: string; erpProductId?: string | null; customName?: string | null; customPrice?: number | null; name: string; salePrice: number; promoPrice?: number | null; imageUrl?: string | null; stockQty: number; category?: { id: string; name: string } | null; barcode?: string | null; displayOrder?: number; isActive?: boolean; specs?: string | null; storeType?: string | null };
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
    storeType: raw.storeType || 'general',
  };
}

function StorefrontInner() {
  const { t } = useTranslation('storefront');
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const { count, addItem } = useCart();
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [hasLayout, setHasLayout] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);
  const { menu: productMenu, onContextMenu: productCtx, closeMenu: closeProductCtx } = useContextMenu();
  const [ctxProduct, setCtxProduct] = useState<Product | null>(null);
  const { menu: catMenu, onContextMenu: catCtx, closeMenu: closeCatCtx } = useContextMenu();
  const [ctxCat, setCtxCat] = useState<Category | null>(null);

  const q = searchParams.get('q') || '';
  const cat = searchParams.get('cat') || '';

  const loadData = useCallback(() => {
    const storeType = getStoreType();
    return Promise.all([
      api.get('/catalog').then(r => setProducts((r.data || []).map(flattenProduct).filter((p: Product) => !p.storeType || p.storeType === 'general' || p.storeType === storeType))),
      api.get('/categories/public', { params: { storeType } }).then(r => setCategories((r.data || []).map((c: any) => ({
        id: c.id, name: c.name, imageUrl: c.image_url || c.imageUrl || null,
      })))),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('delivery_storefront_layout');
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.components?.length) setHasLayout(true);
      }
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.barcode?.includes(q));
    if (cat) list = list.filter(p => (p.category as any)?.name === cat);
    return list;
  }, [products, q, cat]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const catName = (p.category as any)?.name;
      if (catName) map[catName] = (map[catName] || 0) + 1;
    }
    return map;
  }, [products]);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bgColor = theme.bgColor;
  const surfaceColor = theme.surfaceColor;
  const textColor = theme.textColor;
  const accentColor = theme.accentColor;
  const fontFamily = theme.fontFamily;

  const hasBg = theme.backgroundType !== 'color' && !!theme.backgroundImage;
  const glass = hasBg && theme.glassEnabled;

  const handleShare = async () => {
    if (!detailProduct) return;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: detailProduct.name, text: `${detailProduct.name} — ${detailProduct.salePrice} DA`, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); } catch {}
    }
  };

  const getProductMenuItems = (p: Product): ContextMenuItem[] => [
    { label: t('products.add_to_cart'), icon: <Plus size={12} />, onClick: () => { if (p.stockQty == null || p.stockQty > 0) addItem({ id: p.id, catalogId: p.catalogId, erpProductId: p.erpProductId || undefined, customName: p.customName || undefined, customPrice: p.customPrice || undefined, name: p.name, price: p.salePrice, promoPrice: p.promoPrice, imageUrl: p.imageUrl }); }, color: '#bfa24e', disabled: p.stockQty != null && p.stockQty <= 0 },
    { label: t('hero.see_products'), icon: <Search size={12} />, onClick: () => { setDetailProduct(p); setDetailQty(1); }, color: '#ccc' },
    { divider: true, label: '', onClick: () => {} },
    { label: navigator.share ? t('context.share') : t('context.copy_link'), icon: <Share2 size={12} />, onClick: async () => { const url = window.location.href; if (navigator.share) { try { await navigator.share({ title: p.name, text: `${p.name} — ${p.promoPrice ?? p.salePrice} DA`, url }); } catch {} } else { try { await navigator.clipboard.writeText(url); } catch {} } }, color: '#ccc' },
  ];

  const getCategoryMenuItems = (c: Category): ContextMenuItem[] => [
    { label: t('context.filter_by', { name: c.name }), icon: <Search size={12} />, onClick: () => { const p = new URLSearchParams(searchParams); p.set('cat', c.name); setSearchParams(p); }, color: '#bfa24e' },
    { label: t('categories.all'), icon: <Package size={12} />, onClick: () => { const p = new URLSearchParams(searchParams); p.delete('cat'); setSearchParams(p); }, color: '#ccc' },
  ];

  return (
    <div className="min-h-screen" style={{ background: hasBg ? 'transparent' : bgColor, color: textColor, fontFamily, position: 'relative' }} onContextMenu={e => e.preventDefault()}>
      <VideoBackground />

      {/* ── Desktop fixed header ── */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-30 items-center justify-between px-6 py-3" style={{ background: hasBg ? 'rgba(10,10,10,0.85)' : bgColor, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${accentColor}15` }}>
        <div className="flex items-center gap-4 flex-1">
          <p className="text-sm font-extrabold" style={{ color: accentColor, fontFamily: "'Unbounded', sans-serif" }}>MISTER-DR</p>
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8c8578' }} />
            <input value={q} onChange={e => { const p = new URLSearchParams(searchParams); if (e.target.value) p.set('q', e.target.value); else p.delete('q'); setSearchParams(p); }} placeholder={t('search.placeholder')} className="w-full pl-9 pr-8 py-2 rounded-full text-xs" style={{ background: '#1a1a1a', color: textColor, border: `1px solid ${accentColor}15` }} />
            {q && <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('q'); setSearchParams(p); }} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#8c8578' }}><X size={12} /></button>}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          {customer && <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#1a1a1a' }}><User size={15} style={{ color: '#8c8578' }} /></button>}
          <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#1a1a1a' }}>
            <ShoppingCart size={15} style={{ color: count > 0 ? accentColor : '#8c8578' }} />
            {count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ background: accentColor, color: bgColor }}>{count}</span>}
          </button>
        </div>
      </div>

      {/* ── Hero / Builder layout ── */}
      {hasLayout ? (
        <StorefrontRenderer
          products={filtered}
          categories={categories}
          cat={cat}
          q={q}
          accentColor={accentColor}
          bgColor={bgColor}
          surfaceColor={surfaceColor}
          glass={glass}
          setDetailProduct={(p) => { setDetailProduct(p); setDetailQty(1); }}
        />
      ) : (
        <section className="relative px-4 pt-12 pb-16 md:pt-20 md:pb-24 text-center overflow-hidden cursor-pointer" onClick={scrollToProducts}>
          {theme.heroImage && (
            <div className="rounded-xl overflow-hidden mb-6 mx-auto relative group" style={{ maxWidth: 600, height: 160 }}>
              <img src={theme.heroImage} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <span className="text-xs font-bold px-4 py-2 rounded-full" style={{ background: accentColor, color: bgColor }}>{t('hero.see_products')}</span>
              </div>
            </div>
          )}
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs tracking-[0.3em] font-semibold mb-4 relative glow-active-text"
            style={{ color: accentColor, fontFamily: "'IBM Plex Mono', monospace" }}>
            {t('hero.tagline')}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold leading-tight max-w-3xl mx-auto relative">
            {theme.bannerText || t('hero.title')}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-4 text-sm md:text-base max-w-lg mx-auto relative" style={{ color: '#8c8578' }}>
            {theme.tagline || t('hero.subtitle')}
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 relative">
            <button onClick={e => { e.stopPropagation(); scrollToProducts(); }} className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-transform hover:scale-105" style={{ background: accentColor, color: bgColor }}>
              <ArrowDown size={15} /> {t('hero.see_products')}
            </button>
          </motion.div>
        </section>
      )}

      {/* ── Search (mobile) ── */}
      <div className="px-4 pb-4 md:hidden">
        <div className="relative max-w-lg mx-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8c8578' }} />
          <input value={q} onChange={e => { const p = new URLSearchParams(searchParams); if (e.target.value) p.set('q', e.target.value); else p.delete('q'); setSearchParams(p); }} placeholder={t('search.placeholder')} className="w-full pl-9 pr-8 py-2.5 rounded-full text-xs" style={{ background: '#1a1a1a', color: textColor, border: `1px solid ${accentColor}15` }} />
          {q && (
            <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('q'); setSearchParams(p); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#333', color: '#8c8578' }}>
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* ── Profile completion prompt ── */}
      {customer && (!customer.phone || !customer.addresses || (Array.isArray(customer.addresses) && customer.addresses.length === 0)) && (
        <div className="px-4 pb-4">
          <div className="max-w-7xl mx-auto">
            <div className="p-4 rounded-xl flex items-center justify-between gap-3" style={{ background: 'rgba(191,162,78,0.08)', border: '1px solid rgba(191,162,78,0.2)' }}>
              <div className="text-sm">
                <p className="font-semibold" style={{ color: '#bfa24e' }}>Complétez votre profil</p>
                <p className="text-xs mt-1" style={{ color: '#8c8578' }}>Ajoutez votre numéro de téléphone et adresse pour commander</p>
              </div>
              <button onClick={() => navigate('/profile')} className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0" style={{ background: '#bfa24e', color: '#0a0a0a' }}>
                Mon profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="px-4 pb-8">
          <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => { const p = new URLSearchParams(searchParams); p.delete('cat'); setSearchParams(p); }}
              className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all hover:scale-105"
              style={{ background: !cat ? accentColor : (glass ? 'rgba(255,255,255,0.04)' : surfaceColor), color: !cat ? bgColor : '#8c8578', border: `1px solid ${accentColor}20`, backdropFilter: glass ? 'blur(10px)' : 'none' }}
            >
              {t('categories.all')} ({products.length})
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => { const p = new URLSearchParams(searchParams); p.set('cat', c.name); setSearchParams(p); }}
                onContextMenu={(e) => { setCtxCat(c); catCtx(e); }}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 transition-all hover:scale-105"
                style={{ background: cat === c.name ? accentColor : (glass ? 'rgba(255,255,255,0.04)' : surfaceColor), color: cat === c.name ? bgColor : '#8c8578', border: `1px solid ${accentColor}20`, backdropFilter: glass ? 'blur(10px)' : 'none' }}
              >
                {c.imageUrl && <img src={c.imageUrl} alt="" className="w-4 h-4 rounded-full object-cover" />}
                {c.name}
                {categoryCounts[c.name] != null && <span className="text-[9px] opacity-60">({categoryCounts[c.name]})</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Active filter chip ── */}
      {(q || cat) && (
        <div className="px-4 pb-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="text-[10px]" style={{ color: '#8c8578' }}>{filtered.length} {t('products.results')}</span>
            {cat && (
              <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('cat'); setSearchParams(p); }} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${accentColor}15`, color: accentColor }}>
                {cat} <X size={9} />
              </button>
            )}
            {q && (
              <button onClick={() => { const p = new URLSearchParams(searchParams); p.delete('q'); setSearchParams(p); }} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${accentColor}15`, color: accentColor }}>
                "{q}" <X size={9} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Products grid ── */}
      <section ref={productsRef} className="px-4 pb-20 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="surface-card overflow-hidden animate-pulse">
                  <div className="aspect-square" style={{ background: surfaceColor }} />
                  <div className="p-3">
                    <div className="h-4 rounded mb-2" style={{ background: surfaceColor, width: '70%' }} />
                    <div className="h-3 rounded" style={{ background: surfaceColor, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package size={40} className="mx-auto mb-4" style={{ color: '#333' }} />
              <p className="text-sm mb-4" style={{ color: '#8c8578' }}>
                {q || cat ? t('products.empty_search') : t('products.empty')}
              </p>
              {(q || cat) && (
                <button onClick={() => { setSearchParams(new URLSearchParams()); }} className="px-5 py-2 rounded-full text-xs font-semibold" style={{ background: accentColor, color: bgColor }}>
                  {t('products.clear_search')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} id={p.id} catalogId={p.catalogId} erpProductId={p.erpProductId} customName={p.customName} customPrice={p.customPrice} name={p.name} price={p.salePrice} promoPrice={p.promoPrice} imageUrl={p.imageUrl} stockQty={p.stockQty} specs={p.specs} index={i} glass={glass} onClick={() => { setDetailProduct(p); setDetailQty(1); }} onContextMenu={(e) => { setCtxProduct(p); productCtx(e); }} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Mobile cart FAB ── */}
      {count > 0 && (
        <button onClick={() => setCartOpen(true)} className="fixed bottom-5 right-5 z-40 gold-btn flex items-center gap-2 px-5 py-3.5 rounded-full shadow-lg md:hidden">
          <span className="text-sm font-bold">{t('cart.fab')}</span>
          <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: bgColor, color: accentColor }}>{count}</span>
        </button>
      )}

      {/* ── Scroll to top ── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={scrollToTop} className="fixed bottom-5 left-5 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: surfaceColor, color: accentColor, border: `1px solid ${accentColor}30` }}>
            <ArrowUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Product Detail Modal ── */}
      <AnimatePresence>
        {detailProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setDetailProduct(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="w-full max-w-lg max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden relative flex flex-col" style={{ background: surfaceColor, border: `1px solid ${accentColor}25` }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setDetailProduct(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                <X size={16} />
              </button>
              <button onClick={handleShare} className="absolute top-3 right-12 z-10 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                <Share2 size={14} />
              </button>

              <div className="overflow-y-auto flex-1 overscroll-contain">
                {detailProduct.imageUrl ? (
                  <div className="w-full relative cursor-pointer group" style={{ background: bgColor }} onClick={() => setZoomImage(detailProduct.imageUrl)}>
                    <img src={detailProduct.imageUrl} alt={detailProduct.name} className="w-full transition-transform duration-300 group-hover:scale-[1.02]" style={{ display: 'block' }} />
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                      <ZoomIn size={14} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center py-16" style={{ background: bgColor }}>
                    <div className="w-24 h-24 rounded-3xl" style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}88 100%)`, opacity: 0.2 }} />
                  </div>
                )}

                <div className="p-5">
                  {detailProduct.category && (
                    <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: accentColor, fontFamily: "'IBM Plex Mono', monospace" }}>{(detailProduct.category as any).name?.toUpperCase()}</p>
                  )}
                  <h2 className="text-lg font-extrabold mb-1">{detailProduct.name}</h2>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xl font-bold" style={{ color: accentColor }}>{detailProduct.promoPrice ?? detailProduct.salePrice} DA</span>
                    {detailProduct.promoPrice != null && detailProduct.promoPrice < detailProduct.salePrice && (
                      <>
                        <span className="text-sm line-through" style={{ color: '#8c8578' }}>{detailProduct.salePrice} DA</span>
                        <span className="badge badge-danger text-xs">-{Math.round((1 - detailProduct.promoPrice / detailProduct.salePrice) * 100)}%</span>
                      </>
                    )}
                  </div>

                  {detailProduct.specs && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: '#555', fontFamily: "'IBM Plex Mono', monospace" }}>{t('products.specs')}</p>
                      <div className="rounded-xl p-3" style={{ background: bgColor }}>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{detailProduct.specs}</p>
                      </div>
                    </div>
                  )}

                  {detailProduct.customDescription && (
                    <p className="text-xs mb-4" style={{ color: '#8c8578' }}>{detailProduct.customDescription}</p>
                  )}
                </div>
              </div>

              <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${accentColor}15` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: '#1a1a1a' }}>
                    <button onClick={() => setDetailQty(q => Math.max(1, q - 1))} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#333', color: textColor }}><Minus size={12} /></button>
                    <span className="text-sm font-bold w-6 text-center">{detailQty}</span>
                    <button onClick={() => setDetailQty(q => q + 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#333', color: textColor }}><Plus size={12} /></button>
                  </div>
                  <p className="text-sm font-bold" style={{ color: accentColor }}>{(detailProduct.promoPrice ?? detailProduct.salePrice) * detailQty} DA</p>
                </div>
                <button
                  onClick={() => {
                    if (detailProduct.stockQty == null || detailProduct.stockQty > 0) {
                      addItem({
                        id: detailProduct.id, catalogId: detailProduct.catalogId, erpProductId: detailProduct.erpProductId || undefined,
                        customName: detailProduct.customName || undefined, customPrice: detailProduct.customPrice || undefined,
                        name: detailProduct.name, price: detailProduct.salePrice, promoPrice: detailProduct.promoPrice, imageUrl: detailProduct.imageUrl,
                      }, detailQty);
                      setDetailProduct(null);
                    }
                  }}
                  disabled={detailProduct.stockQty != null && detailProduct.stockQty <= 0}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: (detailProduct.stockQty == null || detailProduct.stockQty > 0) ? accentColor : '#333', color: (detailProduct.stockQty == null || detailProduct.stockQty > 0) ? bgColor : '#666', cursor: (detailProduct.stockQty == null && detailProduct.stockQty <= 0) ? 'not-allowed' : 'pointer' }}
                >
                  <Plus size={16} />
                  {detailProduct.stockQty != null && detailProduct.stockQty <= 0 ? t('products.out_of_stock') : t('products.add_to_cart')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Image zoom overlay ── */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.95)' }} onClick={() => setZoomImage(null)}>
            <button onClick={() => setZoomImage(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              <X size={18} />
            </button>
            <img src={zoomImage} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Context menus ── */}
      <ContextMenu items={ctxProduct ? getProductMenuItems(ctxProduct) : []} position={productMenu} onClose={closeProductCtx} />
      <ContextMenu items={ctxCat ? getCategoryMenuItems(ctxCat) : []} position={catMenu} onClose={closeCatCtx} />

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

import TemplateStorefront from '../components/TemplateStorefront';

export default function Storefront() {
  const [hasTemplate] = useState(() => !!localStorage.getItem('delivery_selected_template'));

  if (hasTemplate) {
    return <TemplateStorefront />;
  }

  return (
    <ThemeProvider>
      <StorefrontInner />
    </ThemeProvider>
  );
}
