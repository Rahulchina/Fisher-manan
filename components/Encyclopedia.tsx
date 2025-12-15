import React from 'react';
import { FISH_TYPES } from '../constants';
import { Rarity } from '../types';
import { Fish as FishIcon, Footprints, Zap, Cpu, Sparkles, Gem, Crown, Clock, Trash2, BookOpen, Lock } from 'lucide-react';

interface EncyclopediaProps {
  discovered: string[];
}

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

const RarityColor = {
  [Rarity.COMMON]: 'text-slate-400 border-slate-600 bg-slate-800',
  [Rarity.RARE]: 'text-blue-400 border-blue-500 bg-blue-900/30',
  [Rarity.EPIC]: 'text-purple-400 border-purple-500 bg-purple-900/30',
  [Rarity.LEGENDARY]: 'text-amber-400 border-amber-500 bg-amber-900/30',
};

export const Encyclopedia: React.FC<EncyclopediaProps> = ({ discovered }) => {
  const total = FISH_TYPES.length;
  const found = discovered.length;
  const percent = Math.round((found / total) * 100);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="bg-gradient-to-r from-teal-900/50 to-slate-900/50 p-6 rounded-xl border border-teal-500/30 flex items-center justify-between">
        <div>
            <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-teal-400" />
            <h2 className="text-2xl font-bold text-white">Fish Encyclopedia</h2>
            </div>
            <p className="text-slate-300">
            Cataloging the marine life of the Nano Sea.
            </p>
        </div>
        <div className="text-right">
            <div className="text-3xl font-black text-teal-400">{percent}%</div>
            <div className="text-xs text-slate-400 uppercase tracking-widest">Complete</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {FISH_TYPES.map((fish) => {
          const isDiscovered = discovered.includes(fish.name);
          
          return (
            <div 
              key={fish.name} 
              className={`relative rounded-xl p-4 border transition-all duration-300 overflow-hidden ${
                isDiscovered 
                  ? `${RarityColor[fish.rarity]} shadow-lg hover:scale-105` 
                  : 'bg-slate-900 border-slate-800 opacity-75'
              }`}
            >
              {/* Idle Animation Class */}
              <div className={`flex flex-col items-center gap-4 ${isDiscovered ? 'animate-pulse-slow' : ''}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center relative ${
                    isDiscovered ? 'bg-black/20' : 'bg-slate-800'
                }`}>
                    {isDiscovered ? (
                        <div className="animate-[wiggle_3s_ease-in-out_infinite]">
                            {getFishIcon(fish.name, `w-14 h-14 ${
                                fish.rarity === Rarity.LEGENDARY ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 
                                fish.rarity === Rarity.EPIC ? 'text-purple-400' :
                                fish.rarity === Rarity.RARE ? 'text-blue-400' : 'text-slate-300'
                            }`)}
                        </div>
                    ) : (
                        <Lock className="w-8 h-8 text-slate-700" />
                    )}
                </div>

                <div className="text-center w-full">
                    {isDiscovered ? (
                        <>
                            <h3 className="font-bold text-lg mb-1">{fish.name}</h3>
                            <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-75">{fish.rarity}</div>
                            <p className="text-xs italic opacity-80 line-clamp-2 min-h-[2.5em]">{fish.description}</p>
                            <div className="mt-3 pt-3 border-t border-white/10 flex justify-center text-sm font-bold">
                                Value: {fish.value} G
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="font-bold text-lg mb-1 text-slate-600">???</h3>
                            <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-700">Unknown</div>
                            <p className="text-xs italic text-slate-700">Catch this fish to unlock details.</p>
                        </>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes wiggle {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
