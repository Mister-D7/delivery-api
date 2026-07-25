import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, MapPin, ChevronRight, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

const BRAND = { name: 'MISTER-DR', gold: '#bfa24e', goldGrad: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)' };

export default function Header() {
  const { count } = useCart();
  const { customer } = useCustomerAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50" style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(191,162,78,0.12)' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="text-lg md:text-xl font-extrabold tracking-wide" style={{ fontFamily: "'Unbounded', sans-serif", background: BRAND.goldGrad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {BRAND.name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: '#8c8578' }}>
          <Link to="/" className="hover:text-white transition-colors no-underline" style={{ color: 'inherit' }}>Boutique</Link>
          <Link to="/track" className="hover:text-white transition-colors no-underline" style={{ color: 'inherit' }}>{customer ? 'Mes commandes' : 'Suivre commande'}</Link>
          {customer ? (
            <Link to="/profile" className="hover:text-white transition-colors no-underline flex items-center gap-1" style={{ color: 'inherit' }}>
              <User size={13} /> {customer.name.split(' ')[0]}
            </Link>
          ) : (
            <Link to="/auth/login" className="hover:text-white transition-colors no-underline flex items-center gap-1" style={{ color: 'inherit' }}>
              <User size={13} /> Connexion
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field" style={{ width: 180, padding: '6px 12px', borderRadius: 9999, fontSize: 13 }} />
              <button type="button" onClick={() => { setSearchOpen(false); setSearch(''); }} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                <X size={14} />
              </button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid rgba(191,162,78,0.12)' }}>
              <Search size={15} />
            </button>
          )}
          <Link to="/checkout" className="relative w-9 h-9 rounded-full flex items-center justify-center no-underline" style={{ background: '#1a1a1a', border: '1px solid rgba(191,162,78,0.12)' }}>
            <ShoppingBag size={15} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: BRAND.gold, color: '#0a0a0a' }}>
                {count}
              </span>
            )}
          </Link>
          <Link to={customer ? '/profile' : '/auth/login'} className="md:hidden w-9 h-9 rounded-full flex items-center justify-center no-underline" style={{ background: '#1a1a1a', border: '1px solid rgba(191,162,78,0.12)' }}>
            <User size={15} style={{ color: customer ? BRAND.gold : '#8c8578' }} />
          </Link>
        </div>
      </div>
    </header>
  );
}
