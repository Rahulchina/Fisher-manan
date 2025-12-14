import React, { useState } from 'react';
import { Trophy, Medal, Crown, Star, Coins, User } from 'lucide-react';
import { PlayerStats } from '../types';

interface LeaderboardProps {
  currentMoney: number;
  stats: PlayerStats;
  isVip: boolean;
}

type LeaderboardType = 'wealth' | 'legends';

interface MockPlayer {
  id: string;
  name: string;
  isVip: boolean;
  totalGold: number;
  legendaryCount: number;
  avatarColor: string;
}

const MOCK_PLAYERS: MockPlayer[] = [
  { id: '1', name: 'SharkHunter99', isVip: true, totalGold: 154200, legendaryCount: 42, avatarColor: 'bg-red-500' },
  { id: '2', name: 'DeepSeaDiver', isVip: false, totalGold: 89000, legendaryCount: 15, avatarColor: 'bg-blue-500' },
  { id: '3', name: 'NanoMaster', isVip: true, totalGold: 210500, legendaryCount: 68, avatarColor: 'bg-purple-500' },
  { id: '4', name: 'BaitBucket', isVip: false, totalGold: 4500, legendaryCount: 2, avatarColor: 'bg-green-500' },
  { id: '5', name: 'PoseidonsSon', isVip: true, totalGold: 98000, legendaryCount: 25, avatarColor: 'bg-cyan-500' },
  { id: '6', name: 'FishWish', isVip: false, totalGold: 12000, legendaryCount: 5, avatarColor: 'bg-orange-500' },
  { id: '7', name: 'ReelBigCatch', isVip: true, totalGold: 76000, legendaryCount: 18, avatarColor: 'bg-indigo-500' },
];

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentMoney, stats, isVip }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('wealth');

  // Create current player object
  const currentPlayer: MockPlayer = {
    id: 'player',
    name: 'You',
    isVip: isVip,
    totalGold: stats.totalGoldEarned, // Use lifetime earnings for leaderboard
    legendaryCount: stats.legendaryFishCaught,
    avatarColor: 'bg-blue-600',
  };

  // Combine and sort
  const allPlayers = [...MOCK_PLAYERS, currentPlayer].sort((a, b) => {
    if (activeTab === 'wealth') {
      return b.totalGold - a.totalGold;
    } else {
      return b.legendaryCount - a.legendaryCount;
    }
  });

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 1: return 'bg-slate-300/20 border-slate-300 text-slate-300';
      case 2: return 'bg-amber-700/20 border-amber-700 text-amber-600';
      default: return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-400 fill-yellow-400" />;
      case 1: return <Medal className="w-6 h-6 text-slate-300" />;
      case 2: return <Medal className="w-6 h-6 text-amber-700" />;
      default: return <span className="w-6 h-6 flex items-center justify-center font-bold">{index + 1}</span>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-400" /> Global Rankings
        </h2>
        <p className="text-slate-400">See how you stack up against other Nano Anglers.</p>
      </div>

      <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700 max-w-sm mx-auto">
        <button
          onClick={() => setActiveTab('wealth')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'wealth' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" /> Richest
        </button>
        <button
          onClick={() => setActiveTab('legends')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'legends' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="w-4 h-4" /> Legends
        </button>
      </div>

      <div className="space-y-3">
        {allPlayers.map((player, index) => (
          <div 
            key={player.id} 
            className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-transform hover:scale-[1.02] ${getRankStyle(index)} ${player.id === 'player' ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}`}
          >
            <div className="flex-shrink-0 w-8 flex justify-center">
               {getRankIcon(index)}
            </div>

            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${player.avatarColor} border-2 border-slate-900 shadow-lg`}>
                <User className="w-6 h-6 text-white" />
            </div>

            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-slate-100">{player.name}</span>
                    {player.isVip && <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    {player.id === 'player' && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">YOU</span>}
                </div>
                <div className="text-sm opacity-80 flex items-center gap-4">
                   <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-yellow-400" /> {player.totalGold.toLocaleString()}
                   </span>
                   <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-purple-400" /> {player.legendaryCount} Legends
                   </span>
                </div>
            </div>

            {index < 3 && (
                <div className="absolute top-0 right-0 p-2">
                    <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rotate-45 transform translate-x-10 -translate-y-10"></div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};