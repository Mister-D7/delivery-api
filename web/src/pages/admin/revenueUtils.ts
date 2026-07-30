export const fmt = (n: number) => n.toLocaleString('fr-FR');
export const DA = (n: number) => `${fmt(n)} DA`;

export const LAYOUT_KEY = 'revenue_cards_layout';
export const HIDDEN_KEY = 'revenue_cards_hidden';

export function loadLayout(): string[] | null {
  try { const raw = localStorage.getItem(LAYOUT_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveLayout(ids: string[]) { localStorage.setItem(LAYOUT_KEY, JSON.stringify(ids)); }
export function loadHidden(): string[] {
  try { const raw = localStorage.getItem(HIDDEN_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
export function saveHidden(ids: string[]) { localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids)); }

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
