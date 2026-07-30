export type StoreType = 'tech' | 'gaming' | 'clothes' | 'grocery' | 'food' | 'general';

export interface Template {
  id: string;
  name: string;
  storeType: StoreType;
  description: string;
  preview: string;
  theme: {
    fontFamily: string;
    bgColor: string;
    surfaceColor: string;
    textColor: string;
    accentColor: string;
    glowColor: string;
    glowEnabled: boolean;
    animationEnabled: boolean;
    glassEnabled: boolean;
  };
  html: string;
}

export const STORE_TYPES: { type: StoreType; label: string; emoji: string }[] = [
  { type: 'tech', label: 'Tech', emoji: '🖥️' },
  { type: 'gaming', label: 'Gaming', emoji: '🎮' },
  { type: 'clothes', label: 'Vêtements & Mode', emoji: '👔' },
  { type: 'grocery', label: 'Épicerie & Bio', emoji: '🛒' },
  { type: 'food', label: 'Food & Agro', emoji: '🍽️' },
  { type: 'general', label: 'Autre / Général', emoji: '📦' },
];

import nexusGaming from './tech-gaming';
import vestiaire from './vetement';
import organicBio from './epicerie-bio';
import foodBroker from './food-broker';
import electroTech from './electro-tech';
import eshopperGeneral from './eshopper-general';
import ministoreGeneral from './ministore-general';
import kairaClothes from './kaira-clothes';

let _registry: Template[] = [];

function registerTemplate(t: Template) {
  _registry.push(t);
}

registerTemplate(nexusGaming);
registerTemplate(vestiaire);
registerTemplate(organicBio);
registerTemplate(foodBroker);
registerTemplate(electroTech);
registerTemplate(eshopperGeneral);
registerTemplate(ministoreGeneral);
registerTemplate(kairaClothes);

export function getTemplates(storeType?: StoreType): Template[] {
  if (!storeType || storeType === 'general') return _registry;
  return _registry.filter(t => t.storeType === storeType || t.storeType === 'general');
}

export function getTemplate(id: string): Template | undefined {
  return _registry.find(t => t.id === id);
}
