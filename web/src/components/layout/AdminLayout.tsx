import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShieldCheck, Paintbrush, Settings, DollarSign, LayoutTemplate } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NotificationBell from '../NotificationBell';
import UserMenu from '../UserMenu';
import { AdminThemeProvider, useAdminTheme } from '../../context/AdminThemeContext';
import AdminBgVideo from '../theme/AdminBgVideo';
import api from '../../services/api';

function AdminLayoutInner() {
  const { t } = useTranslation('common');
  const { theme } = useAdminTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [logging, setLogging] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'google-login' && e.data.token) {
        localStorage.setItem('delivery_token', e.data.token);
        api.get('/auth/me').then(r => {
          const u = r.data.user;
          localStorage.setItem('delivery_user', JSON.stringify(u));
          setUser(u);
          window.dispatchEvent(new Event('auth-login'));
        }).catch(() => {});
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const NAV = [
    { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
    { to: '/admin/customize', label: t('nav.catalogue'), icon: Package },
    { to: '/admin/editor/full', label: t('nav.boutique'), icon: Paintbrush, newTab: true },
    { to: '/admin/builder', label: 'Builder', icon: LayoutTemplate, newTab: true },
    { to: '/admin/revenue', label: t('nav.revenue'), icon: DollarSign },
    { to: '/admin/settings', label: t('nav.settings'), icon: Settings },
  ];

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
      if (!res.ok) throw new Error(data.message || t('auth.invalid_credentials'));
      localStorage.setItem('delivery_token', data.token);
      localStorage.setItem('delivery_user', JSON.stringify(data.user));
      setUser(data.user);
      window.dispatchEvent(new Event('auth-login'));
    } catch (err: any) { setError(err.message); }
    finally { setLogging(false); }
  };

  const savedUser = (() => { try { return JSON.parse(localStorage.getItem('delivery_user') || 'null'); } catch { return null; } })();
  const currentUser = user || savedUser;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--admin-bg)' }}>
        <AdminBgVideo />
        <form onSubmit={handleLogin} className="surface-card p-8 w-full max-w-sm relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(191,162,78,0.15)' }}>
              <ShieldCheck size={20} style={{ color: '#bfa24e' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: "'Unbounded', sans-serif" }}>{t('auth.admin')}</h1>
              <p className="text-xs" style={{ color: '#8c8578' }}>{t('auth.management')}</p>
            </div>
          </div>
          {error && <p className="text-sm mb-4 p-3 rounded-lg" style={{ background: 'rgba(217,96,59,0.1)', color: '#d9603b' }}>{error}</p>}
          <input type="email" placeholder={t('auth.email')} value={email} onChange={e => setEmail(e.target.value)} className="input-field mb-3" required />
          <input type="password" placeholder={t('auth.password')} value={password} onChange={e => setPassword(e.target.value)} className="input-field mb-4" required />
          <button type="submit" disabled={logging} className="gold-btn w-full py-3 text-sm">
            {logging ? t('auth.logging_in') : t('auth.login')}
          </button>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(191,162,78,0.15)' }} />
            <span className="text-[10px]" style={{ color: '#555' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(191,162,78,0.15)' }} />
          </div>
          <button type="button" onClick={async () => {
            try {
              const r = await fetch('/api/delivery/auth/google');
              const { url } = await r.json();
              window.open(url, '_blank', 'width=500,height=600');
            } catch { setError('Google login unavailable'); }
          }} className="w-full py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2" style={{ background: '#fff', color: '#333', border: '1px solid #ddd' }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Se connecter avec Google
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--admin-bg-actual)' }}>
      <AdminBgVideo />
      {/* ── Desktop header ── */}
      <div className="hidden md:flex items-center px-4 py-2 border-b gap-3 no-print relative z-20" style={{ borderColor: 'var(--admin-border2)', background: 'color-mix(in srgb, var(--admin-bg) 85%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}>
        <Link to="/admin" className="text-sm font-extrabold tracking-wide no-underline" style={{ fontFamily: "'Unbounded', sans-serif", background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          MISTER-DR
        </Link>
        <div className="h-5 w-px" style={{ background: 'rgba(191,162,78,0.12)' }} />
        {NAV.map(n => {
          const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to.replace('/full',''));
          const cls = "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold no-underline transition-colors";
          const style = { background: active ? 'var(--admin-gold-bg)' : 'transparent', color: active ? 'var(--admin-gold)' : 'var(--admin-muted)' };
          return n.newTab ? (
            <a key={n.to} href={n.to} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
              <n.icon size={13} />{n.label}
            </a>
          ) : (
            <Link key={n.to} to={n.to} className={cls} style={style}>
              <n.icon size={13} />{n.label}
            </Link>
          );
        })}
        <div className="flex-1" />
        <NotificationBell />
        <div className="h-5 w-px" style={{ background: 'rgba(191,162,78,0.12)' }} />
        <UserMenu />
      </div>

      {/* ── Mobile header ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b no-print relative z-20" style={{ borderColor: 'var(--admin-border2)', background: 'color-mix(in srgb, var(--admin-bg) 85%, transparent)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)' }}>
        <Link to="/admin" className="text-sm font-extrabold no-underline" style={{ fontFamily: "'Unbounded', sans-serif", background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
          MISTER-DR
        </Link>
        <div className="flex gap-1 items-center">
          {NAV.map(n => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to.replace('/full',''));
            const cls = "px-2.5 py-1.5 rounded-full text-[10px] font-semibold no-underline";
            const style = { background: active ? 'var(--admin-gold-bg)' : 'transparent', color: active ? 'var(--admin-gold)' : 'var(--admin-muted)' };
            return n.newTab ? (
              <a key={n.to} href={n.to} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
                {n.label}
              </a>
            ) : (
              <Link key={n.to} to={n.to} className={cls} style={style}>
                {n.label}
              </Link>
            );
          })}
          <NotificationBell />
          <UserMenu />
        </div>
      </div>

      {/* ── Content ── */}
      <main className="p-4 md:p-6 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminLayoutInner />
    </AdminThemeProvider>
  );
}
