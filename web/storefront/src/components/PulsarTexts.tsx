import { useEffect, useRef } from 'react';
import { useStorefront } from '../lib/storefront';
import { escapeHtml, runsToHtml, type MarqueeText, type TextRun } from '../lib/texts';

function applyMarquee(el: HTMLElement, stored: MarqueeText | TextRun[] | string | { runs: TextRun[] }) {
  const rows = Array.isArray(stored)
    ? stored.map((r) => r.text)
    : Array.isArray((stored as MarqueeText)?.rows)
      ? (stored as MarqueeText).rows
      : [];
  if (!rows.length) return;
  el.innerHTML = [...rows, ...rows]
    .map((r) => `<span>${escapeHtml(r)}</span>`)
    .join('');
}

function applyRuns(el: HTMLElement, stored: TextRun[] | string | { runs: TextRun[] }) {
  let runs: TextRun[] | null = null;
  if (typeof stored === 'string') runs = [{ text: stored }];
  else if (Array.isArray(stored)) runs = stored;
  else if (Array.isArray((stored as { runs?: TextRun[] })?.runs)) runs = (stored as { runs: TextRun[] }).runs;
  if (!runs || !runs.length) return;
  const html = runsToHtml(runs);
  if (html) el.innerHTML = html;
}

export default function PulsarTexts() {
  const { settings, status } = useStorefront();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current || status === 'loading') return;
    const texts = (settings as Record<string, unknown>).texts as
      | Record<string, TextRun[] | string | MarqueeText | { runs: TextRun[] }>
      | undefined;
    if (!texts) {
      appliedRef.current = true;
      return;
    }
    document.querySelectorAll<HTMLElement>('[data-text-key]').forEach((el) => {
      const key = el.getAttribute('data-text-key');
      if (!key) return;
      let stored = texts[key];
      if (!stored && key === 'storeName' && settings.storeName) stored = settings.storeName;
      else if (!stored && key === 'tagline' && settings.tagline) stored = settings.tagline;
      if (!stored) return;
      if (key === 'marquee') applyMarquee(el, stored);
      else applyRuns(el, stored as TextRun[] | string | { runs: TextRun[] });
    });
    appliedRef.current = true;
  }, [status, settings]);

  return null;
}
