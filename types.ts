
export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary'
}

export interface Fish {
  id: string;
  name: string;
  value: number;
  rarity: Rarity;
  imageUrl?: string; // Optional URL if we had specific images
  description: string;
}

export interface Upgrade {
  id: string;
  name: string;
  cost: number;
  type: 'rod' | 'bait' | 'boat';
  multiplier: number;
  description: string;
}

export type QuestType = 'CATCH_ANY' | 'CATCH_RARE' | 'EARN_GOLD';

export interface Quest {
  id: string;
  type: QuestType;
  description: string;
  target: number;
  progress: number;
  reward: number;
  isClaimed: boolean;
}

export interface PlayerStats {
  totalGoldEarned: number;
  totalFishCaught: number;
  legendaryFishCaught: number;
}

export interface GameState {
  money: number;
  vip: boolean;
  inventory: Fish[];
  rodLevel: number;
  baitLevel: number;
  depthLevel: number;
  bucketLevel: number;
  dockLevel: number;
  quests: Quest[];
  stats: PlayerStats;
}