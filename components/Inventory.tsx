import React from 'react';
import { Fish, Rarity } from '../types';
import { Coins, Fish as FishIcon, Trash2, Footprints, Zap, Cpu, Sparkles, Gem, Crown, Clock, Box } from 'lucide-react';

interface InventoryProps {
  items: Fish[];
  onSell: (fish: Fish) => void;
  maxCapacity: number;
}

const RarityColor = {
  [Rarity.COMMON]: 'text-slate-400 border-slate-600 bg-slate-800/80',
  [Rarity.RARE]: 'text-blue-400 border-blue-500/50 bg-blue-900/20',
  [Rarity.EPIC]: 'text-purple-400 border-purple-500/50 bg-purple-900/20',
  [Rarity.LEGENDARY]: 'text-amber-400 border-amber-500/50 bg-amber-900/20',
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
        <div className="p-6 bg-slate-800/50 rounded-full">
            <Box className="w-12 h-12 opacity-50" />
        </div>
        <div className="text-center">
            <p className="text-lg font-medium">Your bucket is empty</p>
            <p className="text-sm">Go catch some fish!</p>
        </div>
        <div className="text-sm bg-slate-800 px-4 py-2 rounded-full flex items-center gap-2 border border-slate-700">
           <Box className="w-4 h-4" /> Capacity: 0 / {maxCapacity}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6 px-4">
            <h2 className="text-2xl font-bold text-slate-200">Your Catch</h2>
            <div className={`text-sm px-4 py-2 rounded-full flex items-center gap-2 border shadow-lg ${items.length >= maxCapacity ? 'bg-red-900/50 border-red-500 text-red-200 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
               <Box className="w-4 h-4" /> 
               <span className="font-mono font-bold">{items.length} / {maxCapacity}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-24">
        {items.map((fish) => (
            <div 
            key={fish.id} 
            className={`relative p-4 rounded-xl border backdrop-blur-md shadow-xl flex flex-col justify-between transition-all hover:scale-[1.02] hover:-translate-y-1 group ${RarityColor[fish.rarity]}`}
            >
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-3 rounded-xl shadow-inner ${
                        fish.rarity === Rarity.LEGENDARY ? 'bg-amber-900/30' : 'bg-slate-900/50'
                    }`}>
                        {getFishIcon(fish.name, "w-8 h-8")}
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest opacity-60 border px-1.5 py-0.5 rounded border-current">
                        {fish.rarity}
                    </span>
                </div>
                <h3 className="font-bold text-lg leading-tight mb-1">{fish.name}</h3>
                <p className="text-xs opacity-70 mb-4 italic line-clamp-2 h-8">"{fish.description}"</p>
            </div>
            
            <button 
                onClick={() => onSell(fish)}
                className="w-full py-3 bg-slate-900/80 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-all group-hover:shadow-lg border border-white/5 hover:border-green-400/50"
            >
                <span className="text-xs font-bold uppercase tracking-wider">Sell</span>
                <div className="h-4 w-px bg-white/20"></div>
                <span className="font-bold flex items-center gap-1">
                {fish.value} <Coins className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </span>
            </button>
            </div>
        ))}
        </div>
    </div>
  );
};
