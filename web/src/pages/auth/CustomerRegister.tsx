import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

export default function CustomerRegister() {
  const { register } = useCustomerAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) { toast.error('Remplissez les champs obligatoires.'); return; }
    if (password.length < 6) { toast.error('Mot de passe trop court (6 min).'); return; }
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password: password.trim(), phone: phone.trim() || undefined });
      toast.success('Compte créé ! Bienvenue.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.3em] font-semibold mb-3" style={{ color: '#bfa24e', fontFamily: "'IBM Plex Mono', monospace" }}>COMPTE CLIENT</p>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Unbounded', sans-serif" }}>Créer un compte</h1>
        </div>

        <form onSubmit={handleSubmit} className="surface-card p-6 space-y-4">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Nom complet</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ahmed Benali" className="input-field" required />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Ex: ahmed@email.com" className="input-field" required />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Numéro de téléphone (optionnel)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 0555 12 34 56" className="input-field" />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: '#555' }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 caractères" className="input-field" required minLength={6} />
          </div>
          <button type="submit" disabled={loading} className="gold-btn w-full py-3 text-sm font-bold flex items-center justify-center gap-2">
            <UserPlus size={15} /> {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#8c8578' }}>
          Déjà un compte ?{' '}
          <Link to="/auth/login" className="font-semibold no-underline" style={{ color: '#bfa24e' }}>Se connecter</Link>
        </p>
      </motion.div>
    </div>
  );
}
