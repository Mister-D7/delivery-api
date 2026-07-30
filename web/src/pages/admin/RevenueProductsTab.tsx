import { useState } from 'react';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { ProductCost } from './revenueTypes';
import { DA } from './revenueUtils';

type Props = {
  products: ProductCost[];
  onUpdate: () => void;
  t: (key: string) => string;
};

export default function RevenueProductsTab({ products, onUpdate, t }: Props) {
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editCost, setEditCost] = useState('');
  const [editSale, setEditSale] = useState('');
  const [editMargin, setEditMargin] = useState('');

  const saveProduct = async (id: string) => {
    try {
      const cost = Number(editCost) || 0;
      const sale = Number(editSale) || 0;
      await api.put(`/revenue/products/${id}`, { costPrice: cost, salePrice: sale });
      toast.success(t('products.title'));
      setEditingProduct(null);
      onUpdate();
    } catch { toast.error(t('products.name')); }
  };

  const handleCostChange = (val: string) => {
    setEditCost(val);
    const cost = Number(val) || 0;
    const margin = Number(editMargin) || 0;
    if (margin > 0 && cost > 0) setEditSale(String(Math.round(cost * (1 + margin / 100))));
  };

  const handleMarginChange = (val: string) => {
    setEditMargin(val);
    const cost = Number(editCost) || 0;
    const margin = Number(val) || 0;
    if (cost > 0) setEditSale(String(Math.round(cost * (1 + margin / 100))));
  };

  const handleSaleChange = (val: string) => {
    setEditSale(val);
    const cost = Number(editCost) || 0;
    const sale = Number(val) || 0;
    if (cost > 0 && sale > 0) setEditMargin(String(Math.round(((sale - cost) / cost) * 100)));
  };

  if (products.length === 0) return (
    <div className="text-center py-12">
      <Package size={32} className="mx-auto mb-3" style={{ color: 'var(--admin-surface3)' }} />
      <p className="text-xs" style={{ color: 'var(--admin-muted2)' }}>{t('products.name')}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold no-print" style={{ color: 'var(--admin-muted)' }}>{t('products.title')}</p>
      <div className="space-y-2">
        {products.map(p => {
          const marginP = p.costPrice > 0 ? Math.round(((p.salePrice - p.costPrice) / p.costPrice) * 100) : 0;
          return (
            <div key={p.id} className="surface-card p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold truncate">{p.name}</p>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>{t('products.cost_price')}: <span style={{ color: 'var(--admin-danger)' }}>{DA(p.costPrice)}</span></span>
                    <span className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>{t('products.sale_price')}: <span style={{ color: 'var(--admin-gold)' }}>{DA(p.salePrice)}</span></span>
                    <span className="text-[9px]" style={{ color: 'var(--admin-muted2)' }}>{t('products.margin')}: <span style={{ color: p.margin >= 0 ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{DA(p.margin)} ({marginP}%)</span></span>
                  </div>
                </div>
                <button onClick={() => { setEditingProduct(editingProduct === p.id ? null : p.id); setEditCost(String(p.costPrice)); setEditSale(String(p.salePrice)); setEditMargin(String(marginP)); }}
                  className="px-2 py-1 rounded-lg text-[9px] font-semibold no-print" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-gold)' }}>
                  {t('products.edit')}
                </button>
              </div>
              {editingProduct === p.id && (
                <div className="mt-3 p-3 rounded-lg no-print" style={{ background: 'var(--admin-bg)' }}>
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>{t('products.cost_price')}</label>
                      <input type="number" value={editCost} onChange={e => handleCostChange(e.target.value)} className="input-field text-xs w-full" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>{t('products.margin_percent')}</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={editMargin} onChange={e => handleMarginChange(e.target.value)} className="input-field text-xs w-full" />
                        <span className="text-[10px] font-bold" style={{ color: 'var(--admin-gold)' }}>%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>{t('products.sale_price')}</label>
                      <input type="number" value={editSale} onChange={e => handleSaleChange(e.target.value)} className="input-field text-xs w-full" />
                    </div>
                  </div>
                  <button onClick={() => saveProduct(p.id)} className="gold-btn px-4 py-1.5 text-[10px] font-bold rounded-lg w-full">{t('products.save')}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
