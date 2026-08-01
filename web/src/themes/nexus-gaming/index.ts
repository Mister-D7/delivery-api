import type { ComponentType } from 'react';
import type { ThemeData, ThemePage } from '../index';
import Component from './page.mdx';
import skinCss from './skin.css?inline';

const nexusGaming: ThemePage = {
  id: 'nexus-gaming',
  name: 'NEXUS Gaming',
  storeType: 'gaming',
  description: 'Boutique gaming premium NEXUS — sombre, rouge, séries PLAY/LUMEN, devis.',
  preview: '/templates/previews/tech-gaming.svg',
  defaults: {
    accent: '#ff3b30',
    bg: '#0a0a0c',
    surface: '#131316',
    ink: '#f5f5f7',
    font: "'Space Grotesk', 'Inter', sans-serif",
    radius: '14px',
    glow: true,
    glass: true,
    animation: true,
  },
  skinCss,
  Component: Component as unknown as ComponentType<ThemeData>,
};

export default nexusGaming;
