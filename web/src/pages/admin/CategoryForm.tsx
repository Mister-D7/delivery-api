import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function CategoryForm({ initial, storeType, onClose, onSaved }: {
  initial?: any;
  storeType?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || initial?.image_url || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Nom de la catégorie requis');
    setSaving(true);
    try {
      const payload = { name: name.trim(), imageUrl: imageUrl.trim() || null, storeType: storeType || initial?.storeType || 'general' };
      if (initial?.id) {
        await api.put(`/categories/${initial.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      toast.success(initial?.id ? 'Catégorie modifiée' : 'Catégorie ajoutée');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl" style={{ background: 'var(--admin-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--admin-border2)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--admin-gold)' }}>{initial?.id ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--admin-muted)' }}><X size={16} /></button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Nom de la catégorie *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: PC Gaming, Consoles, Headsets..."
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
          </div>

          <div>
            <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Image (URL)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
            {imageUrl && (
              <img src={imageUrl} alt="preview" className="mt-2 w-20 h-20 rounded-xl object-cover" style={{ border: '1px solid var(--admin-border2)' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--admin-border2)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ color: 'var(--admin-muted)' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving}
            className="gold-btn px-5 py-2 rounded-lg text-xs font-bold">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
