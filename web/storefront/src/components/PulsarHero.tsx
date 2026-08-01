import type { ReactNode } from 'react';
import { useStorefront } from '../lib/storefront';

const DEFAULT_EYEBROW = 'Nouveauté — En stock';
const DEFAULT_TITLE: ReactNode = (
  <>
    La puissance qui <span className="grad">vous accompagne</span>
  </>
);
const DEFAULT_SUB =
  'Une gamme pensée comme un seul système connecté : charge rapide, design compact, autonomie qui dure.';

export default function PulsarHero() {
  const { settings } = useStorefront();
  const title = settings.bannerText;
  const sub = settings.tagline;
  return (
    <>
      <span className="eyebrow">{settings.storeName ? DEFAULT_EYEBROW : DEFAULT_EYEBROW}</span>
      <h1 className="hero-title">{title || DEFAULT_TITLE}</h1>
      <p className="hero-sub">{sub || DEFAULT_SUB}</p>
    </>
  );
}
