import { useStorefront } from '../lib/storefront';
import type { StorefrontTexts } from '../lib/data';

function textValue(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    return v
      .map((r) =>
        r && typeof r === 'object' && typeof (r as { text?: unknown }).text === 'string'
          ? (r as { text: string }).text
          : ''
      )
      .join(' ')
      .trim();
  }
  if (typeof v === 'object') {
    const runs = (v as { runs?: unknown }).runs;
    if (Array.isArray(runs)) {
      return runs
        .map((r) =>
          r && typeof r === 'object' && typeof (r as { text?: unknown }).text === 'string'
            ? (r as { text: string }).text
            : ''
        )
        .join(' ')
        .trim();
    }
    if (typeof (v as { text?: unknown }).text === 'string') return (v as { text: string }).text;
  }
  return '';
}

export default function GreensFooter() {
  const { settings } = useStorefront();
  const texts = (settings.texts ?? {}) as StorefrontTexts;
  const phone = textValue(texts.contactPhone) || textValue(texts.phone);
  const email = textValue(texts.contactEmail) || textValue(texts.email);
  const facebook = textValue(texts.socialFacebook);
  const instagram = textValue(texts.socialInstagram);
  return (
    <div className="og-footer-contact">
      <a
        href={phone ? `tel:${phone.replace(/\s+/g, '')}` : undefined}
        data-edit-text="contactPhone"
        data-text-key="contactPhone"
      >
        {phone || 'Téléphone'}
      </a>
      <a
        href={email ? `mailto:${email}` : undefined}
        data-edit-text="contactEmail"
        data-text-key="contactEmail"
      >
        {email || 'Email'}
      </a>
      <a
        href={facebook || undefined}
        target={facebook ? '_blank' : undefined}
        rel={facebook ? 'noreferrer' : undefined}
        data-edit-text="socialFacebook"
        data-text-key="socialFacebook"
      >
        {facebook || 'Facebook'}
      </a>
      <a
        href={instagram || undefined}
        target={instagram ? '_blank' : undefined}
        rel={instagram ? 'noreferrer' : undefined}
        data-edit-text="socialInstagram"
        data-text-key="socialInstagram"
      >
        {instagram || 'Instagram'}
      </a>
    </div>
  );
}
