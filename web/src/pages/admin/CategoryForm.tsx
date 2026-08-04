import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', f);
      const r = await api.post('/upload/image', fd);
      const url = r.data?.url;
      if (url) {
        setImageUrl(url);
        toast.success('Image téléversée');
      } else {
        toast.error('Téléversement échoué');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors du téléversement');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Nom de la catégorie requis');
    setSaving(true);
    try {
      const payload = { name: name.trim(), imageUrl: imageUrl.trim() || null, storeType: storeType || initial?.storeType || 'tech' };
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
            <label className="text-[10px] font-semibold block mb-1" style={{ color: 'var(--admin-muted)' }}>Image de la catégorie</label>
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
                style={{ background: 'var(--admin-gold-bg)', color: 'var(--admin-gold)' }}>
                <Upload size={14} /> {uploading ? 'Envoi...' : 'Téléverser'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
              <span className="text-[10px]" style={{ color: 'var(--admin-muted2)' }}>ou</span>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL de l'image"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border2)' }} />
            </div>
            {imageUrl && (
              <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border2)' }}>
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                <button onClick={() => setImageUrl('')} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                  <X size={10} />
                </button>
              </div>
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
