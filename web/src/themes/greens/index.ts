import type { ComponentType } from 'react';
import type { ThemeData, ThemePage } from '../index';
import DefaultPage from '../ui/DefaultPage';

const greens: ThemePage = {
  id: 'greens',
  name: 'Greens Market',
  storeType: 'grocery',
  description: 'Épicerie & Bio claire et fraîche — vert nature, rayons fruits & légumes, design Organic.',
  preview: '/templates/previews/epicerie-bio.svg',
  defaults: {
    accent: '#6bb252',
    bg: '#ffffff',
    surface: '#f8f8f8',
    ink: '#222222',
    font: "'Inter', system-ui, sans-serif",
    radius: '12px',
    glow: false,
    glass: false,
    animation: true,
  },
  Component: DefaultPage as unknown as ComponentType<ThemeData>,
};

export default greens;
