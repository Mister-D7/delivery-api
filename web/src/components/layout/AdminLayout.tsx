import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, ShieldCheck, Paintbrush, Settings, DollarSign } from 'lucide-react';
import NotificationBell from '../NotificationBell';

const NAV = [
  { to: '/admin', label: 'Commandes', icon: LayoutDashboard, exact: true },
  { to: '/admin/customize', label: 'Catalogue', icon: Package },
  { to: '/admin/editor', label: 'Boutique', icon: Paintbrush },
  { to: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [logging, setLogging] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    setError('');
    try {
      const res = await fetch('/api/delivery/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Identifiants incorrects');
      localStorage.setItem('delivery_token', data.token);
      localStorage.setItem('delivery_user', JSON.stringify(data.user));
      setUser(data.user);
      window.dispatchEvent(new Event('auth-login'));
    } catch (err: any) { setError(err.message); }
    finally { setLogging(false); }
  };

  const logout = () => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    setUser(null);
    window.dispatchEvent(new Event('auth-login'));
    navigate('/');
  };

  const savedUser = (() => { try { return JSON.parse(localStorage.getItem('delivery_user') || 'null'); } catch { return null; } })();
  const currentUser = user || savedUser;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
        <form onSubmit={handleLogin} className="surface-card p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(191,162,78,0.15)' }}>
              <ShieldCheck size={20} style={{ color: '#bfa24e' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: "'Unbounded', sans-serif" }}>Admin</h1>
              <p className="text-xs" style={{ color: '#8c8578' }}>Gestion de la livraison</p>
            </div>
          </div>
          {error && <p className="text-sm mb-4 p-3 rounded-lg" style={{ background: 'rgba(217,96,59,0.1)', color: '#d9603b' }}>{error}</p>}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input-field mb-3" required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="input-field mb-4" required />
          <button type="submit" disabled={logging} className="gold-btn w-full py-3 text-sm">
            {logging ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* ── Desktop header ── */}
      <div className="hidden md:flex items-center px-4 py-2 border-b gap-3 no-print" style={{ borderColor: 'rgba(191,162,78,0.12)', background: '#111' }}>
        <Link to="/admin" className="text-sm font-extrabold tracking-wide no-underline" style={{ fontFamily: "'Unbounded', sans-serif", background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          MISTER-DR
        </Link>
        <div className="h-5 w-px" style={{ background: 'rgba(191,162,78,0.12)' }} />
        {NAV.map(n => {
          const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold no-underline transition-colors" style={{ background: active ? 'rgba(191,162,78,0.12)' : 'transparent', color: active ? '#bfa24e' : '#8c8578' }}>
              <n.icon size={13} />{n.label}
            </Link>
          );
        })}
        <div className="flex-1" />
        <NotificationBell />
        <div className="h-5 w-px" style={{ background: 'rgba(191,162,78,0.12)' }} />
        <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ color: '#8c8578' }}>
          <LogOut size={13} /> Déconnexion
        </button>
      </div>

      {/* ── Mobile header ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b no-print" style={{ borderColor: 'rgba(191,162,78,0.12)', background: '#111' }}>
        <Link to="/admin" className="text-sm font-extrabold no-underline" style={{ fontFamily: "'Unbounded', sans-serif", background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          MISTER-DR
        </Link>
        <div className="flex gap-1 items-center">
          {NAV.map(n => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className="px-2.5 py-1.5 rounded-full text-[10px] font-semibold no-underline" style={{ background: active ? 'rgba(191,162,78,0.12)' : 'transparent', color: active ? '#bfa24e' : '#8c8578' }}>
                {n.label}
              </Link>
            );
          })}
          <NotificationBell />
        </div>
      </div>

      {/* ── Content ── */}
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
