import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2, Upload, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import type { ThemeSettings, Category, SelectedElement } from './editorTypes';
import { FONTS } from './editorTypes';

type Props = {
  rightOpen: boolean;
  selected: SelectedElement | null; setSelected: (el: SelectedElement | null) => void;
  settings: ThemeSettings; setSettings: (s: ThemeSettings | ((prev: ThemeSettings) => ThemeSettings)) => void;
  editForm: { name: string; salePrice: string; stockQty: string; categoryId: string; imageUrl: string; promoPrice: string; specs: string; costPrice: string; marginPercent: string };
  setEditForm: (f: any) => void;
  orderedCategories: Category[];
  saveEdit: () => void;
  setConfirmDelete: (d: { type: 'product' | 'category'; id: string; name: string } | null) => void;
};

export default function EditorSidebarRight(props: Props) {
  const { rightOpen, selected, setSelected, settings, setSettings, editForm, setEditForm, orderedCategories, saveEdit, setConfirmDelete } = props;

  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const editFileRef = useRef<HTMLInputElement>(null);

  return (
    <AnimatePresence>
      {rightOpen && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 overflow-hidden border-l" style={{ borderColor: 'var(--admin-border3)', background: 'var(--admin-surface)' }}>
          <div className="w-[300px] h-full overflow-y-auto">
            {selected ? (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] tracking-widest font-bold" style={{ color: 'var(--admin-muted2)' }}>PROPRIÉTÉS</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--admin-gold)' }}>{selected.type === 'product' ? 'Produit' : selected.type === 'category' ? 'Catégorie' : selected.type === 'section' ? 'Section' : 'Thème'}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1 rounded-lg" style={{ color: 'var(--admin-muted2)' }}><X size={14} /></button>
                </div>

                <div className="h-px" style={{ background: 'var(--admin-border2)' }} />

                {selected.type === 'product' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>NOM</label>
                      <input value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className="input-field text-xs w-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>PRIX ACHAT (DA)</label>
                        <input type="number" value={editForm.costPrice} onChange={e => { const cost = e.target.value; setEditForm((f: any) => { const margin = Number(f.marginPercent) || 0; const c = Number(cost) || 0; const newSale = margin > 0 && c > 0 ? String(Math.round(c * (1 + margin / 100))) : f.salePrice; return { ...f, costPrice: cost, salePrice: newSale }; }); }} className="input-field text-xs w-full" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>MARGE %</label>
                        <div className="relative">
                          <input type="number" value={editForm.marginPercent} onChange={e => { const mp = e.target.value; setEditForm((f: any) => { const cost = Number(f.costPrice) || 0; const m = Number(mp) || 0; const newSale = cost > 0 && m > 0 ? String(Math.round(cost * (1 + m / 100))) : f.salePrice; return { ...f, marginPercent: mp, salePrice: newSale }; }); }} className="input-field text-xs w-full pr-5" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>PRIX VENTE (DA)</label>
                        <input type="number" value={editForm.salePrice} onChange={e => { const sale = e.target.value; setEditForm((f: any) => { const cost = Number(f.costPrice) || 0; const s = Number(sale) || 0; const newMp = cost > 0 && s > 0 ? String(Math.round(((s - cost) / cost) * 100)) : ''; return { ...f, salePrice: sale, marginPercent: newMp }; }); }} className="input-field text-xs w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>PROMO (DA)</label>
                      <input type="number" value={editForm.promoPrice} onChange={e => setEditForm((f: any) => ({ ...f, promoPrice: e.target.value }))} placeholder="—" className="input-field text-xs w-full" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>STOCK</label>
                      <input type="number" value={editForm.stockQty} onChange={e => setEditForm((f: any) => ({ ...f, stockQty: e.target.value }))} className="input-field text-xs w-full" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>CATÉGORIE</label>
                      <select value={editForm.categoryId} onChange={e => setEditForm((f: any) => ({ ...f, categoryId: e.target.value }))} className="input-field text-xs w-full">
                        <option value="">Sans catégorie</option>
                        {orderedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>IMAGE</label>
                      <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0] || null; setEditImageFile(file); if (file) { const reader = new FileReader(); reader.onload = ev => setEditImagePreview(ev.target?.result as string); reader.readAsDataURL(file); } else setEditImagePreview(''); }} />
                      <div className="flex gap-1">
                        <button onClick={() => editFileRef.current?.click()} className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1" style={{ background: 'var(--admin-bg)', color: editImageFile ? 'var(--admin-gold)' : 'var(--admin-muted2)', border: '1px solid var(--admin-border3)' }}>
                          <Upload size={9} /> {editImageFile ? 'Image changée' : 'Changer l\'image'}
                        </button>
                      </div>
                    </div>
                    {(editImagePreview || editForm.imageUrl) && (
                      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--admin-bg)', height: 100 }}>
                        <img src={editImagePreview || editForm.imageUrl} alt="" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>SPÉCIFICATIONS</label>
                      <textarea value={editForm.specs} onChange={e => setEditForm((f: any) => ({ ...f, specs: e.target.value }))} placeholder="Ex: Intel Core i5 13ème Gen, 4.5GHz, 16GB RAM DDR5..." rows={3} className="input-field text-[10px] w-full resize-none" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveEdit} className="gold-btn flex-1 py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1"><Check size={11} /> Appliquer</button>
                      <button onClick={() => setSelected(null)} className="px-3 py-2 text-[11px] rounded-lg" style={{ background: 'var(--admin-surface2)', color: 'var(--admin-muted)' }}>Annuler</button>
                    </div>
                    <div className="h-px" style={{ background: 'var(--admin-border2)' }} />
                    <button onClick={() => setConfirmDelete({ type: 'product', id: selected.id, name: selected.data.name })} className="w-full py-2 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1" style={{ background: 'var(--admin-danger-bg)', color: 'var(--admin-danger)' }}>
                      <Trash2 size={11} /> Supprimer de la boutique
                    </button>
                  </div>
                )}

                {selected.type === 'category' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>NOM</label>
                      <input value={selected.data.name} onChange={e => { const v = { ...selected.data, name: e.target.value }; setSelected({ ...selected, data: v }); }} className="input-field text-xs w-full" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted2)' }}>IMAGE URL</label>
                      <input value={(selected.data as any).imageUrl || ''} onChange={e => { const v = { ...selected.data, imageUrl: e.target.value }; setSelected({ ...selected, data: v }); }} placeholder="https://..." className="input-field text-xs w-full" />
                    </div>
                    {(selected.data as any).imageUrl && (
                      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--admin-bg)', height: 80 }}>
                        <img src={(selected.data as any).imageUrl} alt="" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                    <button onClick={() => { setConfirmDelete({ type: 'category', id: selected.id, name: selected.data.name }); }} className="w-full py-2 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1" style={{ background: 'var(--admin-danger-bg)', color: 'var(--admin-danger)' }}>
                      <Trash2 size={11} /> Supprimer la catégorie
                    </button>
                  </div>
                )}

                {selected.type === 'section' && (
                  <div className="text-center py-8">
                    <p className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>Section HTML ajoutée via le panneau Sections. Cliquez sur la corbeille dans l'aperçu pour la supprimer.</p>
                  </div>
                )}

                {selected.type === 'theme' && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>IDENTITÉ</p>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted3)' }}>Nom boutique</label>
                      <input value={settings.storeName} onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))} className="input-field text-xs w-full" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted3)' }}>Tagline</label>
                      <input value={settings.tagline} onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))} className="input-field text-xs w-full" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted3)' }}>Texte hero</label>
                      <input value={settings.bannerText} onChange={e => setSettings(s => ({ ...s, bannerText: e.target.value }))} className="input-field text-xs w-full" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold block mb-1" style={{ color: 'var(--admin-muted3)' }}>Image hero URL</label>
                      <input value={settings.heroImage} onChange={e => setSettings(s => ({ ...s, heroImage: e.target.value }))} placeholder="https://..." className="input-field text-xs w-full" />
                    </div>
                    <div className="h-px" style={{ background: 'var(--admin-border2)' }} />
                    <p className="text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>POLICE</p>
                    <div className="grid grid-cols-3 gap-1">
                      {FONTS.map(f => (
                        <button key={f.value} onClick={() => setSettings(s => ({ ...s, fontFamily: f.value }))} className="py-1.5 rounded-lg text-[9px]" style={{ background: settings.fontFamily === f.value ? 'var(--admin-border2)' : 'var(--admin-bg)', color: settings.fontFamily === f.value ? 'var(--admin-gold)' : 'var(--admin-muted)', fontFamily: f.value }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="h-px" style={{ background: 'var(--admin-border2)' }} />
                    <p className="text-[10px] font-bold" style={{ color: 'var(--admin-muted2)' }}>COULEURS</p>
                    {([['bgColor', 'Fond'], ['surfaceColor', 'Cartes'], ['textColor', 'Texte'], ['accentColor', 'Accent'], ['glowColor', 'Glow']] as const).map(([k, label]) => (
                      <div key={k} className="flex items-center gap-2">
                        <input type="color" value={settings[k]} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))} className="w-7 h-7 rounded-lg border-0 cursor-pointer" />
                        <span className="text-[10px] flex-1" style={{ color: 'var(--admin-muted)' }}>{label}</span>
                        <input value={settings[k]} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))} className="text-[9px] font-mono w-16 text-right bg-transparent border-0 outline-none" style={{ color: 'var(--admin-muted2)' }} />
                      </div>
                    ))}
                    <div className="h-px" style={{ background: 'var(--admin-border2)' }} />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>Glow</span>
                      <button onClick={() => setSettings(s => ({ ...s, glowEnabled: !s.glowEnabled }))}>
                        {settings.glowEnabled ? <ToggleRight size={22} style={{ color: settings.accentColor }} /> : <ToggleLeft size={22} style={{ color: 'var(--admin-surface3)' }} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>Animations</span>
                      <button onClick={() => setSettings(s => ({ ...s, animationEnabled: !s.animationEnabled }))}>
                        {settings.animationEnabled ? <ToggleRight size={22} style={{ color: settings.accentColor }} /> : <ToggleLeft size={22} style={{ color: 'var(--admin-surface3)' }} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: 'var(--admin-muted)' }}>Effet Glass</span>
                      <button onClick={() => setSettings(s => ({ ...s, glassEnabled: !s.glassEnabled }))}>
                        {settings.glassEnabled ? <ToggleRight size={22} style={{ color: settings.accentColor }} /> : <ToggleLeft size={22} style={{ color: 'var(--admin-surface3)' }} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <Layers size={32} style={{ color: 'var(--admin-surface3)' }} />
                <p className="text-xs font-semibold mt-3 mb-1" style={{ color: 'var(--admin-muted2)' }}>Aucun élément sélectionné</p>
                <p className="text-[10px]" style={{ color: 'var(--admin-muted3)' }}>Cliquez sur un produit, une catégorie ou le hero dans l'aperçu pour modifier ses propriétés</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
