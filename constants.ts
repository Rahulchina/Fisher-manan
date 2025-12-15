import { Fish, Rarity } from './types';

export const FISH_TYPES: Omit<Fish, 'id'>[] = [
  // Common
  { name: 'Minnow', value: 5, rarity: Rarity.COMMON, description: 'A small, common fish.' },
  { name: 'Bass', value: 15, rarity: Rarity.COMMON, description: 'A sturdy freshwater favorite.' },
  { name: 'Mackerel', value: 12, rarity: Rarity.COMMON, description: 'Shiny and plentiful.' },
  { name: 'Old Boot', value: 1, rarity: Rarity.COMMON, description: 'Well, it has a sole...' },
  { name: 'Tin Can', value: 2, rarity: Rarity.COMMON, description: 'Recycling is important.' },

  // Rare
  { name: 'Neon Tetra', value: 35, rarity: Rarity.RARE, description: 'Glowing with energy.' },
  { name: 'Golden Carp', value: 80, rarity: Rarity.RARE, description: 'Shimmers in the sunlight.' },
  { name: 'Ruby Snapper', value: 65, rarity: Rarity.RARE, description: 'A deep red beauty.' },
  { name: 'Electric Ray', value: 90, rarity: Rarity.RARE, description: 'Shockingly beautiful.' },

  // Epic
  { name: 'Cyber Shark', value: 200, rarity: Rarity.EPIC, description: 'Mechanized predator.' },
  { name: 'Void Glider', value: 250, rarity: Rarity.EPIC, description: 'Swims through the spaces between water molecules.' },
  { name: 'Sapphire Fin', value: 300, rarity: Rarity.EPIC, description: 'Crystal clear and cold to the touch.' },

  // Legendary
  { name: 'Quantum Eel', value: 500, rarity: Rarity.LEGENDARY, description: 'Exists in two places at once.' },
  { name: 'Nano Bananafish', value: 1000, rarity: Rarity.LEGENDARY, description: 'Powered by AI energy.' },
  { name: 'Chrono-Carp', value: 1200, rarity: Rarity.LEGENDARY, description: 'It was caught tomorrow.' },
  { name: 'Galaxy Koi', value: 1500, rarity: Rarity.LEGENDARY, description: 'Contains a tiny universe inside.' },
];
