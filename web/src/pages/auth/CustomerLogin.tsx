import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

export default function CustomerLogin() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Remplissez tous les champs.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      toast.success('Bienvenue !');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Identifiants invalides');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.3em] font-semibold mb-3" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>COMPTE CLIENT</p>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>Se connecter</h1>
        </div>

        <form onSubmit={handleSubmit} className="surface-card p-6 space-y-4">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Ex: ahmed@email.com" className="input-field" required />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Votre mot de passe" className="input-field" required />
          </div>
          <button type="submit" disabled={loading} className="gold-btn w-full py-3 text-sm font-bold flex items-center justify-center gap-2">
            <LogIn size={15} /> {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#8c8578' }}>
          Pas de compte ?{' '}
          <Link to="/auth/register" className="font-semibold no-underline" style={{ color: '#bfa24e' }}>S'inscrire</Link>
        </p>
      </motion.div>
    </div>
  );
}
