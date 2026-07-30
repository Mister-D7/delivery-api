import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, LogOut, Settings, Globe, ChevronDown, Moon, Sun, Upload, X } from 'lucide-react';
import { isRTL } from '../i18n';
import { useAdminTheme } from '../context/AdminThemeContext';
import api from '../services/api';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

export default function UserMenu() {
  const { t, i18n } = useTranslation('user-menu');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setMode, setBg } = useAdminTheme();
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [bgUploading, setBgUploading] = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem('delivery_user') || 'null'); } catch { return null; } })();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    window.dispatchEvent(new Event('auth-login'));
    navigate('/');
  };

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : user?.email?.[0]?.toUpperCase() || 'A';
  const isRtl = isRTL(i18n.language);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 p-1 rounded-full transition-colors" style={{ background: open ? 'var(--admin-gold-bg)' : 'transparent' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #d4b96a 0%, #9c7a3f 100%)', color: '#0a0a0a' }}>
          {initials}
        </div>
        <ChevronDown size={12} style={{ color: 'var(--admin-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-64 rounded-xl overflow-hidden shadow-xl z-50" style={{ background: 'var(--admin-surface2)', border: '1px solid var(--admin-border2)', [isRtl ? 'left' : 'right']: 0 }}>
          {user && (
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border2)' }}>
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--admin-text)' }}>{user.name || user.email}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--admin-muted)' }}>{user.email}</p>
            </div>
          )}

          <div className="py-1">
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={12} style={{ color: 'var(--admin-muted)' }} />
                <span className="text-[10px] font-semibold" style={{ color: 'var(--admin-muted)' }}>{t('language')}</span>
              </div>
              <div className="flex gap-1">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => i18n.changeLanguage(lang.code)}
                    className="px-2 py-1 rounded text-[10px] font-semibold transition-colors"
                    style={{
                      background: i18n.language === lang.code ? 'var(--admin-gold-bg)' : 'transparent',
                      color: i18n.language === lang.code ? 'var(--admin-gold)' : 'var(--admin-muted)',
                    }}>
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px mx-3" style={{ background: 'var(--admin-border2)' }} />

            <div className="px-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                {theme.mode === 'dark' ? <Moon size={12} style={{ color: 'var(--admin-muted)' }} /> : <Sun size={12} style={{ color: 'var(--admin-muted)' }} />}
                <span className="text-[10px] font-semibold" style={{ color: 'var(--admin-muted)' }}>Theme</span>
              </div>
              <div className="flex gap-1 mb-2">
                <button onClick={() => setMode('dark')}
                  className="flex items-center gap-1 flex-1 py-1.5 rounded text-[9px] font-semibold transition-colors"
                  style={{ background: theme.mode === 'dark' ? 'var(--admin-gold-bg)' : 'transparent', color: theme.mode === 'dark' ? 'var(--admin-gold)' : 'var(--admin-muted)', border: `1px solid ${theme.mode === 'dark' ? 'rgba(191,162,78,0.25)' : 'var(--admin-border3)'}` }}>
                  <Moon size={10} /> Dark
                </button>
                <button onClick={() => setMode('light')}
                  className="flex items-center gap-1 flex-1 py-1.5 rounded text-[9px] font-semibold transition-colors"
                  style={{ background: theme.mode === 'light' ? 'var(--admin-gold-bg)' : 'transparent', color: theme.mode === 'light' ? 'var(--admin-gold)' : 'var(--admin-muted)', border: `1px solid ${theme.mode === 'light' ? 'rgba(191,162,78,0.25)' : 'var(--admin-border3)'}` }}>
                  <Sun size={10} /> Light
                </button>
              </div>
              {theme.mode === 'dark' && (
                <div className="space-y-1.5 mt-2 pt-2" style={{ borderTop: '1px solid var(--admin-border2)' }}>
                  <p className="text-[9px] font-semibold" style={{ color: 'var(--admin-muted)' }}>Arrière-plan (image/vidéo)</p>
                  <input ref={bgFileRef} type="file" accept={theme.bg.type === 'video' ? 'video/*' : 'image/*'} className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBgUploading(true);
                      try {
                        const fd = new FormData();
                        const fieldName = theme.bg.type === 'video' ? 'video' : 'image';
                        const endpoint = theme.bg.type === 'video' ? '/upload/video' : '/upload/image';
                        fd.append(fieldName, file);
                        const r = await api.post(endpoint, fd);
                        setBg({ ...theme.bg, value: r.data.url });
                      } catch (err: any) {
                        alert(err?.response?.data?.error || err.message || 'Upload failed');
                      }
                      setBgUploading(false);
                      if (bgFileRef.current) bgFileRef.current.value = '';
                    }} />
                  <button onClick={() => bgFileRef.current?.click()} disabled={bgUploading}
                    className="w-full py-1.5 rounded text-[9px] font-semibold flex items-center justify-center gap-1 disabled:opacity-40"
                    style={{ background: 'var(--admin-bg)', color: theme.bg.value ? 'var(--admin-gold)' : 'var(--admin-muted)', border: '1px solid var(--admin-border3)' }}>
                    <Upload size={10} /> {bgUploading ? '...' : theme.bg.value ? 'Changer' : 'Image ou vidéo'}
                  </button>
                  {theme.bg.value && (
                    <div className="relative rounded overflow-hidden" style={{ height: 40 }}>
                      {theme.bg.type === 'video' ? (
                        <video src={theme.bg.value} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                      ) : (
                        <img src={theme.bg.value} alt="" className="w-full h-full object-cover" />
                      )}
                      <button onClick={() => setBg({ ...theme.bg, value: '' })}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                        <X size={8} />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-1">
                    {(['image', 'video'] as const).map(bt => (
                      <button key={bt} onClick={() => setBg({ type: bt, value: theme.bg.value })}
                        className="flex-1 py-1 rounded text-[8px] font-semibold"
                        style={{ background: theme.bg.type === bt ? 'var(--admin-gold-bg)' : 'transparent', color: theme.bg.type === bt ? 'var(--admin-gold)' : 'var(--admin-muted)' }}>
                        {bt === 'image' ? 'Image' : 'Vidéo'}
                      </button>
                    ))}
                  </div>
                  <input value={theme.bg.value} onChange={e => setBg({ ...theme.bg, value: e.target.value })}
                    placeholder="URL..." className="text-[8px] font-mono w-full bg-transparent border-0 outline-none" style={{ color: 'var(--admin-muted2)' }} />
                </div>
              )}
            </div>

            <div className="h-px mx-3" style={{ background: 'var(--admin-border2)' }} />

            <button onClick={() => { navigate('/admin/settings'); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--admin-muted)' }}>
              <Settings size={13} /> {t('settings')}
            </button>

            <button onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--admin-danger)' }}>
              <LogOut size={13} /> {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
