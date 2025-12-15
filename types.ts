
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

export interface FoodItem {
  id: string;
  name: string;
  cost: number;
  energy: number;
  description: string;
}

export interface HiredFisherman {
  id: string;
  role: string;
  cost: number;
  incomePerSecond: number;
  hiredAt: number;
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

export interface CharacterConfig {
  skinColor: string;
  hairColor: string;
  hairStyle: 'bald' | 'short' | 'spiky' | 'long';
  shirtColor: string;
  vestColor: string;
  pantsColor: string;
  hatStyle: 'none' | 'bucket' | 'cap' | 'beanie' | 'cowboy';
  hatColor: string;
  clothingStyle: 'waders' | 'overalls' | 'casual' | 'suit' | 'sporty' | 'fantasy';
  facialHair: 'none' | 'beard';
  eyewear: 'none' | 'sunglasses' | 'glasses' | 'eyepatch';
  accessory: 'none' | 'necklace' | 'bracelet';
  accessoryColor: string;
}

export interface ShopCharacter {
  id: string;
  name: string;
  cost: number;
  description: string;
  bonusDescription: string;
  config: CharacterConfig;
  bonuses: {
    luck: number; // Flat add to roll
    waitReduction: number; // ms to reduce wait time
    valueMultiplier: number; // 1.0 = normal, 1.1 = +10%
  };
}

export interface GameState {
  playerName: string;
  money: number;
  vip: boolean;
  energy: number;
  maxEnergy: number;
  inventory: Fish[];
  rodLevel: number;
  baitLevel: number;
  depthLevel: number;
  bucketLevel: number;
  dockLevel: number;
  boatLevel: number;
  discoveredFish: string[];
  quests: Quest[];
  stats: PlayerStats;
  unlockedCharacters: string[];
  activeCharacterId: string;
  hiredFishermen: HiredFisherman[];
}