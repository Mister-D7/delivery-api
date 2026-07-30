import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

type Props = { open: boolean; onClose: () => void };

export default function CartSheet({ open, onClose }: Props) {
  const { items, updateQty, removeItem, total, count } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation('cart');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
            style={{ background: '#111', borderLeft: '1px solid rgba(191,162,78,0.12)' }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(191,162,78,0.12)' }}>
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} style={{ color: '#bfa24e' }} />
                <span className="text-sm font-bold">{t('title')} ({count})</span>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {items.length === 0 && (
                <div className="text-center py-12" style={{ color: '#8c8578' }}>
                  <ShoppingBag size={32} className="mx-auto mb-3" style={{ opacity: 0.3 }} />
                  <p className="text-sm">{t('empty')}</p>
                </div>
              )}
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1a1a1a' }}>
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#222' }}>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#bfa24e' }}>{item.promoPrice ?? item.price} DA</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#222' }}><Minus size={10} /></button>
                    <span className="text-xs w-5 text-center font-medium">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#222' }}><Plus size={10} /></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="ml-1"><Trash2 size={13} style={{ color: '#d9603b' }} /></button>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t" style={{ borderColor: 'rgba(191,162,78,0.12)' }}>
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-semibold">{t('total')}</span>
                  <span className="text-lg font-bold" style={{ color: '#bfa24e' }}>{total} DA</span>
                </div>
                <button onClick={() => { onClose(); navigate('/checkout'); }} className="gold-btn w-full py-3 text-sm">
                  {t('checkout')}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
