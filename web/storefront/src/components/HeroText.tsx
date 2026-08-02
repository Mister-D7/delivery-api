import type { ReactNode } from 'react';
import { useStorefront } from '../lib/storefront';

const DEFAULT_TITLE: ReactNode = (
  <>
    Des PC gaming <span>prêts à dominer</span>
  </>
);

const DEFAULT_SUB =
  "Chaque configuration NEXUS est assemblée, câblée et testée en charge dans notre atelier avant expédition. Aucune surprise, aucune attente inutile — juste des performances vérifiées.";

export default function HeroText() {
  const { settings } = useStorefront();
  const sub = settings.tagline;
  return (
    <>
      <h1 className="hero-title">{DEFAULT_TITLE}</h1>
      <p className="hero-sub" data-edit-text="tagline">{sub || DEFAULT_SUB}</p>
    </>
  );
}
