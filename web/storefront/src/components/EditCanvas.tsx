import { useEffect, useRef, useState } from 'react';
import { useStorefront, storeTypeForTheme } from '../lib/storefront';
import type { Product, PageSection, SlideBlock, SlideLink, SliderSection, SpecialCategory, SpecialSection } from '../lib/data';
import type { SliderType, SliderWidth } from '../lib/data';
import { defaultPageSections, uid, SLIDER_TYPE_LABELS, SLIDER_WIDTH_LABELS } from '../lib/data';
import { parseElementRuns, type TextRun, type MarqueeText } from '../lib/texts';
import '../styles/islands.css';

interface MenuState {
  x: number;
  y: number;
  kind: 'text' | 'product' | '3d' | 'category' | 'vedette' | 'logo' | 'banner' | 'slider' | 'sliderSection' | 'specialSection';
  target: HTMLElement;
  textKey?: string;
  categoryId?: string;
  categoryName?: string;
  bannerId?: string;
  sliderKey?: string;
  sliderSectionId?: string;
}

interface TextEditState {
  key: string;
  marquee: boolean;
  rows: string[];
  runs: TextRun[];
}

interface CategoryEdit {
  id: string | null;
  name: string;
  imageUrl: string;
}

interface SliderEdit {
  key: string;
  ids: string[];
  q: string;
}

interface SecSlideDraft {
  id: string;
  imageUrl: string;
  label?: string;
  linkType: 'category' | 'product' | 'url';
  categoryName?: string;
  productId?: string;
  url?: string;
}

interface SliderSectionDraft {
  id: string;
  type: SliderType;
  width: SliderWidth;
  widthPct?: number;
  hero?: boolean;
  slides: SecSlideDraft[];
}

interface SliderSectionEditState {
  section: SliderSectionDraft;
  editing: SecSlideDraft | null;
  busy: boolean;
}

interface SpecialSectionEdit {
  id: string;
  categoryId: string;
  title: string;
}

interface SpecialAssignState {
  kind: 'slider' | 'banner' | 'product';
  ref: string;
  label: string;
  scId: string;
  newName: string;
}

function getToken(): string {
  return typeof localStorage !== 'undefined' ? (localStorage.getItem('delivery_token') || '') : '';
}

function isVedette(name?: string | null) {
  return String(name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'vedette';
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

async function fetchBlob(): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error('Non autorisé');
  const res = await fetch('/api/delivery/storefront/settings/storefront');
  if (res.ok) {
    const j = await res.json().catch(() => ({}));
    if (j && typeof j === 'object') return j as Record<string, unknown>;
  }
  return {};
}

async function saveLayoutPatch(patch: Record<string, unknown>): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Non autorisé');
  const blob = await fetchBlob();
  const prevLayout = (blob.layout && typeof blob.layout === 'object' ? blob.layout : {}) as Record<string, unknown>;
  const put = await fetch('/api/delivery/storefront/settings/storefront', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ value: { ...blob, layout: { ...prevLayout, ...patch } } }),
  });
  if (!put.ok) throw new Error('Erreur de sauvegarde');
}

export default function EditCanvas() {
  const [isEdit, setIsEdit] = useState(false);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [catEdit, setCatEdit] = useState<CategoryEdit | null>(null);
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);
  const [busy, setBusy] = useState(false);
  const [logoEdit, setLogoEdit] = useState<{ url: string } | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [bannerEdit, setBannerEdit] = useState<{ id: string; url: string; type: 'image' | 'video' } | null>(null);
  const [bannerBusy, setBannerBusy] = useState(false);
  const [sliderEdit, setSliderEdit] = useState<SliderEdit | null>(null);
  const [secSliderEdit, setSecSliderEdit] = useState<SliderSectionEditState | null>(null);
  const [specialSecEdit, setSpecialSecEdit] = useState<SpecialSectionEdit | null>(null);
  const [toast, setToast] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [sectionsOverride, setSectionsOverride] = useState<PageSection[] | null>(null);
  const [specialMgr, setSpecialMgr] = useState(false);
  const [specialDraft, setSpecialDraft] = useState<SpecialCategory[] | null>(null);
  const [specialAssign, setSpecialAssign] = useState<SpecialAssignState | null>(null);
  const [specialOverride, setSpecialOverride] = useState<SpecialCategory[] | null>(null);
  const textTargetRef = useRef<HTMLElement | null>(null);
  const finishTextRef = useRef<(el: HTMLElement) => Promise<void>>(async () => {});
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { products, categories, settings } = useStorefront();

  const variant = (settings.theme as 'greens' | 'gaming' | 'pulsar') || 'gaming';
  const sections: PageSection[] =
    sectionsOverride ?? (settings.sections && settings.sections.length ? settings.sections : defaultPageSections(variant));
  const specialCats: SpecialCategory[] =
    specialOverride ?? (settings.specialCategories && settings.specialCategories.length ? settings.specialCategories : []);

  const saveSections = async (next: PageSection[]) => {
    await saveSettingsPatch({ sections: next });
    setSectionsOverride(next);
  };

  const sectionToDraft = (section: SliderSection): SliderSectionDraft => {
    const slides: SecSlideDraft[] = (section.slides || []).map((sl) => {
      const link = sl.link;
      const linkType = link.linkType;
      return {
        id: sl.id,
        imageUrl: sl.imageUrl,
        label: sl.label,
        linkType,
        categoryName: linkType === 'category' ? link.categoryName : undefined,
        productId: linkType === 'product' ? link.productId : undefined,
        url: linkType === 'url' ? link.url : undefined,
      };
    });
    return { id: section.id, type: section.type, width: section.width, widthPct: section.widthPct, hero: section.hero, slides };
  };

  const openSectionEditor = (section: SliderSection) => {
    setSecSliderEdit({ section: sectionToDraft(section), editing: null, busy: false });
  };

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  const saveSpecialCats = async (next: SpecialCategory[]) => {
    await saveSettingsPatch({ specialCategories: next });
    setSpecialOverride(next);
  };

  const openSpecialManager = () => {
    setSpecialDraft(JSON.parse(JSON.stringify(specialCats)) as SpecialCategory[]);
    setSpecialMgr(true);
  };

  const specialPatch = (id: string, patch: Partial<SpecialCategory>) => {
    setSpecialDraft((d) => (d ? d.map((c) => (c.id === id ? { ...c, ...patch } : c)) : d));
  };

  const specialMove = (i: number, dir: number) => {
    setSpecialDraft((d) => {
      if (!d) return d;
      const j = i + dir;
      if (j < 0 || j >= d.length) return d;
      const copy = [...d];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const specialDelete = (id: string) => {
    const c = specialDraft?.find((x) => x.id === id);
    if (!c) return;
    if (!window.confirm(`Supprimer la catégorie spéciale « ${c.name.trim() || 'sans nom'} » ?`)) return;
    setSpecialDraft((d) => (d ? d.filter((x) => x.id !== id) : d));
  };

  const specialAdd = () =>
    setSpecialDraft((d) => [...(d || []), { id: uid('sc'), name: '', imageUrl: '', sections: [], products: [] }]);

  const specialRemoveRef = (id: string, key: 'sections' | 'products', ref: string) => {
    const base = specialDraft?.find((c) => c.id === id);
    if (!base) return;
    specialPatch(id, { [key]: base[key].filter((r) => r !== ref) } as Partial<SpecialCategory>);
  };

  const specialRefInfo = (ref: string): { label: string; img: string } => {
    const s = sections.find((x) => x.kind === 'slider' && x.id === ref);
    if (s && s.kind === 'slider') {
      return { label: SLIDER_TYPE_LABELS[s.type] || 'Slider', img: s.slides?.[0]?.imageUrl || '' };
    }
    const banners = ((settings as any).layout?.banners || {}) as Record<string, { mediaType?: string; mediaUrl?: string }>;
    if (banners[ref]) {
      return {
        label: 'Image promotionnelle',
        img: banners[ref].mediaType !== 'video' ? banners[ref].mediaUrl || '' : '',
      };
    }
    return { label: 'Élément introuvable', img: '' };
  };

  const saveSpecialManager = async () => {
    if (!specialDraft) return;
    const cleaned = specialDraft
      .filter((c) => c.name.trim())
      .map((c) => ({ ...c, name: c.name.trim(), sections: [...c.sections], products: [...c.products] }));
    try {
      await saveSpecialCats(cleaned);
      setSpecialMgr(false);
      setSpecialDraft(null);
      notify('Catégories spéciales enregistrées');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
    }
  };

  const openSpecialAssign = (kind: 'slider' | 'banner' | 'product') => {
    if (!menu) return;
    let ref = '';
    let label = '';
    if (kind === 'product') {
      ref = menu.target.dataset.editProduct || '';
      if (!ref) return notify('Produit introuvable');
      label = products.find((p) => p.id === ref)?.name || 'Produit';
    } else if (kind === 'banner') {
      ref = menu.bannerId || '';
      label = 'Image promotionnelle';
    } else {
      ref = menu.sliderSectionId || '';
      const section = sections.find((s) => s.kind === 'slider' && s.id === ref);
      label = section && section.kind === 'slider' ? SLIDER_TYPE_LABELS[section.type] || 'Slider' : 'Slider';
    }
    setSpecialAssign({ kind, ref, label, scId: specialCats[0]?.id || '', newName: '' });
    setMenu(null);
  };

  const doSpecialAssign = async () => {
    if (!specialAssign) return;
    const name = specialAssign.newName.trim();
    const next = specialCats.map((c) => ({ ...c, sections: [...c.sections], products: [...c.products] }));
    let target = next.find((c) => c.id === specialAssign.scId);
    if (!target && name) {
      target = { id: uid('sc'), name, imageUrl: '', sections: [], products: [] };
      next.push(target);
    }
    if (!target) return notify('Choisissez une catégorie ou saisissez un nom');
    const key: 'sections' | 'products' = specialAssign.kind === 'product' ? 'products' : 'sections';
    if (target[key].includes(specialAssign.ref)) return notify(`Déjà dans « ${target.name} »`);
    target[key] = [...target[key], specialAssign.ref];
    try {
      await saveSpecialCats(next);
      notify(`Assigné à « ${target.name} »`);
      setSpecialAssign(null);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
    }
  };

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('edit')) return;
    setIsEdit(true);
    document.documentElement.classList.add('edit-mode');

    const close = () => {
      setMenu(null);
      setTextEdit(null);
    };

    const onContext = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      const textEl = target.closest<HTMLElement>('[data-edit-text]');
      const structEl = target.closest<HTMLElement>('[data-text-key]');
      const prodEl = target.closest<HTMLElement>('[data-edit-product]');
      const vedetteEl = target.closest<HTMLElement>('[data-edit-vedette]');
      const modelEl = target.closest<HTMLElement>('[data-edit-3d]');
      const logoEl = target.closest<HTMLElement>('[data-edit-logo]');
      const catEl = target.closest<HTMLElement>('[data-edit-category]');
      const bannerEl = target.closest<HTMLElement>('[data-edit-banner]');
      const secSliderEl = target.closest<HTMLElement>('[data-edit-sec]');
      const sliderEl = target.closest<HTMLElement>('[data-edit-slider]');
      let next: MenuState | null = null;
      if (structEl) {
        next = { x: e.clientX, y: e.clientY, kind: 'text', target: structEl, textKey: structEl.dataset.textKey };
      } else if (textEl) {
        next = { x: e.clientX, y: e.clientY, kind: 'text', target: textEl, textKey: textEl.dataset.editText };
      } else if (prodEl) {
        next = { x: e.clientX, y: e.clientY, kind: 'product', target: prodEl };
      } else if (vedetteEl) {
        next = { x: e.clientX, y: e.clientY, kind: 'vedette', target: vedetteEl };
      } else if (modelEl) {
        next = { x: e.clientX, y: e.clientY, kind: '3d', target: modelEl };
      } else if (logoEl) {
        next = { x: e.clientX, y: e.clientY, kind: 'logo', target: logoEl };
      } else if (catEl) {
        next = {
          x: e.clientX,
          y: e.clientY,
          kind: 'category',
          target: catEl,
          categoryId: catEl.dataset.editCategory || undefined,
          categoryName: catEl.dataset.catName,
        };
      } else if (bannerEl) {
        next = {
          x: e.clientX,
          y: e.clientY,
          kind: 'banner',
          target: bannerEl,
          bannerId: bannerEl.dataset.banner || '',
        };
      } else if (secSliderEl) {
        next = {
          x: e.clientX,
          y: e.clientY,
          kind: secSliderEl.dataset.secKind === 'special' ? 'specialSection' : 'sliderSection',
          target: secSliderEl,
          sliderSectionId: secSliderEl.dataset.editSec || '',
        };
      } else if (sliderEl) {
        next = {
          x: e.clientX,
          y: e.clientY,
          kind: 'slider',
          target: sliderEl,
          sliderKey: sliderEl.dataset.editSlider || '',
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

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const logoUrl = settings.logoUrl;
    if (!logoUrl) return;
    document.querySelectorAll<HTMLElement>('[data-edit-logo]').forEach((el) => {
      if (el.tagName === 'IMG') {
        el.setAttribute('src', String(logoUrl));
        return;
      }
      let img = el.querySelector<HTMLImageElement>('img.ec-logo-img');
      if (!img) {
        img = document.createElement('img');
        img.className = 'ec-logo-img';
        img.alt = 'logo';
        el.innerHTML = '';
        el.appendChild(img);
      }
      img.src = String(logoUrl);
    });
  }, [settings.logoUrl]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const banners = ((settings as any).layout?.banners || {}) as Record<
      string,
      { mediaType?: 'image' | 'video'; mediaUrl?: string }
    >;
    document.querySelectorAll<HTMLElement>('[data-banner]').forEach((tile) => {
      const id = tile.dataset.banner;
      const cfg = id ? banners[id] : null;
      if (!cfg || !cfg.mediaUrl || !cfg.mediaType) return;
      const card = tile.querySelector<HTMLElement>('.g-promo-card');
      const existing = card?.querySelector('img, video');
      const wantTag = cfg.mediaType === 'video' ? 'VIDEO' : 'IMG';
      if (existing && existing.tagName === wantTag && existing.getAttribute('src') === cfg.mediaUrl) return;
      if (card) {
        card.innerHTML = '';
        if (cfg.mediaType === 'video') {
          const v = document.createElement('video');
          v.src = String(cfg.mediaUrl);
          v.muted = true;
          v.autoplay = true;
          v.loop = true;
          v.playsInline = true;
          card.appendChild(v);
          void v.play().catch(() => {});
        } else {
          const img = document.createElement('img');
          img.src = String(cfg.mediaUrl);
          img.alt = '';
          card.appendChild(img);
        }
      }
    });
  }, [JSON.stringify((settings as any).layout)]);

  useEffect(() => {
    if (!isEdit) return;
    let dragEl: HTMLElement | null = null;
    const MOVE_SEL = '[data-edit-category], [data-edit-banner]';
    document.querySelectorAll<HTMLElement>(MOVE_SEL).forEach((tile) => {
      tile.draggable = true;
      tile.dataset.reorderIndex = '';
    });
    const clearOver = () => {
      document.querySelectorAll<HTMLElement>(MOVE_SEL + '.ec-over').forEach((t) => t.classList.remove('ec-over'));
    };
    const persistOrder = async () => {
      try {
        const tiles = Array.from(document.querySelectorAll<HTMLElement>('[data-edit-category]')).filter(
          (t) => t.dataset.editCategory
        );
        await Promise.all(
          tiles.map((t, i) =>
            fetch('/api/delivery/categories/' + t.dataset.editCategory, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
              body: JSON.stringify({ sortOrder: i }),
            })
          )
        );
        notify('Ordre sauvegardé');
      } catch (err) {
        notify('Erreur de réorganisation');
      }
    };
    const persistBannerOrder = async () => {
      try {
        const order = Array.from(document.querySelectorAll<HTMLElement>('[data-edit-banner]'))
          .map((t) => t.dataset.banner)
          .filter((v): v is string => Boolean(v));
        await saveLayoutPatch({ bannersOrder: order });
        notify('Ordre des bannières sauvegardé');
      } catch (err) {
        notify('Erreur de réorganisation');
      }
    };
    const onDragStart = (e: DragEvent) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>(MOVE_SEL);
      if (!tile) return;
      dragEl = tile;
      tile.classList.add('ec-dragging');
    };
    const onDragOver = (e: DragEvent) => {
      if (!dragEl) return;
      e.preventDefault();
      const tile = (e.target as HTMLElement).closest<HTMLElement>(MOVE_SEL);
      if (!tile || tile === dragEl) return;
      clearOver();
      tile.classList.add('ec-over');
    };
    const onDragLeave = (e: DragEvent) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>(MOVE_SEL);
      if (tile) tile.classList.remove('ec-over');
    };
    const onDrop = (e: DragEvent) => {
      if (!dragEl) return;
      e.preventDefault();
      const target = (e.target as HTMLElement).closest<HTMLElement>(MOVE_SEL);
      if (target && target !== dragEl) {
        const rect = target.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        if (after) {
          if (target.nextSibling) target.parentNode!.insertBefore(dragEl, target.nextSibling);
          else target.parentNode!.appendChild(dragEl);
        } else {
          target.parentNode!.insertBefore(dragEl, target);
        }
      }
      dragEl.classList.remove('ec-dragging');
      const moved = dragEl;
      dragEl = null;
      clearOver();
      if (moved && moved.hasAttribute('data-edit-banner')) {
        void persistBannerOrder();
      } else {
        void persistOrder();
      }
    };
    const onDragEnd = () => {
      if (dragEl) dragEl.classList.remove('ec-dragging');
      dragEl = null;
      clearOver();
    };
    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('dragover', onDragOver, true);
    document.addEventListener('dragleave', onDragLeave, true);
    document.addEventListener('dragend', onDragEnd, true);
    document.addEventListener('drop', onDrop, true);
    return () => {
      document.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('dragover', onDragOver, true);
      document.removeEventListener('dragleave', onDragLeave, true);
      document.removeEventListener('dragend', onDragEnd, true);
      document.removeEventListener('drop', onDrop, true);
    };
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    document.querySelectorAll<HTMLElement>('[data-edit-category]').forEach((tile) => {
      if (!tile.querySelector('.ec-resize')) {
        const handle = document.createElement('span');
        handle.className = 'ec-resize';
        handle.setAttribute('aria-hidden', 'true');
        handle.textContent = '⤢';
        tile.appendChild(handle);
      }
      tile.style.position = 'relative';
    });
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).classList.contains('ec-resize')) return;
      e.preventDefault();
      const handle = e.target as HTMLElement;
      const tile = handle.closest<HTMLElement>('[data-edit-category]');
      if (!tile) return;
      const id = tile.dataset.editCategory;
      const visual = tile.querySelector<HTMLElement>('img, .category-icon, .cat-emoji');
      let startScale = 1;
      const tr = visual?.style.transform || '';
      const sm = tr.match(/scale\(([\d.]+)\)/);
      if (sm) startScale = parseFloat(sm[1]) || 1;
      const startX = e.clientX;
      let scale = startScale;
      const onMove = (ev: PointerEvent) => {
        scale = Math.min(3, Math.max(0.6, startScale + (ev.clientX - startX) * 0.005));
        if (visual) visual.style.transform = 'scale(' + scale + ')';
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        if (!id) return;
        void (async () => {
          try {
            const blob = await fetchBlob();
            const layout = (blob.layout && typeof blob.layout === 'object' ? blob.layout : {}) as Record<string, unknown>;
            const prevScale = ((layout.categoryScale as Record<string, unknown> | undefined) || {}) as Record<string, unknown>;
            await saveLayoutPatch({ categoryScale: { ...prevScale, [id]: scale } });
            notify('Taille sauvegardée');
          } catch (err) {
            notify((err as Error).message || 'Erreur');
          }
        })();
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    const MOVE_SEL = '[data-edit-category], [data-edit-banner]';
    document.querySelectorAll<HTMLElement>('.ps-zone').forEach((z) => {
      z.draggable = true;
    });
    let drag: { mode: 'new'; type: SliderType | 'special' } | { mode: 'move'; sectionId: string } | null = null;
    let draggingEl: HTMLElement | null = null;
    let dropEl: HTMLElement | null = null;
    let dropBefore = true;
    let indicator: HTMLElement | null = null;

    const clearOver = () => {
      document.querySelectorAll<HTMLElement>('.ps-zone.ec-over').forEach((t) => t.classList.remove('ec-over'));
    };
    const clearIndicator = () => {
      indicator?.remove();
      indicator = null;
    };
    const cleanup = () => {
      draggingEl?.classList.remove('ec-dragging');
      draggingEl = null;
      drag = null;
      dropEl = null;
      clearOver();
      clearIndicator();
    };

    const onDragStart = (e: DragEvent) => {
      if (!(e.target instanceof Element) || e.target.closest(MOVE_SEL)) return;
      const secCard = e.target.closest<HTMLElement>('[data-sec-type]');
      if (secCard) {
        const t = secCard.dataset.secType as 'special';
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.setData('text/plain', 'sec:' + t);
        }
        drag = { mode: 'new', type: t };
        draggingEl = secCard;
        secCard.classList.add('ec-dragging');
        return;
      }
      const card = e.target.closest<HTMLElement>('[data-slider-type]');
      if (card) {
        const t = card.dataset.sliderType as SliderType;
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.setData('text/plain', 'slider:' + t);
        }
        drag = { mode: 'new', type: t };
        draggingEl = card;
        card.classList.add('ec-dragging');
        return;
      }
      const zone = e.target.closest<HTMLElement>('.ps-zone');
      if (zone) {
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', 'move');
        }
        drag = { mode: 'move', sectionId: zone.dataset.editSec || '' };
        draggingEl = zone;
        zone.classList.add('ec-dragging');
      }
    };

    const onDragOver = (e: DragEvent) => {
      if (!drag) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = drag.mode === 'new' ? 'copy' : 'move';
      const zones = Array.from(document.querySelectorAll<HTMLElement>('.ps-zone'));
      let el: HTMLElement | null = null;
      let before = true;
      for (const z of zones) {
        if (z === draggingEl) continue;
        const r = z.getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) {
          el = z;
          before = true;
          break;
        }
      }
      if (!el) {
        const last = zones[zones.length - 1];
        if (last) {
          el = last;
          before = false;
        }
      }
      clearOver();
      clearIndicator();
      if (el) {
        el.classList.add('ec-over');
        indicator = document.createElement('div');
        indicator.className = 'ec-dropline';
        if (before) el.before(indicator);
        else el.after(indicator);
        dropEl = el;
        dropBefore = before;
      }
    };

    const onDrop = (e: DragEvent) => {
      if (!drag) return;
      e.preventDefault();
      const d = drag;
      const zones = Array.from(document.querySelectorAll<HTMLElement>('.ps-zone'));
      let idx = zones.length;
      if (dropEl) idx = zones.indexOf(dropEl) + (dropBefore ? 0 : 1);
      const list = [...sections];
      if (d.mode === 'new') {
        if (d.type === 'special') {
          const section: SpecialSection = {
            id: uid('sec'),
            kind: 'special',
            categoryId: specialCats[0]?.id,
            title: '',
          };
          list.splice(idx, 0, section);
          void saveSections(list)
            .then(() => openSpecialSectionEditorById(section))
            .catch((err) => notify((err as Error).message || 'Erreur'));
        } else {
          const section: SliderSection = {
            id: uid('slider'),
            kind: 'slider',
            type: d.type,
            width: 'full',
            hero: false,
            slides: [],
          };
          list.splice(idx, 0, section);
          void saveSections(list).then(() => openSectionEditor(section)).catch((err) => notify((err as Error).message || 'Erreur'));
        }
      } else {
        const from = list.findIndex((s) => s.id === d.sectionId);
        if (from >= 0) {
          const [moved] = list.splice(from, 1);
          let target = idx;
          if (from < idx) target = idx - 1;
          list.splice(target, 0, moved);
          void saveSections(list).catch((err) => notify((err as Error).message || 'Erreur'));
        }
      }
      cleanup();
    };

    const onDragEnd = () => cleanup();

    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('dragover', onDragOver, true);
    document.addEventListener('drop', onDrop, true);
    document.addEventListener('dragend', onDragEnd, true);
    return () => {
      document.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('dragover', onDragOver, true);
      document.removeEventListener('drop', onDrop, true);
      document.removeEventListener('dragend', onDragEnd, true);
      cleanup();
    };
  }, [isEdit, sections, specialCats]);

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

  const startStructuredTextEdit = () => {
    if (!menu) return;
    const el = menu.target;
    const key = menu.textKey || '';
    const texts = (settings as Record<string, unknown>).texts as Record<string, unknown> | undefined;
    const stored = texts?.[key] as TextRun[] | string | MarqueeText | undefined;
    if (key === 'marquee') {
      let rows: string[] = [];
      if (stored && typeof stored === 'object' && Array.isArray((stored as MarqueeText).rows)) {
        rows = [...(stored as MarqueeText).rows];
      } else {
        rows = Array.from(el.querySelectorAll('span'))
          .map((s) => (s.textContent || '').trim())
          .filter(Boolean);
      }
      setTextEdit({ key, marquee: true, rows, runs: [] });
    } else {
      let runs: TextRun[] = [];
      if (Array.isArray(stored)) {
        runs = stored.map((r) => ({ ...r }));
      } else if (stored && typeof stored === 'object' && Array.isArray((stored as unknown as { runs?: TextRun[] }).runs)) {
        runs = (stored as unknown as { runs: TextRun[] }).runs.map((r) => ({ ...r }));
      } else {
        runs = parseElementRuns(el);
      }
      if (!runs.length && el.textContent) runs = [{ text: (el.textContent || '').trim() }];
      setTextEdit({ key, marquee: false, rows: [], runs });
    }
    setMenu(null);
  };

  const updateRun = (i: number, patch: Partial<TextRun>) => {
    setTextEdit((s) => (s ? { ...s, runs: s.runs.map((r, j) => (j === i ? { ...r, ...patch } : r)) } : s));
  };

  const moveRow = (i: number, dir: number) => {
    setTextEdit((s) => {
      if (!s) return s;
      const j = i + dir;
      if (j < 0 || j >= s.rows.length) return s;
      const rows = [...s.rows];
      [rows[i], rows[j]] = [rows[j], rows[i]];
      return { ...s, rows };
    });
  };

  const saveTexts = async () => {
    if (!textEdit) return;
    const value =
      textEdit.marquee
        ? { rows: textEdit.rows.map((r) => r.trim()).filter(Boolean) }
        : {
            runs: textEdit.runs.map((r) => {
              const out: TextRun = { text: r.text };
              if (r.cls) out.cls = r.cls;
              if (r.color) out.color = r.color;
              if (r.font) out.font = r.font;
              return out;
            }),
          };
    try {
      setBusy(true);
      const token = getToken();
      if (!token) throw new Error('Non autorisé');
      const res = await fetch('/api/delivery/storefront/settings/storefront');
      let blob: Record<string, unknown> = {};
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j && typeof j === 'object') blob = j as Record<string, unknown>;
      }
      const prevTexts = (blob.texts && typeof blob.texts === 'object' ? blob.texts : {}) as Record<string, unknown>;
      const put = await fetch('/api/delivery/storefront/settings/storefront', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: { ...blob, texts: { ...prevTexts, [textEdit.key]: value } } }),
      });
      if (!put.ok) throw new Error('Erreur de sauvegarde');
      setTextEdit(null);
      notify('Texte sauvegardé');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setBusy(false);
    }
  };

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
      if (editing && !editing.id) {
        setEditing({ ...editing, imageUrl: json.url });
        setBusy(false);
        notify('Modèle 3D téléversé — enregistrez pour créer le produit');
        return;
      }
      const vedette = products.find((p) => p.modelUrl);
      if (vedette) {
        const res = await fetch(`/api/delivery/products/${vedette.id}/model`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ modelUrl: json.url }),
        });
        if (!res.ok) throw new Error('Erreur de sauvegarde');
      } else {
        await saveSettingsPatch({ model3d: json.url });
      }
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

  const vedetteCat = categories.find((c) => isVedette(c.name));
  const vedetteProduct = products.find((p) => p.modelUrl);

  const openVedetteEdit = () => {
    if (vedetteProduct) setEditing(vedetteProduct);
    setMenu(null);
  };

  const openVedetteAdd = () => {
    if (!vedetteCat) {
      notify('Catégorie Vedette introuvable');
      setMenu(null);
      return;
    }
    setSourceId('');
    setEditing({
      id: '',
      name: '',
      price: 0,
      oldPrice: undefined,
      costPrice: 0,
      imageUrl: '',
      modelUrl: '',
      category: 'Vedette',
      specs: [],
      stockQty: 1,
      isActive: true,
    } as Product);
    setMenu(null);
  };

  const pickSourceProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSourceId(id);
    if (!id) return;
    const p = products.find((x) => x.id === id);
    if (!p || !editing) return;
    setEditing({
      ...editing,
      name: p.name,
      price: p.price,
      costPrice: p.costPrice || 0,
    });
    notify(`« ${p.name} » prérempli — ajoutez le modèle 3D`);
  };

  const deleteVedette = async () => {
    if (!vedetteProduct) return;
    if (!window.confirm(`Supprimer « ${vedetteProduct.name} » (produit Vedette) ?`)) return;
    try {
      setBusy(true);
      const token = getToken();
      if (!token) throw new Error('Non autorisé');
      const res = await fetch(`/api/delivery/products/${vedetteProduct.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur de suppression');
      setMenu(null);
      notify('Produit Vedette supprimé');
      window.setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setBusy(false);
    }
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

  const onLogoImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !logoEdit) return;
    try {
      setLogoBusy(true);
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
      setLogoEdit((l) => (l ? { ...l, url: json.url } : l));
      notify('Image téléversée');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
    }
    setLogoBusy(false);
  };

  const saveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoEdit) return;
    try {
      setLogoBusy(true);
      await saveSettingsPatch({ logoUrl: logoEdit.url.trim() });
      setLogoEdit(null);
      notify('Logo mis à jour');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setLogoBusy(false);
    }
  };

  const applyBannerMedia = (id: string, type: 'image' | 'video', url: string) => {
    if (typeof document === 'undefined') return;
    const tile = document.querySelector<HTMLElement>(`[data-banner="${id}"]`);
    const card = tile?.querySelector<HTMLElement>('.g-promo-card');
    if (!card) return;
    card.innerHTML = '';
    if (type === 'video') {
      const v = document.createElement('video');
      v.src = url;
      v.muted = true;
      v.autoplay = true;
      v.loop = true;
      v.playsInline = true;
      card.appendChild(v);
      void v.play().catch(() => {});
    } else {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      card.appendChild(img);
    }
  };

  const openBannerEdit = () => {
    if (!menu) return;
    const id = menu.bannerId || '';
    const banners = ((settings as any).layout?.banners || {}) as Record<
      string,
      { mediaType?: 'image' | 'video'; mediaUrl?: string }
    >;
    const cur = id ? banners[id] : undefined;
    setBannerEdit({ id, url: cur?.mediaUrl || '', type: cur?.mediaType || 'image' });
    setMenu(null);
  };

  const onBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !bannerEdit) return;
    const isVideo = file.type.startsWith('video/');
    try {
      setBannerBusy(true);
      const token = getToken();
      if (!token) throw new Error('Non autorisé');
      const fd = new FormData();
      fd.append(isVideo ? 'video' : 'image', file);
      const up = await fetch(isVideo ? '/api/delivery/upload/video' : '/api/delivery/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!up.ok) throw new Error('Échec de l’upload');
      const json = await up.json();
      setBannerEdit((b) => (b ? { ...b, url: json.url, type: isVideo ? 'video' : 'image' } : b));
      notify(isVideo ? 'Vidéo téléversée' : 'Image téléversée');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
    }
    setBannerBusy(false);
  };

  const saveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerEdit) return;
    const url = bannerEdit.url.trim();
    if (!url) return notify('URL requise');
    try {
      setBannerBusy(true);
      const blob = await fetchBlob();
      const banners = ((blob.layout as Record<string, unknown> | undefined)?.banners || {}) as Record<
        string,
        Record<string, unknown>
      >;
      await saveLayoutPatch({
        banners: {
          ...banners,
          [bannerEdit.id]: { ...(banners[bannerEdit.id] || {}), mediaType: bannerEdit.type, mediaUrl: url },
        },
      });
      applyBannerMedia(bannerEdit.id, bannerEdit.type, url);
      setBannerEdit(null);
      setBannerBusy(false);
      notify('Média mis à jour');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setBannerBusy(false);
    }
  };

  const openSliderPicker = () => {
    if (!menu) return;
    const key = menu.sliderKey || '';
    const current = Array.isArray((settings as any)[key]) ? (((settings as any)[key] as unknown[]) as string[]) : [];
    setSliderEdit({ key, ids: [...current], q: '' });
    setMenu(null);
  };

  const toggleSliderProduct = (id: string) => {
    setSliderEdit((s) => {
      if (!s) return s;
      const has = s.ids.includes(id);
      return { ...s, ids: has ? s.ids.filter((x) => x !== id) : [...s.ids, id] };
    });
  };

  const saveSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sliderEdit) return;
    try {
      setBusy(true);
      await saveSettingsPatch({ [sliderEdit.key]: sliderEdit.ids });
      setSliderEdit(null);
      notify('Produits du slider mis à jour');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setBusy(false);
    }
  };

  const openSecSliderEditor = () => {
    if (!menu) return;
    const section = sections.find((s) => s.kind === 'slider' && s.id === menu.sliderSectionId) || sections.find((s) => s.kind === 'slider');
    if (!section || section.kind !== 'slider') return;
    openSectionEditor(section);
    setMenu(null);
  };

  const deleteSliderSection = async () => {
    if (!menu || !menu.sliderSectionId) return;
    const id = menu.sliderSectionId;
    const target = sections.find((s) => s.kind === 'slider' && s.id === id);
    const label = target && target.kind === 'slider' ? SLIDER_TYPE_LABELS[target.type] || 'ce slider' : 'ce slider';
    if (!window.confirm(`Supprimer « ${label} » de la page ?`)) return;
    const next = sections.filter((s) => s.kind !== 'slider' || s.id !== id);
    try {
      await saveSections(next);
      const sc = specialCats.map((c) => ({ ...c, sections: c.sections.filter((r) => r !== id) }));
      if (JSON.stringify(sc) !== JSON.stringify(specialCats)) await saveSpecialCats(sc);
      notify('Slider supprimé');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
    }
    setMenu(null);
  };

  const openSpecialSectionEditorById = (section: SpecialSection) => {
    setSpecialSecEdit({ id: section.id, categoryId: section.categoryId || '', title: section.title || '' });
  };

  const openSpecialSectionEditor = () => {
    if (!menu) return;
    const section = sections.find((s) => s.kind === 'special' && s.id === menu.sliderSectionId) as SpecialSection | undefined;
    if (!section) return;
    openSpecialSectionEditorById(section);
    setMenu(null);
  };

  const saveSpecialSection = async () => {
    if (!specialSecEdit) return;
    const section: SpecialSection = {
      id: specialSecEdit.id,
      kind: 'special',
      categoryId: specialSecEdit.categoryId || undefined,
      title: specialSecEdit.title.trim() || undefined,
    };
    try {
      await saveSections(sections.map((s) => (s.kind === 'special' && s.id === section.id ? section : s)));
      setSpecialSecEdit(null);
      notify('Bloc mis à jour');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
    }
  };

  const deleteSpecialSection = async () => {
    if (!menu || !menu.sliderSectionId) return;
    if (!window.confirm('Supprimer ce bloc de la page ?')) return;
    const next = sections.filter((s) => s.kind !== 'special' || s.id !== menu.sliderSectionId);
    try {
      await saveSections(next);
      notify('Bloc supprimé');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
    }
    setMenu(null);
  };

  const secPatch = (patch: Partial<SliderSectionDraft>) => {
    setSecSliderEdit((s) => (s ? { ...s, section: { ...s.section, ...patch } } : s));
  };

  const secSlideNew = () => {
    setSecSliderEdit((s) =>
      s
        ? {
            ...s,
            editing: { id: uid(), imageUrl: '', label: '', linkType: 'url', url: '#shop' },
          }
        : s
    );
  };

  const secSlideFromProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setSecSliderEdit((s) =>
      s
        ? {
            ...s,
            section: {
              ...s.section,
              slides: [
                ...s.section.slides,
                { id: uid(), imageUrl: p.imageUrl || '', label: p.name, linkType: 'product', productId: p.id },
              ],
            },
          }
        : s
    );
  };

  const secSlideOpen = (item: SecSlideDraft) => {
    setSecSliderEdit((s) => (s ? { ...s, editing: { ...item } } : s));
  };

  const secSlidePatch = (patch: Partial<SecSlideDraft>) => {
    setSecSliderEdit((s) => (s && s.editing ? { ...s, editing: { ...s.editing, ...patch } } : s));
  };

  const secSlideLinkType = (t: SecSlideDraft['linkType']) => {
    setSecSliderEdit((s) =>
      s && s.editing
        ? { ...s, editing: { ...s.editing, linkType: t, categoryName: t === 'category' ? s.editing.categoryName : undefined, productId: t === 'product' ? s.editing.productId : undefined, url: t === 'url' ? s.editing.url : undefined } }
        : s
    );
  };

  const secSlideMove = (i: number, dir: number) => {
    setSecSliderEdit((s) => {
      if (!s) return s;
      const j = i + dir;
      if (j < 0 || j >= s.section.slides.length) return s;
      const slides = [...s.section.slides];
      [slides[i], slides[j]] = [slides[j], slides[i]];
      return { ...s, section: { ...s.section, slides } };
    });
  };

  const secSlideDelete = (id: string) => {
    setSecSliderEdit((s) =>
      s
        ? {
            ...s,
            section: { ...s.section, slides: s.section.slides.filter((x) => x.id !== id) },
            editing: s.editing?.id === id ? null : s.editing,
          }
        : s
    );
  };

  const secCleanSlide = (ed: SecSlideDraft): SecSlideDraft => ({
    id: ed.id,
    imageUrl: ed.imageUrl,
    label: ed.label?.trim() || undefined,
    linkType: ed.linkType,
    categoryName: ed.linkType === 'category' ? ed.categoryName?.trim() || undefined : undefined,
    productId: ed.linkType === 'product' ? ed.productId || undefined : undefined,
    url: ed.linkType === 'url' ? ed.url?.trim() || undefined : undefined,
  });

  const secUpsertEditing = (s: SliderSectionEditState): SliderSectionEditState => {
    if (!s.editing) return s;
    const slide = secCleanSlide(s.editing);
    const exists = s.section.slides.some((x) => x.id === slide.id);
    const slides = exists ? s.section.slides.map((x) => (x.id === slide.id ? slide : x)) : [...s.section.slides, slide];
    return { ...s, section: { ...s.section, slides } };
  };

  const secBackToList = () => setSecSliderEdit((s) => (s ? { ...secUpsertEditing(s), editing: null } : s));

  const saveSecSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secSliderEdit) return;
    try {
      const slides = secUpsertEditing(secSliderEdit).section.slides;
      const section: PageSection = {
        id: secSliderEdit.section.id,
        kind: 'slider',
        type: secSliderEdit.section.type,
        width: secSliderEdit.section.width,
        widthPct: secSliderEdit.section.widthPct,
        hero: secSliderEdit.section.hero,
        slides: slides.map((sl): SlideBlock => {
          const link: SlideLink =
            sl.linkType === 'category'
              ? { linkType: 'category', categoryName: sl.categoryName || '' }
              : sl.linkType === 'product'
                ? { linkType: 'product', productId: sl.productId || '' }
                : { linkType: 'url', url: sl.url || '#' };
          return { id: sl.id, imageUrl: sl.imageUrl, label: sl.label, link };
        }),
      };
      const next = sections.map((x) => (x.id === section.id ? section : x));
      if (!next.some((x) => x.id === section.id)) next.push(section);
      setSecSliderEdit((s) => (s ? { ...s, busy: true } : s));
      await saveSections(next);
      setSecSliderEdit((s) => (s ? { ...s, editing: null, busy: false } : s));
      notify('Slider sauvegardé');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
      setSecSliderEdit((s) => (s ? { ...s, busy: false } : s));
    }
  };

  const onSecImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
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
      secSlidePatch({ imageUrl: json.url });
      notify('Image téléversée');
    } catch (err) {
      notify((err as Error).message || 'Erreur');
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
      const isCreate = !editing.id;
      if (isCreate) {
        if (!vedetteCat) {
          setBusy(false);
          return notify('Catégorie Vedette introuvable');
        }
        fd.append('categoryId', vedetteCat.id!);
        fd.append('name', editing.name);
        fd.append('salePrice', String(editing.price || 0));
        if (editing.costPrice) fd.append('costPrice', String(editing.costPrice));
        fd.append('stockQty', String(editing.stockQty ?? 1));
        fd.append('isActive', 'true');
        const model = editing.modelUrl || editing.imageUrl;
        if (model) fd.append('modelUrl', model);
      } else {
        fd.append('catalogId', editing.id);
        fd.append('name', editing.name);
        fd.append('salePrice', String(editing.oldPrice ?? editing.price));
        fd.append('promoPrice', editing.oldPrice ? String(editing.price) : '');
        if (editing.costPrice) fd.append('costPrice', String(editing.costPrice));
        if (editing.imageUrl) fd.append('imageUrl', editing.imageUrl);
        const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[type=file]');
        const file = fileInput?.files?.[0];
        if (file) fd.append('image', file);
      }
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

      <div className="ec-tools">
        <button className="ec-tools-toggle ec-tools-secondary" onClick={openSpecialManager}>
          ⭐ Catégories spéciales
        </button>
        <button className="ec-tools-toggle" onClick={() => setToolsOpen((o) => !o)} aria-expanded={toolsOpen}>
          {toolsOpen ? '✕' : '🧩 Sliders'}
        </button>
        {toolsOpen && (
          <div className="ec-palette">
            <p className="ec-palette-title">Glissez un slider dans la page</p>
            {(Object.keys(SLIDER_TYPE_LABELS) as SliderType[]).map((t) => (
              <div key={t} className="ec-pal-card" draggable data-slider-type={t}>
                <div className={`ec-pal-preview ec-pal-${t}`} aria-hidden="true">
                  {t === 'horizontal' && <span className="bar b1" />}
                  {t === 'vertical' && <span className="bar b1" />}
                  {t === 'fade' && <><span className="layer l1" /><span className="layer l2" /></>}
                  {t === 'cards' && <><span className="card c1" /><span className="card c2" /><span className="card c3" /></>}
                  {t === 'coverflow' && <><span className="card c1" /><span className="card c2" /><span className="card c3" /></>}
                  {t === 'cube' && <span className="cube" />}
                  {t === 'flip' && <span className="card c1" />}
                  {t === 'grid' && <><span className="cell g1" /><span className="cell g2" /><span className="cell g3" /><span className="cell g4" /></>}
                </div>
                <span className="ec-pal-label">{SLIDER_TYPE_LABELS[t]}</span>
              </div>
            ))}
            <p className="ec-pal-hint">Astuce : clic droit sur un slider pour choisir les images et leurs liens.</p>
            <p className="ec-pal-title">⭐ Sections spéciales</p>
            <div className="ec-pal-card" draggable data-sec-type="special">
              <div className="ec-pal-preview ec-pal-special">⭐</div>
              <span className="ec-pal-label">Catégorie spéciale</span>
            </div>
          </div>
        )}
      </div>

      {menu && (
        <div className="ec-menu" style={{ left: Math.min(menu.x, window.innerWidth - 230), top: Math.min(menu.y, window.innerHeight - 160) }}>
          {menu.kind === 'text' && (
            <button className="ec-menu-item" onClick={startStructuredTextEdit}>
              {menu.textKey === 'marquee' ? '✏️ Modifier le texte défilant' : '✏️ Modifier le texte'}
            </button>
          )}
          {menu.kind === 'logo' && (
            <button
              className="ec-menu-item"
              onClick={() => {
                setLogoEdit({ url: (settings.logoUrl as string) || '' });
                setMenu(null);
              }}
            >
              🖼️ Changer le logo
            </button>
          )}
          {menu.kind === 'product' && (
            <>
              <button className="ec-menu-item" onClick={openProductEdit}>
                📦 Modifier le produit
              </button>
              <button className="ec-menu-item" onClick={() => openSpecialAssign('product')}>
                ⭐ Assigner à une catégorie spéciale
              </button>
            </>
          )}
          {menu.kind === 'vedette' &&
            (vedetteProduct ? (
              <>
                <button className="ec-menu-item" onClick={openVedetteEdit}>
                  📦 Modifier le produit (Vedette)
                </button>
                <button className="ec-menu-item" onClick={startModelUpload}>
                  🧊 Changer le modèle 3D
                </button>
                <button className="ec-menu-item ec-menu-danger" onClick={deleteVedette}>
                  🗑️ Supprimer le produit Vedette
                </button>
              </>
            ) : (
              <>
                <button className="ec-menu-item" onClick={openVedetteAdd}>
                  ➕ Ajouter le produit Vedette
                </button>
                {settings.model3d && (
                  <button className="ec-menu-item" onClick={startModelUpload}>
                    🧊 Changer le modèle 3D
                  </button>
                )}
              </>
            ))}
          {menu.kind === '3d' && (
            <button className="ec-menu-item" onClick={startModelUpload}>
              {products.some((p) => p.modelUrl) || settings.model3d
                ? '🧊 Changer le modèle 3D'
                : '🧊 Ajouter un modèle 3D'}
            </button>
          )}
          {menu.kind === 'category' && (
            <button className="ec-menu-item" onClick={openCategoryEdit}>
              🗂️ Modifier la catégorie
            </button>
          )}
          {menu.kind === 'banner' && (
            <>
              <button className="ec-menu-item" onClick={openBannerEdit}>
                🖼️ Changer l'image / la vidéo
              </button>
              <button className="ec-menu-item" onClick={() => openSpecialAssign('banner')}>
                ⭐ Assigner à une catégorie spéciale
              </button>
            </>
          )}
          {menu.kind === 'slider' && (
            <button className="ec-menu-item" onClick={openSliderPicker}>
              🎯 Choisir les produits du slider
            </button>
          )}
          {menu.kind === 'sliderSection' && (
            <>
              <button className="ec-menu-item" onClick={openSecSliderEditor}>
                🖼️ Modifier le slider (images)
              </button>
              <button className="ec-menu-item" onClick={() => openSpecialAssign('slider')}>
                ⭐ Assigner à une catégorie spéciale
              </button>
              <button className="ec-menu-item ec-menu-danger" onClick={deleteSliderSection}>
                🗑️ Supprimer ce slider
              </button>
            </>
          )}
          {menu.kind === 'specialSection' && (
            <>
              <button className="ec-menu-item" onClick={openSpecialSectionEditor}>
                ⭐ Modifier la catégorie spéciale
              </button>
              <button className="ec-menu-item ec-menu-danger" onClick={deleteSpecialSection}>
                🗑️ Supprimer ce bloc
              </button>
            </>
          )}
        </div>
      )}

      {editing && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <form className="ec-modal-card" onSubmit={saveProduct}>
            <div className="ec-modal-head">
              <span>{editing.id ? 'Modifier le produit' : 'Ajouter un produit Vedette'}</span>
              <button type="button" className="ec-close" onClick={() => setEditing(null)}>
                ×
              </button>
            </div>
            {!editing.id && (
              <label>
                À partir d'un produit existant
                <select value={sourceId} onChange={pickSourceProduct}>
                  <option value="">— Créer un nouveau produit —</option>
                  {products
                    .filter((p) => p.id && !p.modelUrl)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.price.toLocaleString('fr-FR')} DA
                      </option>
                    ))}
                </select>
              </label>
            )}
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
              Coût d'achat (DA)
              <input
                type="number"
                min="0"
                value={editing.costPrice ?? ''}
                placeholder="Prix auquel on l'achète"
                onChange={(e) => setEditing({ ...editing, costPrice: e.target.value ? Number(e.target.value) : 0 })}
              />
            </label>
            {editing.id && (
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
            )}
            <label>
              {editing.id ? 'Image (URL ou fichier)' : 'Modèle 3D (URL)'}
              <input value={editing.imageUrl || ''} placeholder="https://… ou /uploads/models/…" onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} />
            </label>
            {editing.id ? (
              <label>
                Image (fichier local)
                <input type="file" accept="image/*" />
              </label>
            ) : (
              <button type="button" className="ec-upload-btn" onClick={startModelUpload}>
                📤 Importer un fichier modèle (.glb/.gltf/.fbx/.obj)
              </button>
            )}
            <div className="ec-modal-actions">
              {editing.id ? (
                <button type="button" className="ec-danger" onClick={deleteProduct} disabled={busy}>
                  Supprimer
                </button>
              ) : (
                <span />
              )}
              <button type="submit" className="ec-save" disabled={busy}>
                {busy ? '…' : editing.id ? 'Enregistrer' : 'Ajouter'}
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
            {isVedette(catEdit.name) && (
              <p className="ec-hint">🔒 Catégorie Vedette protégée — elle reste toujours affichée en premier et ne peut pas être supprimée.</p>
            )}
            <div className="ec-modal-actions">
              {catEdit.id && !isVedette(catEdit.name) ? (
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

      {logoEdit && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <form className="ec-modal-card" onSubmit={saveLogo}>
            <div className="ec-modal-head">
              <span>Logo de la boutique</span>
              <button type="button" className="ec-close" onClick={() => setLogoEdit(null)}>
                ×
              </button>
            </div>
            <label>
              Logo (URL)
              <input
                value={logoEdit.url}
                placeholder="https://… ou /uploads/images/…"
                onChange={(e) => setLogoEdit({ ...logoEdit, url: e.target.value })}
              />
            </label>
            {logoEdit.url && (
              <div className="ec-thumb">
                <img src={logoEdit.url} alt="aperçu" />
              </div>
            )}
            <label>
              Logo (fichier local)
              <input type="file" accept="image/*,.svg" onChange={onLogoImageFile} />
            </label>
            <div className="ec-modal-actions">
              <button type="button" className="ec-save-ghost" onClick={() => setLogoEdit(null)}>
                Annuler
              </button>
              <button type="submit" className="ec-save" disabled={logoBusy}>
                {logoBusy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {bannerEdit && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <form className="ec-modal-card" onSubmit={saveBanner}>
            <div className="ec-modal-head">
              <span>Bannière — image ou vidéo</span>
              <button type="button" className="ec-close" onClick={() => setBannerEdit(null)}>
                ×
              </button>
            </div>
            <label>
              URL (image ou vidéo)
              <input
                value={bannerEdit.url}
                placeholder="https://… ou /uploads/images/… /uploads/videos/…"
                onChange={(e) => setBannerEdit({ ...bannerEdit, url: e.target.value })}
              />
            </label>
            {bannerEdit.url && (
              <div className="ec-media-preview">
                {bannerEdit.type === 'video' ? (
                  <video src={bannerEdit.url} muted autoPlay loop playsInline />
                ) : (
                  <img src={bannerEdit.url} alt="aperçu" />
                )}
              </div>
            )}
            <label>
              Fichier local (image ou vidéo)
              <input type="file" accept="image/*,.svg,video/mp4,video/webm" onChange={onBannerFile} />
            </label>
            <div className="ec-modal-actions">
              <button type="button" className="ec-save-ghost" onClick={() => setBannerEdit(null)}>
                Annuler
              </button>
              <button type="submit" className="ec-save" disabled={bannerBusy}>
                {bannerBusy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {sliderEdit && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <form className="ec-modal-card" onSubmit={saveSlider}>
            <div className="ec-modal-head">
              <span>Produits du slider</span>
              <button type="button" className="ec-close" onClick={() => setSliderEdit(null)}>
                ×
              </button>
            </div>
            <label>
              Rechercher
              <input
                value={sliderEdit.q}
                placeholder="Nom du produit…"
                onChange={(e) => setSliderEdit({ ...sliderEdit, q: e.target.value })}
              />
            </label>
            <div className="ec-slider-list">
              {products
                .filter((p) => !sliderEdit.q || p.name.toLowerCase().includes(sliderEdit.q.toLowerCase()))
                .map((p) => {
                  const checked = sliderEdit.ids.includes(p.id);
                  return (
                    <label key={p.id} className="ec-slider-row">
                      <input type="checkbox" checked={checked} onChange={() => toggleSliderProduct(p.id)} />
                      <span className="ec-slider-name">{p.name}</span>
                      <span className="ec-slider-price">{p.price.toLocaleString('fr-FR')} DA</span>
                    </label>
                  );
                })}
              {products.length === 0 ? <p className="ec-muted">Aucun produit disponible.</p> : null}
            </div>
            <div className="ec-modal-actions">
              <button type="button" className="ec-save-ghost" onClick={() => setSliderEdit(null)}>
                Annuler
              </button>
              <button type="submit" className="ec-save" disabled={busy}>
                {busy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {textEdit && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <form className="ec-modal-card" onSubmit={(e) => { e.preventDefault(); void saveTexts(); }}>
            <div className="ec-modal-head">
              <span>{textEdit.marquee ? 'Texte défilant' : 'Modifier le texte'}</span>              <button type="button" className="ec-close" onClick={() => setTextEdit(null)}>
                ×
              </button>
            </div>
            {textEdit.marquee ? (
              <div className="ec-text-rows">
                {textEdit.rows.map((row, i) => (
                  <div className="ec-text-row" key={i}>
                    <span className="ec-text-idx">{i + 1}</span>
                    <input
                      value={row}
                      placeholder={`Texte ${i + 1}`}
                      onChange={(e) =>
                        setTextEdit((s) => (s ? { ...s, rows: s.rows.map((r, j) => (j === i ? e.target.value : r)) } : s))
                      }
                    />
                    <button
                      type="button"
                      className="ec-qty-btn"
                      onClick={() => setTextEdit((s) => (s ? { ...s, rows: s.rows.filter((_, j) => j !== i) } : s))}
                    >
                      ×
                    </button>
                    <button type="button" className="ec-qty-btn" onClick={() => moveRow(i, -1)} disabled={i === 0}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="ec-qty-btn"
                      onClick={() => moveRow(i, 1)}
                      disabled={i === textEdit.rows.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="ec-add-row"
                  onClick={() => setTextEdit((s) => (s ? { ...s, rows: [...s.rows, ''] } : s))}
                >
                  + Ajouter une ligne
                </button>
              </div>
            ) : (
              <div className="ec-text-rows">
                {textEdit.runs.map((run, i) => (
                  <div className="ec-text-run" key={i}>
                    <div className="ec-text-run-line">
                      <input
                        value={run.text}
                        placeholder="Texte du mot…"
                        onChange={(e) => updateRun(i, { text: e.target.value })}
                      />
                      <button
                        type="button"
                        className="ec-qty-btn"
                        onClick={() => setTextEdit((s) => (s ? { ...s, runs: s.runs.filter((_, j) => j !== i) } : s))}
                      >
                        ×
                      </button>
                    </div>
                    <div className="ec-text-run-style">
                      <input
                        type="color"
                        value={run.color || '#00e5ff'}
                        title="Couleur"
                        onChange={(e) => updateRun(i, { color: e.target.value })}
                      />
                      <input
                        value={run.color || ''}
                        placeholder="Couleur (ex: #00e5ff)"
                        onChange={(e) => updateRun(i, { color: e.target.value })}
                      />
                      <select value={run.font || ''} onChange={(e) => updateRun(i, { font: e.target.value })}>
                        <option value="">Police par défaut</option>
                        <option value="'Sora', sans-serif">Sora</option>
                        <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                        <option value="ui-monospace, monospace">Monospace</option>
                      </select>
                    </div>
                    {run.cls ? <p className="ec-hint">Conserve le style « {run.cls} » (accent).</p> : null}
                  </div>
                ))}
                <button
                  type="button"
                  className="ec-add-row"
                  onClick={() => setTextEdit((s) => (s ? { ...s, runs: [...s.runs, { text: '' }] } : s))}
                >
                  + Ajouter un mot
                </button>
              </div>
            )}
            <div className="ec-modal-actions">
              <button type="button" className="ec-save-ghost" onClick={() => setTextEdit(null)}>
                Annuler
              </button>
              <button type="submit" className="ec-save" disabled={busy}>
                {busy ? '…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".glb,.gltf,.fbx,.obj" style={{ display: 'none' }} onChange={onModelFile} />

      {secSliderEdit && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <form className="ec-modal-card" onSubmit={saveSecSlider}>
            <div className="ec-modal-head">
              <span>Slider — images</span>
              <button type="button" className="ec-close" onClick={() => setSecSliderEdit(null)}>
                ×
              </button>
            </div>            {secSliderEdit.editing ? (
              <>
                <label>
                  Image (URL)
                  <input
                    value={secSliderEdit.editing.imageUrl}
                    placeholder="https://… ou /uploads/images/…"
                    onChange={(e) => secSlidePatch({ imageUrl: e.target.value })}
                  />
                </label>
                {secSliderEdit.editing.imageUrl && (
                  <div className="ec-thumb">
                    <img src={secSliderEdit.editing.imageUrl} alt="aperçu" />
                  </div>
                )}
                <label>
                  Image (fichier local)
                  <input type="file" accept="image/*" onChange={onSecImageFile} />
                </label>
                <label>
                  Nom / étiquette (optionnel)
                  <input
                    value={secSliderEdit.editing.label || ''}
                    placeholder="Ex : Clavier gamer"
                    onChange={(e) => secSlidePatch({ label: e.target.value })}
                  />
                </label>
                <label>Lien quand on clique sur l'image</label>
                <div className="ec-seg">
                  {(['category', 'product', 'url'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`ec-seg-btn${secSliderEdit.editing?.linkType === t ? ' ec-seg-active' : ''}`}
                      onClick={() => secSlideLinkType(t)}
                    >
                      {t === 'category' ? 'Catégorie' : t === 'product' ? 'Produit' : 'Lien'}
                    </button>
                  ))}
                </div>
                {secSliderEdit.editing.linkType === 'category' && (
                  <label>
                    Catégorie
                    <select value={secSliderEdit.editing.categoryName || ''} onChange={(e) => secSlidePatch({ categoryName: e.target.value })}>
                      <option value="">— Choisir une catégorie —</option>
                      {categories.map((c) => (
                        <option key={String(c.id)} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {secSliderEdit.editing.linkType === 'product' && (
                  <label>
                    Produit
                    <select value={secSliderEdit.editing.productId || ''} onChange={(e) => secSlidePatch({ productId: e.target.value })}>
                      <option value="">— Choisir un produit —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.price.toLocaleString('fr-FR')} DA
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {secSliderEdit.editing.linkType === 'url' && (
                  <label>
                    URL
                    <input
                      value={secSliderEdit.editing.url || ''}
                      placeholder="#shop, /page, https://…"
                      onChange={(e) => secSlidePatch({ url: e.target.value })}
                    />
                  </label>
                )}
                <div className="ec-modal-actions">
                  <button type="button" className="ec-save-ghost" onClick={secBackToList}>
                    Retour à la liste
                  </button>
                  <button type="submit" className="ec-save" disabled={secSliderEdit.busy}>
                    {secSliderEdit.busy ? '…' : 'Enregistrer'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label>
                  Type d'animation
                  <select value={secSliderEdit.section.type} onChange={(e) => secPatch({ type: e.target.value as SliderType })}>
                    {(Object.keys(SLIDER_TYPE_LABELS) as SliderType[]).map((t) => (
                      <option key={t} value={t}>
                        {SLIDER_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Largeur
                  <select value={secSliderEdit.section.width} onChange={(e) => secPatch({ width: e.target.value as SliderWidth })}>
                    {(Object.keys(SLIDER_WIDTH_LABELS) as SliderWidth[]).map((w) => (
                      <option key={w} value={w}>
                        {SLIDER_WIDTH_LABELS[w]}
                      </option>
                    ))}
                  </select>
                </label>
                {secSliderEdit.section.width === 'custom' && (
                  <label>
                    Largeur personnalisée
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={secSliderEdit.section.widthPct ?? 50}
                      onChange={(e) => secPatch({ widthPct: Math.min(100, Math.max(10, Number(e.target.value) || 50)) })}
                    />
                    <span className="ec-hint">% de la largeur de la page — placez-le n'importe où sans chevaucher les autres blocs.</span>
                  </label>
                )}
                {secSliderEdit.section.hero && (
                  <label className="ec-check">
                    <input type="checkbox" checked={Boolean(secSliderEdit.section.hero)} onChange={(e) => secPatch({ hero: e.target.checked })} />
                    Grande bannière (plein écran)
                  </label>
                )}
                <div className="ec-slider-list">
                  {secSliderEdit.section.slides.map((s, i) => (
                    <div key={s.id} className="ec-slider-row">
                      {s.imageUrl ? (
                        <img src={s.imageUrl} className="ec-slide-thumb" alt="" />
                      ) : (
                        <span className="ec-slide-thumb ec-slide-thumb-empty">img</span>
                      )}
                      <span className="ec-slider-name">
                        {s.label || (s.linkType === 'category' ? s.categoryName : s.linkType === 'product' ? products.find((p) => p.id === s.productId)?.name : s.url) || 'Image sans lien'}
                      </span>
                      <button type="button" className="ec-qty-btn" onClick={() => secSlideMove(i, -1)} disabled={i === 0}>
                        ↑
                      </button>
                      <button type="button" className="ec-qty-btn" onClick={() => secSlideMove(i, 1)} disabled={i === secSliderEdit.section.slides.length - 1}>
                        ↓
                      </button>
                      <button type="button" className="ec-qty-btn" onClick={() => secSlideOpen(s)}>
                        ✏️
                      </button>
                      <button type="button" className="ec-qty-btn" onClick={() => secSlideDelete(s.id)}>
                        ×
                      </button>
                    </div>
                  ))}
                  {secSliderEdit.section.slides.length === 0 && <p className="ec-muted">Aucune image. Cliquez sur « + Ajouter ».</p>}
                </div>
                <label className="ec-slider-add-product">
                  ➕ Ajouter depuis un produit
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        secSlideFromProduct(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="" disabled>
                      Choisir un produit…
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ec-modal-actions">
                  <button type="button" className="ec-save-ghost" onClick={() => setSecSliderEdit(null)}>
                    Annuler
                  </button>
                  <button type="button" className="ec-save" onClick={secSlideNew}>
                    + Ajouter une image
                  </button>
                  <button type="submit" className="ec-save" disabled={secSliderEdit.busy}>
                    {secSliderEdit.busy ? '…' : 'Enregistrer'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {specialAssign && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="ec-modal-card">
            <div className="ec-modal-head">
              <span>⭐ Assigner à une catégorie spéciale</span>
              <button type="button" className="ec-close" onClick={() => setSpecialAssign(null)}>
                ×
              </button>
            </div>
            <div className="ec-sc-assign">
              <p className="ec-muted">
                « {specialAssign.label} » → choisissez une catégorie ou créez-en une nouvelle.
              </p>
              {specialCats.length === 0 && <p className="ec-muted">Aucune catégorie pour le moment.</p>}
              {specialCats.map((c) => (
                <label key={c.id} className="ec-sc-radio">
                  <input
                    type="radio"
                    name="sc"
                    checked={specialAssign.scId === c.id}
                    onChange={() => setSpecialAssign({ ...specialAssign, scId: c.id })}
                  />
                  <span>{c.name}</span>
                </label>
              ))}
              <label>
                Nouvelle catégorie
                <input
                  value={specialAssign.newName}
                  placeholder="Nom (ex : Promo Ramadan)"
                  onChange={(e) => setSpecialAssign({ ...specialAssign, newName: e.target.value })}
                />
              </label>
            </div>
            <div className="ec-modal-actions">
              <button type="button" className="ec-save-ghost" onClick={() => setSpecialAssign(null)}>
                Annuler
              </button>
              <button type="button" className="ec-save" onClick={doSpecialAssign}>
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}

      {specialMgr && specialDraft && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="ec-modal-card ec-sc-manager">
            <div className="ec-modal-head">
              <span>⭐ Catégories spéciales</span>
              <button type="button" className="ec-close" onClick={() => setSpecialMgr(false)}>
                ×
              </button>
            </div>
            <div className="ec-sc-list">
              {specialDraft.length === 0 && (
                <p className="ec-muted">Aucune catégorie spéciale. Créez-en une avec le bouton ci-dessous.</p>
              )}
              {specialDraft.map((c, i) => (
                <div key={c.id} className="ec-sc-box">
                  <div className="ec-sc-row">
                    <input
                      className="ec-sc-name"
                      value={c.name}
                      placeholder="Nom (ex : Promo Ramadan)"
                      onChange={(e) => specialPatch(c.id, { name: e.target.value })}
                    />
                    <button type="button" className="ec-qty-btn" onClick={() => specialMove(i, -1)} disabled={i === 0}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="ec-qty-btn"
                      onClick={() => specialMove(i, 1)}
                      disabled={i === specialDraft.length - 1}
                    >
                      ↓
                    </button>
                    <button type="button" className="ec-qty-btn ec-sc-del" onClick={() => specialDelete(c.id)}>
                      🗑️
                    </button>
                  </div>
                  <label>
                    Image de couverture
                    <input
                      value={c.imageUrl || ''}
                      placeholder="https://…"
                      onChange={(e) => specialPatch(c.id, { imageUrl: e.target.value })}
                    />
                  </label>
                  <div className="ec-sc-label">Sliders / images assignés</div>
                  <div className="ec-sc-items">
                    {c.sections.length === 0 && (
                      <span className="ec-muted">Aucun — clic droit sur un slider ou une image → « ⭐ Assigner ».</span>
                    )}
                    {c.sections.map((ref) => {
                      const info = specialRefInfo(ref);
                      return (
                        <div key={ref} className="ec-sc-item">
                          {info.img && <img className="ec-sc-thumb" src={info.img} alt="" />}
                          <span>{info.label}</span>
                          <button type="button" className="ec-qty-btn" onClick={() => specialRemoveRef(c.id, 'sections', ref)}>
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="ec-sc-label">Produits de la catégorie</div>
                  <div className="ec-sc-items">
                    {c.products.length === 0 && (
                      <span className="ec-muted">Aucun — clic droit sur un produit → « ⭐ Assigner ».</span>
                    )}
                    {c.products.map((pid) => {
                      const p = products.find((x) => x.id === pid);
                      return (
                        <div key={pid} className="ec-sc-item">
                          {p?.imageUrl && <img className="ec-sc-thumb" src={p.imageUrl} alt="" />}
                          <span>{p ? `${p.name} — ${p.price.toLocaleString('fr-FR')} DA` : 'Produit supprimé'}</span>
                          <button type="button" className="ec-qty-btn" onClick={() => specialRemoveRef(c.id, 'products', pid)}>
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="ec-modal-actions">
              <button type="button" className="ec-save-ghost" onClick={() => setSpecialMgr(false)}>
                Fermer
              </button>
              <button type="button" className="ec-save-ghost" onClick={specialAdd}>
                + Nouvelle catégorie
              </button>
              <button type="button" className="ec-save" onClick={saveSpecialManager}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {specialSecEdit && (
        <div className="ec-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="ec-modal-card">
            <div className="ec-modal-head">
              <span>⭐ Bloc catégorie spéciale</span>
              <button type="button" className="ec-close" onClick={() => setSpecialSecEdit(null)}>
                ×
              </button>
            </div>
            {specialCats.length === 0 ? (
              <p className="ec-muted">
                Aucune catégorie spéciale. Créez-en une d'abord avec le bouton « ⭐ Catégories spéciales ».
              </p>
            ) : (
              <label>
                Catégorie spéciale
                <select
                  value={specialSecEdit.categoryId}
                  onChange={(e) => setSpecialSecEdit({ ...specialSecEdit, categoryId: e.target.value })}
                >
                  {specialCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Titre (optionnel)
              <input
                value={specialSecEdit.title}
                placeholder="Nom affiché au-dessus des produits"
                onChange={(e) => setSpecialSecEdit({ ...specialSecEdit, title: e.target.value })}
              />
            </label>
            <div className="ec-modal-actions">
              <button type="button" className="ec-save-ghost" onClick={() => setSpecialSecEdit(null)}>
                Annuler
              </button>
              <button type="button" className="ec-save" onClick={saveSpecialSection} disabled={specialCats.length === 0}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ec-toast">{toast}</div>}
    </>
  );
}
