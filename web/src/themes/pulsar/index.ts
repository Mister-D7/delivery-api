import type { ComponentType } from 'react';
import type { ThemeData, ThemePage } from '../index';
import Component from './page.mdx';
import skinCss from './skin.css?inline';

const pulsar: ThemePage = {
  id: 'pulsar',
  name: 'Pulsar Tech',
  storeType: 'tech',
  description: 'Tech sombre néon — gradients cyan/violet, hero façon pulsar, porté du design PULSAR.',
  preview: '/templates/previews/tech-gaming.svg',
  defaults: {
    accent: '#00e5ff',
    bg: '#050508',
    surface: '#0c0c14',
    ink: '#f2f2f7',
    font: "'Space Grotesk', 'Sora', 'Inter', sans-serif",
    radius: '12px',
    glow: true,
    glass: true,
    animation: true,
  },
  skinCss,
  Component: Component as unknown as ComponentType<ThemeData>,
};

export default pulsar;
