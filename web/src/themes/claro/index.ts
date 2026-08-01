import type { ComponentType } from 'react';
import type { ThemeData, ThemePage } from '../index';
import Component from './page.mdx';

const claro: ThemePage = {
  id: 'claro',
  name: 'Claro',
  storeType: 'general',
  description: 'Clair, épuré, chaleureux — parfait pour toute boutique.',
  preview: '',
  defaults: {
    accent: '#e07a5f',
    bg: '#fdf6ef',
    surface: '#ffffff',
    ink: '#3d3a37',
    font: "'Nunito Sans', 'Inter', sans-serif",
    radius: '16px',
    glow: false,
    glass: false,
    animation: true,
  },
  Component: Component as unknown as ComponentType<ThemeData>,
};

export default claro;
