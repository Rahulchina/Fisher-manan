import React, { useState } from 'react';
import { GameState, Fish, Quest, QuestType, Rarity } from './types';
import { FishingGame } from './components/FishingGame';
import { Shop } from './components/Shop';
import { Inventory } from './components/Inventory';
import { ImageEditor } from './components/ImageEditor';
import { Leaderboard } from './components/Leaderboard';
import { Anchor, ShoppingBag, Backpack, Wand2, Trophy } from 'lucide-react';
import { playQuestComplete, playSell, playUpgrade, playUiSelect, playBucketFull } from './services/soundService';

const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', type: 'CATCH_ANY', description: 'Catch 5 Fish', target: 5, progress: 0, reward: 50, isClaimed: false },
  { id: 'q2', type: 'EARN_GOLD', description: 'Earn 100 Gold', target: 100, progress: 0, reward: 100, isClaimed: false },
  { id: 'q3', type: 'CATCH_RARE', description: 'Catch 1 Rare or better Fish', target: 1, progress: 0, reward: 200, isClaimed: false },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'game' | 'shop' | 'inventory' | 'studio' | 'leaderboard'>('game');
  
  const [state, setState] = useState<GameState>({
    money: 0,
    vip: false,
    inventory: [],
    rodLevel: 1,
    baitLevel: 1,
    depthLevel: 1,
    bucketLevel: 1,
    dockLevel: 1,
    quests: INITIAL_QUESTS,
    stats: {
      totalGoldEarned: 0,
      totalFishCaught: 0,
      legendaryFishCaught: 0
    }
  });

  // Capacity Formula: Base 10 + 5 per extra level
  const maxCapacity = 10 + (state.bucketLevel - 1) * 5;

  const handleTabChange = (tab: 'game' | 'shop' | 'inventory' | 'studio' | 'leaderboard') => {
    playUiSelect();
    setActiveTab(tab);
  };

  const updateQuestProgress = (type: QuestType, amount: number) => {
    setState(prev => ({
      ...prev,
      quests: prev.quests.map(q => {
        if (q.type === type && !q.isClaimed && q.progress < q.target) {
            const newProgress = q.progress + amount;
            // Cap progress visually at target, though logically it can go over, we usually clamp UI
            return { ...q, progress: newProgress };
        }
        return q;
      })
    }));
  };

  const handleClaimQuest = (questId: string) => {
    setState(prev => {
        const quest = prev.quests.find(q => q.id === questId);
        if (!quest || quest.isClaimed) return prev;

        playQuestComplete();
        return {
            ...prev,
            money: prev.money + quest.reward,
            stats: {
                ...prev.stats,
                totalGoldEarned: prev.stats.totalGoldEarned + quest.reward
            },
            quests: prev.quests.map(q => q.id === questId ? { ...q, isClaimed: true } : q)
        };
    });
  };

  const handleCatch = (fish: Fish) => {
    if (state.inventory.length >= maxCapacity) {
        playBucketFull();
        alert("Your bucket is full! Sell some fish to catch more.");
        return;
    }

    setState(prev => ({
      ...prev,
      inventory: [fish, ...prev.inventory],
      stats: {
          ...prev.stats,
          totalFishCaught: prev.stats.totalFishCaught + 1,
          legendaryFishCaught: fish.rarity === Rarity.LEGENDARY ? prev.stats.legendaryFishCaught + 1 : prev.stats.legendaryFishCaught
      }
    }));
    
    // Quest Logic
    updateQuestProgress('CATCH_ANY', 1);
    if (fish.rarity !== Rarity.COMMON) {
        updateQuestProgress('CATCH_RARE', 1);
    }
  };

  const handleInstantSell = (fish: Fish) => {
    playSell();
    setState(prev => ({
      ...prev,
      money: prev.money + fish.value,
      stats: {
          ...prev.stats,
          totalGoldEarned: prev.stats.totalGoldEarned + fish.value,
          totalFishCaught: prev.stats.totalFishCaught + 1,
          legendaryFishCaught: fish.rarity === Rarity.LEGENDARY ? prev.stats.legendaryFishCaught + 1 : prev.stats.legendaryFishCaught
      }
    }));

    // Quest Logic
    updateQuestProgress('CATCH_ANY', 1);
    if (fish.rarity !== Rarity.COMMON) {
        updateQuestProgress('CATCH_RARE', 1);
    }
    updateQuestProgress('EARN_GOLD', fish.value);
  };

  const handleSell = (fish: Fish) => {
    playSell();
    setState(prev => ({
      ...prev,
      money: prev.money + fish.value,
      inventory: prev.inventory.filter(f => f.id !== fish.id),
      stats: {
          ...prev.stats,
          totalGoldEarned: prev.stats.totalGoldEarned + fish.value
      }
    }));
    
    // Quest Logic
    updateQuestProgress('EARN_GOLD', fish.value);
  };

  const handleUpgradeRod = (cost: number) => {
    if (state.money >= cost) {
      playUpgrade();
      setState(prev => ({
        ...prev,
        money: prev.money - cost,
        rodLevel: prev.rodLevel + 1
      }));
    }
  };

  const handleUpgradeBait = (cost: number) => {
    if (state.money >= cost) {
      playUpgrade();
      setState(prev => ({
        ...prev,
        money: prev.money - cost,
        baitLevel: prev.baitLevel + 1
      }));
    }
  };

  const handleUpgradeDepth = (cost: number) => {
    if (state.money >= cost) {
      playUpgrade();
      setState(prev => ({
        ...prev,
        money: prev.money - cost,
        depthLevel: prev.depthLevel + 1
      }));
    }
  };

  const handleUpgradeBucket = (cost: number) => {
    if (state.money >= cost) {
        playUpgrade();
        setState(prev => ({
            ...prev,
            money: prev.money - cost,
            bucketLevel: prev.bucketLevel + 1
        }));
    }
  };

  const handleUpgradeDock = (cost: number) => {
    if (state.money >= cost) {
        playUpgrade();
        setState(prev => ({
            ...prev,
            money: prev.money - cost,
            dockLevel: (prev.dockLevel || 1) + 1
        }));
    }
  };

  const handleBuyVip = (cost: number) => {
     if (state.money >= cost && !state.vip) {
      playQuestComplete(); // Reusing Fanfare for VIP
      setState(prev => ({
        ...prev,
        money: prev.money - cost,
        vip: true
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
                <Anchor className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Nano Angler
                </h1>
                {state.vip && <span className="text-xs font-bold text-amber-400 tracking-wider">VIP MEMBER</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
            <span className="text-yellow-400 font-mono font-bold">{state.money} G</span>
            <div className="h-4 w-px bg-slate-600"></div>
            <span className={`text-sm flex items-center gap-1 ${state.inventory.length >= maxCapacity ? 'text-red-400 animate-pulse font-bold' : 'text-blue-300'}`}>
                 <Backpack className="w-3 h-3" /> {state.inventory.length}/{maxCapacity}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {activeTab === 'game' && (
          <FishingGame 
            onCatch={handleCatch}
            onInstantSell={handleInstantSell}
            rodLevel={state.rodLevel} 
            baitLevel={state.baitLevel}
            depthLevel={state.depthLevel}
            dockLevel={state.dockLevel || 1}
            isVip={state.vip}
            quests={state.quests}
            onClaimQuest={handleClaimQuest}
            currentInventory={state.inventory.length}
            maxCapacity={maxCapacity}
          />
        )}
        
        {activeTab === 'shop' && (
          <Shop 
            money={state.money}
            rodLevel={state.rodLevel}
            baitLevel={state.baitLevel}
            depthLevel={state.depthLevel}
            bucketLevel={state.bucketLevel}
            dockLevel={state.dockLevel || 1}
            isVip={state.vip}
            onUpgradeRod={handleUpgradeRod}
            onUpgradeBait={handleUpgradeBait}
            onUpgradeDepth={handleUpgradeDepth}
            onUpgradeBucket={handleUpgradeBucket}
            onUpgradeDock={handleUpgradeDock}
            onBuyVip={handleBuyVip}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory 
            items={state.inventory} 
            onSell={handleSell} 
            maxCapacity={maxCapacity}
          />
        )}

        {activeTab === 'studio' && (
          <ImageEditor />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard 
            stats={state.stats}
            currentMoney={state.money}
            isVip={state.vip}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe">
        <div className="max-w-md mx-auto flex justify-between p-2 px-6">
          <button 
            onClick={() => handleTabChange('game')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'game' ? 'text-blue-400 bg-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Anchor className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Fish</span>
          </button>

          <button 
            onClick={() => handleTabChange('inventory')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'inventory' ? 'text-blue-400 bg-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className="relative">
                <Backpack className="w-6 h-6 mb-1" />
                {state.inventory.length >= maxCapacity && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
                )}
            </div>
            <span className="text-xs font-medium">Catch</span>
          </button>

          <button 
            onClick={() => handleTabChange('shop')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'shop' ? 'text-blue-400 bg-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ShoppingBag className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Shop</span>
          </button>
          
          <button 
            onClick={() => handleTabChange('studio')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'studio' ? 'text-purple-400 bg-purple-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Wand2 className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Studio</span>
          </button>

          <button 
            onClick={() => handleTabChange('leaderboard')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'leaderboard' ? 'text-yellow-400 bg-yellow-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Trophy className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Rank</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;