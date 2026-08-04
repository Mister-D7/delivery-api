export interface TextRun {
  text: string;
  cls?: string;
  color?: string;
  font?: string;
}

export interface MarqueeText {
  rows: string[];
}

export type StoredText = TextRun[] | string | MarqueeText;

export function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function runsToHtml(runs?: TextRun[]): string {
  if (!runs || !runs.length) return '';
  return runs
    .map((r) => {
      const t = escapeHtml(r.text);
      if (!t) return '';
      const cls = r.cls ? ` class="${escapeHtml(r.cls)}"` : '';
      const styles: string[] = [];
      if (r.color) styles.push(`color:${r.color}`);
      if (r.font) styles.push(`font-family:${r.font}`);
      const style = styles.length ? ` style="${styles.join(';')}"` : '';
      return `<span${cls}${style}>${t}</span>`;
    })
    .join('');
}

export function parseElementRuns(el: Element): TextRun[] {
  const runs: TextRun[] = [];
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) runs.push({ text });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const n = node as HTMLElement;
      const text = (n.textContent || '').trim();
      if (!text) return;
      const run: TextRun = { text };
      if (n.className && typeof n.className === 'string') run.cls = n.className;
      const st = n.style;
      if (st.color) run.color = st.color;
      if (st.fontFamily) run.font = st.fontFamily;
      runs.push(run);
    }
  });
  return runs;
}
