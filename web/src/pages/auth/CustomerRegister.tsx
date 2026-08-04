import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useTranslation } from 'react-i18next';

export default function CustomerRegister() {
  const { t } = useTranslation('customer-auth');
  const { register } = useCustomerAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'google-customer-login' && e.data.token) {
        localStorage.setItem('delivery_customer_token', e.data.token);
        window.dispatchEvent(new Event('customer-login'));
        window.location.href = '/';
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const r = await fetch('/api/delivery/auth/google/customer');
      const { url } = await r.json();
      window.open(url, '_blank', 'width=500,height=600');
    } catch { toast.error('Google login unavailable'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) { toast.error(t('register.password')); return; }
    if (password.length < 6) { toast.error(t('register.password_mismatch')); return; }
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password: password.trim(), phone: phone.trim() || undefined });
      toast.success(t('register.submit'));
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('register.password_mismatch'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--pt-bg)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.3em] font-semibold mb-3" style={{ color: 'var(--pt-accent)', fontFamily: 'var(--pt-mono)' }}>COMPTE CLIENT</p>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--pt-font)' }}>{t('register.title')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="surface-card p-6 space-y-4">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--pt-muted2)' }}>{t('register.name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ahmed Benali" className="input-field" required />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--pt-muted2)' }}>{t('register.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Ex: ahmed@email.com" className="input-field" required />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--pt-muted2)' }}>{t('register.phone')}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 0555 12 34 56" className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--pt-muted2)' }}>{t('register.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 caractères" className="input-field" required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="gold-btn w-full py-3 text-sm font-bold flex items-center justify-center gap-2">
            <UserPlus size={15} /> {loading ? t('register.submitting') : t('register.submit')}
          </button>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'var(--pt-border-strong)' }} />
            <span className="text-[10px]" style={{ color: 'var(--pt-muted2)' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--pt-border-strong)' }} />
          </div>
          <button type="button" onClick={handleGoogleLogin} className="w-full py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2" style={{ background: '#fff', color: '#2a2a36', border: '1px solid #ddd' }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            S'inscrire avec Google
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--pt-muted)' }}>
          {t('register.has_account')}{' '}
          <Link to="/auth/login" className="font-semibold no-underline" style={{ color: 'var(--pt-accent)' }}>{t('register.login')}</Link>
        </p>
      </motion.div>
    </div>
  );
}
