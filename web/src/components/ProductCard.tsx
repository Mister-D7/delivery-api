import { motion } from 'framer-motion';
import { ShoppingBag, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';

type Props = {
  id: string;
  catalogId?: string | null;
  erpProductId?: string | null;
  customName?: string | null;
  customPrice?: number | null;
  name: string;
  price: number;
  promoPrice?: number | null;
  imageUrl?: string | null;
  stockQty?: number;
  specs?: string | null;
  index?: number;
  onClick?: () => void;
};

export default function ProductCard({ id, catalogId, erpProductId, customName, customPrice, name, price, promoPrice, imageUrl, stockQty, specs, index = 0, onClick }: Props) {
  const { addItem } = useCart();
  const finalPrice = promoPrice ?? price;
  const hasDiscount = promoPrice != null && promoPrice < price;
  const inStock = stockQty == null || stockQty > 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inStock) {
      addItem({ id, catalogId: catalogId || undefined, erpProductId: erpProductId || undefined, customName: customName || undefined, customPrice: customPrice || undefined, name, price, promoPrice, imageUrl });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="surface-card overflow-hidden flex flex-col group cursor-pointer"
      style={{ transition: 'border-color 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(191,162,78,0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(191,162,78,0.16)'; e.currentTarget.style.transform = 'none'; }}
      onClick={onClick}
    >
      <div className="relative aspect-square flex items-center justify-center overflow-hidden" style={{ background: '#0e0e0e' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl" style={{ background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', opacity: 0.3 }} />
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 badge badge-danger">
            -{Math.round((1 - promoPrice! / price) * 100)}%
          </span>
        )}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10,10,10,0.7)' }}>
            <span className="text-xs font-semibold" style={{ color: '#d9603b' }}>Rupture de stock</span>
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold mb-2 line-clamp-2" style={{ minHeight: 40 }}>{name}</h3>
        {specs && (
          <p className="text-[10px] mb-2 truncate" style={{ color: '#555' }}>{specs}</p>
        )}
        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="text-base font-bold" style={{ color: '#bfa24e' }}>{finalPrice} DA</span>
            {hasDiscount && (
              <span className="text-xs line-through ml-2" style={{ color: '#8c8578' }}>{price} DA</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: inStock ? 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)' : '#333', color: inStock ? '#0a0a0a' : '#666', cursor: inStock ? 'pointer' : 'not-allowed' }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
