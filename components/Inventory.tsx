import React from 'react';
import { Fish, Rarity } from '../types';
import { Coins, Fish as FishIcon, Trash2, Footprints, Zap, Cpu, Sparkles, Gem, Crown, Clock, Box } from 'lucide-react';

interface InventoryProps {
  items: Fish[];
  onSell: (fish: Fish) => void;
  maxCapacity: number;
}

const RarityColor = {
  [Rarity.COMMON]: 'text-slate-400 border-slate-600',
  [Rarity.RARE]: 'text-blue-400 border-blue-500',
  [Rarity.EPIC]: 'text-purple-400 border-purple-500',
  [Rarity.LEGENDARY]: 'text-amber-400 border-amber-500 bg-amber-500/10',
};

const getFishIcon = (name: string, className: string) => {
  switch (name) {
    case 'Old Boot': return <Footprints className={className} />;
    case 'Tin Can': return <Trash2 className={className} />;
    case 'Electric Ray': 
    case 'Neon Tetra':
    case 'Quantum Eel': return <Zap className={className} />;
    case 'Cyber Shark': return <Cpu className={className} />;
    case 'Void Glider': 
    case 'Galaxy Koi': return <Sparkles className={className} />;
    case 'Ruby Snapper': 
    case 'Sapphire Fin': return <Gem className={className} />;
    case 'Nano Bananafish': return <Crown className={className} />;
    case 'Chrono-Carp': return <Clock className={className} />;
    default: return <FishIcon className={className} />;
  }
};

export const Inventory: React.FC<InventoryProps> = ({ items, onSell, maxCapacity }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
        <div className="text-center">
            <p>Your bucket is empty.</p>
            <p className="text-sm">Go catch some fish!</p>
        </div>
        <div className="text-sm bg-slate-800 px-3 py-1 rounded-full flex items-center gap-2">
           <Box className="w-4 h-4" /> Capacity: 0 / {maxCapacity}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-xl font-bold text-slate-200">Your Catch</h2>
            <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 border ${items.length >= maxCapacity ? 'bg-red-900/30 border-red-500/50 text-red-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
               <Box className="w-4 h-4" /> 
               <span>Capacity: {items.length} / {maxCapacity}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-2 overflow-y-auto max-h-[600px]">
        {items.map((fish) => (
            <div 
            key={fish.id} 
            className={`p-4 rounded-xl border bg-slate-800/50 backdrop-blur-sm shadow-lg flex flex-col justify-between transition-transform hover:scale-105 ${RarityColor[fish.rarity]}`}
            >
            <div>
                <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900/50 rounded-lg">
                        {getFishIcon(fish.name, "w-6 h-6")}
                    </div>
                    <h3 className="font-bold text-lg">{fish.name}</h3>
                </div>
                <span className="text-xs uppercase font-bold tracking-widest opacity-75">{fish.rarity}</span>
                </div>
                <p className="text-sm text-slate-300 mb-4 italic">"{fish.description}"</p>
            </div>
            
            <button 
                onClick={() => onSell(fish)}
                className="w-full py-2 bg-slate-700 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors group"
            >
                <span>Sell for</span>
                <span className="font-bold flex items-center gap-1 group-hover:text-green-100">
                {fish.value} <Coins className="w-4 h-4 text-yellow-400" />
                </span>
            </button>
            </div>
        ))}
        </div>
    </div>
  );
};