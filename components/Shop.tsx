import React, { useState, useEffect } from 'react';
import { ShopCharacter, FoodItem, HiredFisherman, Fish } from '../types';
import { Button } from './Button';
import { TrendingUp, Crown, Zap, Anchor, Box, Hammer, User, Check, Utensils, Users, Ship, Shield, Coins, Trash2 } from 'lucide-react';

interface ShopProps {
  money: number;
  rodLevel: number;
  baitLevel: number;
  depthLevel: number;
  bucketLevel: number;
  dockLevel: number;
  boatLevel?: number;
  isVip: boolean;
  onUpgradeRod: (cost: number) => void;
  onUpgradeBait: (cost: number) => void;
  onUpgradeDepth: (cost: number) => void;
  onUpgradeBucket: (cost: number) => void;
  onUpgradeDock: (cost: number) => void;
  onUpgradeBoat?: (cost: number) => void;
  onBuyVip: (cost: number) => void;
  
  characters: ShopCharacter[];
  unlockedCharacters: string[];
  activeCharacterId: string;
  onBuyCharacter: (character: ShopCharacter) => void;

  foodItems: FoodItem[];
  onBuyFood: (item: FoodItem) => void;
  currentEnergy: number;
  maxEnergy: number;

  hiredFishermen: HiredFisherman[];
  onHireFisherman: () => void;
  nextFisherman: { cost: number, incomePerSecond: number, role: string };
  
  inventory: Fish[];
  onSellFish: (fish: Fish) => void;
  onSellAllFish: () => void;
}

const SHOPKEEPER_QUOTES = {
  welcome: [
    "Survival is key. What do you need?",
    "The island provides, if you have the skill.",
    "Craft wisely, night comes fast.",
    "Got any fish to trade?",
  ],
  buy: [
    "A sturdy choice.",
    "That will help you survive.",
    "Good craftsmanship.",
  ],
  food: [
    "Eat up, you need strength.",
    "Fresh from the fire.",
  ],
  upgrade: [
    "Your tools are stronger now.",
    "Better gear, better chances.",
  ],
  sell: [
    "Fresh catch! I'll take it.",
    "This will feed the camp nicely.",
    "Good quality."
  ]
};

export const Shop: React.FC<ShopProps> = ({ 
  money, rodLevel, baitLevel, depthLevel, bucketLevel, dockLevel, boatLevel = 1, isVip, 
  onUpgradeRod, onUpgradeBait, onUpgradeDepth, onUpgradeBucket, onUpgradeDock, onUpgradeBoat, onBuyVip,
  characters, unlockedCharacters, activeCharacterId, onBuyCharacter,
  foodItems, onBuyFood, currentEnergy, maxEnergy,
  hiredFishermen, onHireFisherman, nextFisherman,
  inventory, onSellFish, onSellAllFish
}) => {
  
  const rodCost = Math.floor(100 * Math.pow(1.5, rodLevel));
  const baitCost = Math.floor(50 * Math.pow(1.5, baitLevel));
  const depthCost = Math.floor(75 * Math.pow(1.5, depthLevel));
  const bucketCost = Math.floor(150 * Math.pow(1.4, bucketLevel));
  const dockCost = Math.floor(500 * Math.pow(2, dockLevel));
  const boatCost = Math.floor(1000 * Math.pow(1.8, boatLevel));
  const vipCost = 5000;
  
  const totalPassiveIncome = hiredFishermen.reduce((sum, h) => sum + h.incomePerSecond, 0);
  const totalInventoryValue = inventory.reduce((sum, f) => sum + f.value, 0);

  const [dialogue, setDialogue] = useState(SHOPKEEPER_QUOTES.welcome[0]);

  useEffect(() => {
    setDialogue(SHOPKEEPER_QUOTES.welcome[Math.floor(Math.random() * SHOPKEEPER_QUOTES.welcome.length)]);
  }, []);

  const handleAction = (action: () => void, category: keyof typeof SHOPKEEPER_QUOTES = 'buy') => {
      action();
      const lines = SHOPKEEPER_QUOTES[category];
      setDialogue(lines[Math.floor(Math.random() * lines.length)]);
  };

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto pb-24">
      
      {/* Header */}
      <div className="bg-stone-800 rounded-xl p-6 border-2 border-stone-600 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
         <div className="relative shrink-0">
             <div className="w-20 h-20 bg-stone-700 rounded-full border-4 border-amber-700 flex items-center justify-center">
                 <Hammer className="w-10 h-10 text-amber-500" />
             </div>
         </div>
         <div className="flex-1 text-center md:text-left">
             <h2 className="text-2xl font-bold text-amber-100">Survivor's Crafting Table</h2>
             <p className="text-stone-400 italic">"{dialogue}"</p>
         </div>
         <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-700">
             <div className="text-xs text-stone-500 uppercase tracking-widest font-bold">Resources</div>
             <div className="text-2xl font-black text-amber-400">{Math.floor(money).toLocaleString()} G</div>
         </div>
      </div>

      {/* Fish Market (Selling) */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-300 flex items-center gap-2">
                 <Coins className="w-5 h-5 text-yellow-400" /> Fish Market
              </h3>
              <div className="text-sm text-slate-400">Inventory: {inventory.length} items</div>
          </div>
          
          {inventory.length > 0 ? (
              <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-600">
                      <div className="text-slate-300">
                          Total Catch Value: <span className="text-yellow-400 font-bold">{totalInventoryValue} G</span>
                      </div>
                      <Button 
                         onClick={() => handleAction(onSellAllFish, 'sell')} 
                         className="bg-green-600 hover:bg-green-500 border-green-500/50"
                      >
                         Sell All ({totalInventoryValue} G)
                      </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-2">
                      {inventory.map(fish => (
                          <div key={fish.id} className="bg-slate-800 p-2 rounded text-xs flex justify-between items-center border border-slate-700">
                              <span className="truncate flex-1 text-slate-300">{fish.name}</span>
                              <span className="text-yellow-400 font-bold ml-2">{fish.value}</span>
                          </div>
                      ))}
                  </div>
              </div>
          ) : (
              <div className="text-center text-slate-500 py-4 italic">Your bucket is empty. Go catch something!</div>
          )}
      </div>

      {/* Food */}
      <div className="space-y-4">
         <h3 className="text-lg font-bold text-stone-300 flex items-center gap-2 border-b border-stone-700 pb-2">
            <Utensils className="w-5 h-5 text-amber-500" /> Survival Rations
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {foodItems.map((item) => (
                <div key={item.id} className="bg-stone-800 p-4 rounded-lg border border-stone-600">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-stone-200">{item.name}</span>
                        <span className="text-xs text-green-400 font-bold">+{item.energy} Energy</span>
                    </div>
                    <Button 
                        onClick={() => handleAction(() => onBuyFood(item), 'food')}
                        disabled={money < item.cost || currentEnergy >= maxEnergy}
                        className="w-full bg-stone-700 hover:bg-stone-600 border-stone-500"
                    >
                        Consume ({item.cost} G)
                    </Button>
                </div>
            ))}
         </div>
      </div>

      {/* Tools */}
      <div className="space-y-4">
         <h3 className="text-lg font-bold text-stone-300 flex items-center gap-2 border-b border-stone-700 pb-2">
            <Hammer className="w-5 h-5 text-amber-500" /> Tool Upgrades
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="bg-stone-800 p-4 rounded-lg border border-stone-600 flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="font-bold text-stone-200">Rod Strength Lv.{rodLevel}</span>
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xs text-stone-400">Catch bigger fish.</p>
                <Button onClick={() => handleAction(() => onUpgradeRod(rodCost), 'upgrade')} disabled={money < rodCost} className="mt-auto">
                    Reinforce ({rodCost} G)
                </Button>
            </div>

            <div className="bg-stone-800 p-4 rounded-lg border border-stone-600 flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="font-bold text-stone-200">Bait Quality Lv.{baitLevel}</span>
                    <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-xs text-stone-400">Attract fish faster.</p>
                <Button onClick={() => handleAction(() => onUpgradeBait(baitCost), 'upgrade')} disabled={money < baitCost} className="mt-auto">
                    Craft ({baitCost} G)
                </Button>
            </div>

            <div className="bg-stone-800 p-4 rounded-lg border border-stone-600 flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="font-bold text-stone-200">Line Length Lv.{depthLevel}</span>
                    <Anchor className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-xs text-stone-400">Reach deeper waters.</p>
                <Button onClick={() => handleAction(() => onUpgradeDepth(depthCost), 'upgrade')} disabled={money < depthCost} className="mt-auto">
                    Extend ({depthCost} G)
                </Button>
            </div>

            <div className="bg-stone-800 p-4 rounded-lg border border-stone-600 flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="font-bold text-stone-200">Storage Box Lv.{bucketLevel}</span>
                    <Box className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-xs text-stone-400">Carry more resources.</p>
                <Button onClick={() => handleAction(() => onUpgradeBucket(bucketCost), 'upgrade')} disabled={money < bucketCost} className="mt-auto">
                    Expand ({bucketCost} G)
                </Button>
            </div>

            <div className="bg-stone-800 p-4 rounded-lg border border-stone-600 flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="font-bold text-stone-200">Pier Lv.{dockLevel}</span>
                    <Shield className="w-4 h-4 text-stone-400" />
                </div>
                <p className="text-xs text-stone-400">Fish further from shore.</p>
                <Button onClick={() => handleAction(() => onUpgradeDock(dockCost), 'upgrade')} disabled={money < dockCost} className="mt-auto">
                    Build ({dockCost} G)
                </Button>
            </div>

             <div className="bg-stone-800 p-4 rounded-lg border border-stone-600 flex flex-col gap-2">
                <div className="flex justify-between">
                    <span className="font-bold text-stone-200">Raft Lv.{boatLevel}</span>
                    <Ship className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-xs text-stone-400">Access open ocean.</p>
                {onUpgradeBoat ? (
                    <Button onClick={() => handleAction(() => onUpgradeBoat(boatCost), 'upgrade')} disabled={money < boatCost} className="mt-auto">
                        Construct ({boatCost} G)
                    </Button>
                ) : <Button disabled className="mt-auto opacity-50">Locked</Button>}
            </div>

         </div>
      </div>

      {/* Crew */}
      <div className="space-y-4">
         <h3 className="text-lg font-bold text-stone-300 flex items-center gap-2 border-b border-stone-700 pb-2">
            <Users className="w-5 h-5 text-green-400" /> Camp Survivors
         </h3>
         <div className="bg-stone-800 p-6 rounded-lg border border-stone-600 flex flex-col md:flex-row items-center gap-4">
             <div className="flex-1">
                 <h4 className="font-bold text-white">Recruit Survivor</h4>
                 <p className="text-sm text-stone-400">Will gather {nextFisherman.incomePerSecond} G/sec automatically.</p>
                 <div className="text-xs text-stone-500 mt-1">Current Camp Size: {hiredFishermen.length}</div>
             </div>
             <Button onClick={() => handleAction(onHireFisherman, 'buy')} disabled={money < nextFisherman.cost} className="bg-green-700 hover:bg-green-600">
                Recruit ({nextFisherman.cost} G)
             </Button>
         </div>
      </div>

    </div>
  );
};