import { useEffect, useRef, useState } from 'react';
import { useStorefront, storeTypeForTheme } from '../lib/storefront';
import type { Product } from '../lib/data';
import '../styles/islands.css';

interface MenuState {
  x: number;
  y: number;
  kind: 'text' | 'product' | '3d' | 'category';
  target: HTMLElement;
  textKey?: string;
  categoryId?: string;
  categoryName?: string;
}

interface CategoryEdit {
  id: string | null;
  name: string;
  imageUrl: string;
}

function getToken(): string {
  return typeof localStorage !== 'undefined' ? (localStorage.getItem('delivery_token') || '') : '';
}

async function saveSettingsPatch(patch: Record<string, unknown>): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Non autorisé');
  const res = await fetch('/api/delivery/storefront/settings/storefront');
  let blob: Record<string, unknown> = {};
  if (res.ok) {
    const j = await res.json().catch(() => ({}));
    if (j && typeof j === 'object') blob = j as Record<string, unknown>;
  }
  const put = await fetch('/api/delivery/storefront/settings/storefront', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ value: { ...blob, ...patch } }),
  });
  if (!put.ok) throw new Error('Erreur de sauvegarde');
}

export default function EditCanvas() {
  const [isEdit, setIsEdit] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [catEdit, setCatEdit] = useState<CategoryEdit | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const textTargetRef = useRef<HTMLElement | null>(null);
  const finishTextRef = useRef<(el: HTMLElement) => Promise<void>>(async () => {});
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { products, categories, settings } = useStorefront();

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('edit')) return;
    setIsEdit(true);
    document.documentElement.classList.add('edit-mode');

    const close = () => setMenu(null);

    const onContext = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      const textEl = target.closest<HTMLElement>('[data-edit-text]');
      const prodEl = target.closest<HTMLElement>('[data-edit-product]');
      const modelEl = target.closest<HTMLElement>('[data-edit-3d]');
      const catEl = target.closest<HTMLElement>('[data-edit-category]');
      let next: MenuState | null = null;
      if (textEl) {
        next = { x: e.clientX, y: e.clientY, kind: 'text', target: textEl, textKey: textEl.dataset.editText };
      } else if (prodEl) {
        next = { x: e.clientX, y: e.clientY, kind: 'product', target: prodEl };
      } else if (modelEl) {
        next = { x: e.clientX, y: e.clientY, kind: '3d', target: modelEl };
      } else if (catEl) {
        next = {
          x: e.clientX,
          y: e.clientY,
          kind: 'category',
          target: catEl,
          categoryId: catEl.dataset.editCategory || null,
          categoryName: catEl.dataset.catName,
        };
      }
      if (next) {
        e.preventDefault();
        setMenu(next);
      } else {
        close();
      }
    };

    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.ec-menu, .ec-modal')) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        setCatEdit(null);
        (document.activeElement as HTMLElement)?.blur?.();
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        const t = document.activeElement as HTMLElement | null;
        if (t && t.isContentEditable && t.getAttribute('contenteditable') === 'true') {
          e.preventDefault();
          t.blur();
        }
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const el = textTargetRef.current;
      if (el && e.target === el) void finishTextRef.current(el);
    };
    const onCategoryEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const id = detail?.id ? String(detail.id) : null;
      const existing = categories.find((c) => String(c.id) === id);
      setCatEdit({
        id,
        name: existing?.name || '',
        imageUrl: existing?.imageUrl || '',
      });
    };

    document.addEventListener('contextmenu', onContext, true);
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusout', onFocusOut, true);
    window.addEventListener('category:edit', onCategoryEvent);
    return () => {
      document.removeEventListener('contextmenu', onContext, true);
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusout', onFocusOut, true);
      window.removeEventListener('category:edit', onCategoryEvent);
    };
  }, [categories]);

  const startTextEdit = () => {
    if (!menu) return;
    const el = menu.target;
    textTargetRef.current = el;
    el.setAttribute('contenteditable', 'true');
    el.classList.add('ec-editing');
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    setMenu(null);
  };

  const finishTextEdit = async (el: HTMLElement) => {
    const key = el.dataset.editText;
    const value = (el.textContent || '').trim();
    if (key && value && el.getAttribute('contenteditable') === 'true') {
      el.removeAttribute('contenteditable');
      el.classList.remove('ec-editing');
      textTargetRef.current = null;
      try {
        setBusy(true);
        await saveSettingsPatch({ [key]: value });
        notify('Texte sauvegardé');
        window.setTimeout(() => window.location.reload(), 900);
      } catch (err) {
        notify((err as Error).message || 'Erreur');
        setBusy(false);
      }
    }
  };
  finishTextRef.current = finishTextEdit;

  const startModelUpload = () => {
    setMenu(null);
    fileRef.current?.click();
  };

  const onModelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setBusy(true);
      const token = getToken();
      if (!token) throw new Error('Non autorisé');
      const fd = new FormData();
      fd.append('model', file);
      const up = await fetch('/api/delivery/upload/model', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!up.ok) throw new Error('Échec de l’upload');
      const json = await up.json();
      await saveSettingsPatch({ model3d: json.url });
      notify('Modèle 3D mis à jour');
      window.setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setBusy(false);
    }
  };

  const openProductEdit = () => {
    if (!menu) return;
    const id = menu.target.dataset.editProduct;
    const p = products.find((x) => x.id === id);
    if (p) setEditing(p);
    setMenu(null);
  };

  const openCategoryEdit = () => {
    if (!menu) return;
    const existing = categories.find((c) => String(c.id) === menu.categoryId);
    setCatEdit({
      id: menu.categoryId || null,
      name: existing?.name || menu.categoryName || '',
      imageUrl: existing?.imageUrl || '',
    });
    setMenu(null);
  };

  const onCategoryImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !catEdit) return;
    try {
      setBusy(true);
      const token = getToken();
      if (!token) throw new Error('Non autorisé');
      const fd = new FormData();
      fd.append('image', file);
      const up = await fetch('/api/delivery/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!up.ok) throw new Error('Échec de l’upload');
      const json = await up.json();
      setCatEdit((c) => (c ? { ...c, imageUrl: json.url } : c));
      notify('Image téléversée');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
    }
    setBusy(false);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catEdit) return;
    const name = catEdit.name.trim();
    if (!name) return notify('Nom requis');
    try {
      setBusy(true);
      const token = getToken();
      if (!token) throw new Error('Non autorisé');
      const exists = categories.some((c) => c.name.toLowerCase() === name.toLowerCase());
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      if (catEdit.id) {
        const res = await fetch(`/api/delivery/categories/${catEdit.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name, imageUrl: catEdit.imageUrl || null }),
        });
        if (!res.ok) throw new Error('Erreur de sauvegarde');
      } else {
        const storeType = storeTypeForTheme(settings.theme);
        const res = await fetch('/api/delivery/categories', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name, imageUrl: catEdit.imageUrl || null, storeType }),
        });
        if (!res.ok) throw new Error('Erreur de création');
        if (!exists) {
          notify(`Catégorie « ${name} » créée — affectez ses produits depuis l'admin`);
        }
      }
      setCatEdit(null);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setBusy(false);
    }
  };

  const deleteCategory = async () => {
    if (!catEdit?.id) return;
    if (!window.confirm(`Supprimer la catégorie « ${catEdit.name} » ?`)) return;
    try {
      setBusy(true);
      const token = getToken();
      if (!token) throw new Error('Non autorisé');
      const res = await fetch(`/api/delivery/categories/${catEdit.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur de suppression');
      setCatEdit(null);
      notify('Catégorie supprimée');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setBusy(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      setBusy(true);
      const token = getToken();
      if (!token) throw new Error('Non autorisé');
      const fd = new FormData();
      fd.append('catalogId', editing.id);
      fd.append('name', editing.name);
      fd.append('salePrice', String(editing.oldPrice ?? editing.price));
      fd.append('promoPrice', editing.oldPrice ? String(editing.price) : '');
      if (editing.imageUrl) fd.append('imageUrl', editing.imageUrl);
      const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[type=file]');
      const file = fileInput?.files?.[0];
      if (file) fd.append('image', file);
      const res = await fetch('/api/delivery/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Erreur de sauvegarde');
      }
      setEditing(null);
      notify('Produit mis à jour');
      window.setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setBusy(false);
    }
  };

  const deleteProduct = async () => {
    if (!editing) return;
    if (!window.confirm(`Supprimer « ${editing.name} » ?`)) return;
    try {
      setBusy(true);
      const token = getToken();
      if (!token) throw new Error('Non autorisé');
      const res = await fetch(`/api/delivery/products/${editing.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur de suppression');
      setEditing(null);
      notify('Produit supprimé');
      window.setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setBusy(false);
    }
  };

  if (!isEdit) return <></>;

  const nameExists = catEdit
    ? categories.some((c) => c.name.toLowerCase() === catEdit.name.trim().toLowerCase())
    : true;

  return (
    <>
      <div className="ec-badge">✏️ Mode édition — clic droit</div>

      {menu && (
        <div className="ec-menu" style={{ left: Math.min(menu.x, window.innerWidth - 230), top: Math.min(menu.y, window.innerHeight - 160) }}>
          {menu.kind === 'text' && (
            <button className="ec-menu-item" onClick={startTextEdit}>
              ✏️ Modifier le texte
            </button>
          )}
          {menu.kind === 'product' && (
            <button className="ec-menu-item" onClick={openProductEdit}>
              📦 Modifier le produit
            </button>
          )}
          {menu.kind === '3d' && (
            <button className="ec-menu-item" onClick={startModelUpload}>
              🧊 Changer le modèle 3D
            </button>
          )}
          {menu.kind === 'category' && (
            <button className="ec-menu-item" onClick={openCategoryEdit}>
              🗂️ Modifier la catégorie
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <form className="ec-modal-card" onSubmit={saveProduct}>
            <div className="ec-modal-head">
              <span>Modifier le produit</span>
              <button type="button" className="ec-close" onClick={() => setEditing(null)}>
                ×
              </button>
            </div>
            <label>
              Nom
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </label>
            <label>
              Prix (DA)
              <input
                type="number"
                min="0"
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) || 0 })}
              />
            </label>
            <label>
              Ancien prix (DA) — optionnel
              <input
                type="number"
                min="0"
                value={editing.oldPrice ?? ''}
                placeholder="Laisser vide pour aucun"
                onChange={(e) => setEditing({ ...editing, oldPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </label>
            <label>
              Image (URL ou fichier)
              <input value={editing.imageUrl || ''} placeholder="https://…" onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} />
            </label>
            <label>
              Image (fichier local)
              <input type="file" accept="image/*" />
            </label>
            <div className="ec-modal-actions">
              <button type="button" className="ec-danger" onClick={deleteProduct} disabled={busy}>
                Supprimer
              </button>
              <button type="submit" className="ec-save" disabled={busy}>
                {busy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {catEdit && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <form className="ec-modal-card" onSubmit={saveCategory}>
            <div className="ec-modal-head">
              <span>{catEdit.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</span>
              <button type="button" className="ec-close" onClick={() => setCatEdit(null)}>
                ×
              </button>
            </div>
            <label>
              Nom de la catégorie
              <input
                value={catEdit.name}
                placeholder="Ex : Chargeurs"
                onChange={(e) => setCatEdit({ ...catEdit, name: e.target.value })}
              />
            </label>
            {!catEdit.id && catEdit.name.trim() && !nameExists && (
              <p className="ec-hint">
                ⚠️ La catégorie « {catEdit.name.trim()} » n'existe pas encore — elle sera créée automatiquement à l'enregistrement. Affectez ensuite ses produits depuis l'onglet Produits de l'admin.
              </p>
            )}
            {!catEdit.id && catEdit.name.trim() && nameExists && (
              <p className="ec-hint">✓ La catégorie « {catEdit.name.trim()} » existe déjà — la tuile y mènera directement.</p>
            )}
            <label>
              Icône (URL)
              <input
                value={catEdit.imageUrl}
                placeholder="https://… ou /uploads/images/…"
                onChange={(e) => setCatEdit({ ...catEdit, imageUrl: e.target.value })}
              />
            </label>
            {catEdit.imageUrl && (
              <div className="ec-thumb">
                <img src={catEdit.imageUrl} alt="aperçu" />
              </div>
            )}
            <label>
              Icône (fichier local)
              <input type="file" accept="image/*" onChange={onCategoryImageFile} />
            </label>
            <div className="ec-modal-actions">
              {catEdit.id ? (
                <button type="button" className="ec-danger" onClick={deleteCategory} disabled={busy}>
                  Supprimer
                </button>
              ) : (
                <span />
              )}
              <button type="submit" className="ec-save" disabled={busy}>
                {busy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".glb,.gltf,.fbx,.obj" style={{ display: 'none' }} onChange={onModelFile} />

      {toast && <div className="ec-toast">{toast}</div>}
    </>
  );
}
