import React, { useState, useEffect } from 'react';
import { FishingGame } from './components/FishingGame';
import { Shop } from './components/Shop';
import { Inventory } from './components/Inventory';
import { Leaderboard } from './components/Leaderboard';
import { Wardrobe } from './components/Wardrobe';
import { Encyclopedia } from './components/Encyclopedia';
import { ImageEditor } from './components/ImageEditor';
import { Fish, Rarity, Upgrade, FoodItem, ShopCharacter, HiredFisherman, Quest, GameState, CharacterConfig } from './types';
import { FISH_TYPES } from './constants';
import { Anchor, ShoppingBag, Trophy, User, Book, Camera, Hammer, Map, Sun } from 'lucide-react';
import { playUiSelect, playSell, playUpgrade, playQuestComplete } from './services/soundService';

// Default Survivor Config
const DEFAULT_CHARACTER: CharacterConfig = {
  skinColor: '#d4a373',
  hairColor: '#3e2723',
  hairStyle: 'short',
  shirtColor: '#5c4033', // Brown rag
  vestColor: '#8b4513',
  pantsColor: '#3f3f46', // Dark tattered
  hatStyle: 'none',
  hatColor: '#000000',
  clothingStyle: 'casual',
  facialHair: 'beard',
  eyewear: 'none',
  accessory: 'none',
  accessoryColor: '#ffd700'
};

const INITIAL_STATE: GameState = {
  playerName: 'Survivor',
  money: 0,
  vip: false,
  energy: 100,
  maxEnergy: 100,
  inventory: [],
  rodLevel: 1,
  baitLevel: 1,
  depthLevel: 1,
  bucketLevel: 1,
  dockLevel: 1,
  boatLevel: 0,
  discoveredFish: [],
  quests: [],
  stats: {
    totalGoldEarned: 0,
    totalFishCaught: 0,
    legendaryFishCaught: 0,
  },
  unlockedCharacters: ['default'],
  activeCharacterId: 'default',
  hiredFishermen: [],
};

const FOOD_ITEMS: FoodItem[] = [
  { id: 'coconut', name: 'Fresh Coconut', cost: 20, energy: 15, description: 'Hydrating and sweet.' },
  { id: 'berries', name: 'Wild Berries', cost: 50, energy: 35, description: 'Found in the jungle.' },
  { id: 'fish_stew', name: 'Fish Stew', cost: 120, energy: 80, description: 'Hearty meal cooked over fire.' },
];

const SHOP_CHARACTERS: ShopCharacter[] = [
  {
    id: 'veteran',
    name: 'The Veteran',
    cost: 5000,
    description: 'Survived 10 years alone.',
    bonusDescription: '+10% Luck',
    config: { ...DEFAULT_CHARACTER, hairColor: '#aaaaaa', facialHair: 'beard', clothingStyle: 'waders' },
    bonuses: { luck: 10, waitReduction: 0, valueMultiplier: 1.0 }
  },
  {
    id: 'diver',
    name: 'Deep Diver',
    cost: 12000,
    description: 'Expert at finding rare items.',
    bonusDescription: '-500ms Wait Time',
    config: { ...DEFAULT_CHARACTER, hatStyle: 'beanie', eyewear: 'sunglasses', clothingStyle: 'sporty' },
    bonuses: { luck: 0, waitReduction: 500, valueMultiplier: 1.0 }
  },
  {
    id: 'merchant',
    name: 'Island Trader',
    cost: 25000,
    description: 'Knows the value of gold.',
    bonusDescription: '+20% Fish Value',
    config: { ...DEFAULT_CHARACTER, hatStyle: 'cap', clothingStyle: 'suit', shirtColor: '#fcd34d' },
    bonuses: { luck: 0, waitReduction: 0, valueMultiplier: 1.2 }
  }
];

export default function App() {
  // Load state from local storage or use initial
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('nanoAnglerSurvivalSave');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<'fish' | 'craft' | 'inventory' | 'leaderboard' | 'wardrobe' | 'pokedex' | 'studio'>('fish');
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig>(() => {
    const saved = localStorage.getItem('nanoAnglerSurvivalChar');
    return saved ? JSON.parse(saved) : DEFAULT_CHARACTER;
  });

  // Save loop
  useEffect(() => {
    localStorage.setItem('nanoAnglerSurvivalSave', JSON.stringify(gameState));
    localStorage.setItem('nanoAnglerSurvivalChar', JSON.stringify(characterConfig));
  }, [gameState, characterConfig]);

  // Passive Income Interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState.hiredFishermen.length > 0) {
        const income = gameState.hiredFishermen.reduce((sum, h) => sum + h.incomePerSecond, 0);
        setGameState(prev => ({
          ...prev,
          money: prev.money + income,
          stats: { ...prev.stats, totalGoldEarned: prev.stats.totalGoldEarned + income }
        }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.hiredFishermen]);

  // Generate Quests if empty
  useEffect(() => {
    if (gameState.quests.length === 0 || gameState.quests.every(q => q.isClaimed)) {
      const newQuests: Quest[] = [
        { id: Date.now() + '1', type: 'CATCH_ANY', description: 'Catch 3 Fish', target: 3, progress: 0, reward: 50, isClaimed: false },
        { id: Date.now() + '2', type: 'EARN_GOLD', description: 'Earn 100 Gold', target: 100, progress: 0, reward: 75, isClaimed: false },
        { id: Date.now() + '3', type: 'CATCH_RARE', description: 'Catch 1 Rare Fish', target: 1, progress: 0, reward: 150, isClaimed: false },
      ];
      setGameState(prev => ({ ...prev, quests: newQuests }));
    }
  }, [gameState.quests]);

  const updateQuestProgress = (type: string, amount: number) => {
    setGameState(prev => ({
      ...prev,
      quests: prev.quests.map(q => {
        if (q.isClaimed) return q;
        if (q.type === 'CATCH_ANY' && type === 'CATCH_ANY') return { ...q, progress: q.progress + amount };
        if (q.type === 'EARN_GOLD' && type === 'EARN_GOLD') return { ...q, progress: q.progress + amount };
        if (q.type === 'CATCH_RARE' && type === 'CATCH_RARE') return { ...q, progress: q.progress + amount };
        return q;
      })
    }));
  };

  const handleCatch = (fish: Fish) => {
    setGameState(prev => {
      // Check discovery
      const isNew = !prev.discoveredFish.includes(fish.name);
      const newDiscovered = isNew ? [...prev.discoveredFish, fish.name] : prev.discoveredFish;

      // Update stats
      const newStats = {
        ...prev.stats,
        totalFishCaught: prev.stats.totalFishCaught + 1,
        legendaryFishCaught: fish.rarity === Rarity.LEGENDARY ? prev.stats.legendaryFishCaught + 1 : prev.stats.legendaryFishCaught
      };

      return {
        ...prev,
        inventory: [...prev.inventory, fish],
        discoveredFish: newDiscovered,
        stats: newStats
      };
    });

    updateQuestProgress('CATCH_ANY', 1);
    if (fish.rarity !== Rarity.COMMON) updateQuestProgress('CATCH_RARE', 1);
  };

  const handleInstantSell = (fish: Fish) => {
    // Apply character bonus if any
    const activeChar = SHOP_CHARACTERS.find(c => c.id === gameState.activeCharacterId);
    const multiplier = activeChar?.bonuses.valueMultiplier || 1.0;
    const value = Math.floor(fish.value * multiplier);

    playSell();
    setGameState(prev => {
      const isNew = !prev.discoveredFish.includes(fish.name);
      const newDiscovered = isNew ? [...prev.discoveredFish, fish.name] : prev.discoveredFish;
      
      const newStats = {
        ...prev.stats,
        totalFishCaught: prev.stats.totalFishCaught + 1,
        legendaryFishCaught: fish.rarity === Rarity.LEGENDARY ? prev.stats.legendaryFishCaught + 1 : prev.stats.legendaryFishCaught,
        totalGoldEarned: prev.stats.totalGoldEarned + value
      };

      return {
        ...prev,
        money: prev.money + value,
        discoveredFish: newDiscovered,
        stats: newStats
      };
    });
    
    updateQuestProgress('CATCH_ANY', 1);
    if (fish.rarity !== Rarity.COMMON) updateQuestProgress('CATCH_RARE', 1);
    updateQuestProgress('EARN_GOLD', value);
  };

  const handleSell = (fish: Fish) => {
    const activeChar = SHOP_CHARACTERS.find(c => c.id === gameState.activeCharacterId);
    const multiplier = activeChar?.bonuses.valueMultiplier || 1.0;
    const value = Math.floor(fish.value * multiplier);

    playSell();
    setGameState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(f => f.id !== fish.id),
      money: prev.money + value,
      stats: { ...prev.stats, totalGoldEarned: prev.stats.totalGoldEarned + value }
    }));
    updateQuestProgress('EARN_GOLD', value);
  };

  const handleSellAll = () => {
    const activeChar = SHOP_CHARACTERS.find(c => c.id === gameState.activeCharacterId);
    const multiplier = activeChar?.bonuses.valueMultiplier || 1.0;
    let totalValue = 0;
    
    gameState.inventory.forEach(fish => {
        totalValue += Math.floor(fish.value * multiplier);
    });

    if (totalValue > 0) {
        playSell();
        setGameState(prev => ({
            ...prev,
            inventory: [],
            money: prev.money + totalValue,
            stats: { ...prev.stats, totalGoldEarned: prev.stats.totalGoldEarned + totalValue }
        }));
        updateQuestProgress('EARN_GOLD', totalValue);
    }
  };

  const handleClaimQuest = (id: string) => {
    const quest = gameState.quests.find(q => q.id === id);
    if (quest && quest.progress >= quest.target && !quest.isClaimed) {
      playQuestComplete();
      setGameState(prev => ({
        ...prev,
        money: prev.money + quest.reward,
        quests: prev.quests.map(q => q.id === id ? { ...q, isClaimed: true } : q)
      }));
    }
  };

  const handleUseEnergy = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      energy: Math.max(0, prev.energy - amount)
    }));
  };

  // --- UPGRADES ---
  const handleUpgrade = (type: string, cost: number) => {
    if (gameState.money >= cost) {
      playUpgrade();
      setGameState(prev => ({
        ...prev,
        money: prev.money - cost,
        [type]: (prev[type as keyof GameState] as number) + 1
      }));
    }
  };

  const handleBuyVip = (cost: number) => {
    if (gameState.money >= cost && !gameState.vip) {
      playUpgrade();
      setGameState(prev => ({ ...prev, money: prev.money - cost, vip: true }));
    }
  };

  const handleBuyCharacter = (character: ShopCharacter) => {
    if (gameState.money >= character.cost && !gameState.unlockedCharacters.includes(character.id)) {
      playUpgrade();
      setGameState(prev => ({
        ...prev,
        money: prev.money - character.cost,
        unlockedCharacters: [...prev.unlockedCharacters, character.id]
      }));
    } else if (gameState.unlockedCharacters.includes(character.id)) {
      setGameState(prev => ({ ...prev, activeCharacterId: character.id }));
      // Optional: Apply character style to current config
      setCharacterConfig(character.config);
    }
  };

  const handleBuyFood = (item: FoodItem) => {
    if (gameState.money >= item.cost && gameState.energy < gameState.maxEnergy) {
      setGameState(prev => ({
        ...prev,
        money: prev.money - item.cost,
        energy: Math.min(prev.maxEnergy, prev.energy + item.energy)
      }));
    }
  };

  const getNextFishermanCost = () => {
    return Math.floor(100 * Math.pow(1.6, gameState.hiredFishermen.length));
  };

  const handleHireFisherman = () => {
    const cost = getNextFishermanCost();
    if (gameState.money >= cost) {
      playUpgrade();
      const newFisherman: HiredFisherman = {
        id: Date.now().toString(),
        role: 'Survivor',
        cost: cost,
        incomePerSecond: 1 + gameState.hiredFishermen.length,
        hiredAt: Date.now()
      };
      setGameState(prev => ({
        ...prev,
        money: prev.money - cost,
        hiredFishermen: [...prev.hiredFishermen, newFisherman]
      }));
    }
  };
  
  const handleOpenShop = () => {
      setActiveTab('craft');
      playUiSelect();
  };

  // Derived Values
  const activeChar = SHOP_CHARACTERS.find(c => c.id === gameState.activeCharacterId);
  const luckBonus = activeChar?.bonuses.luck || 0;
  const waitReduction = activeChar?.bonuses.waitReduction || 0;
  const maxCapacity = 5 + (gameState.bucketLevel * 2);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-gradient-to-br from-amber-600 to-orange-700 rounded-lg shadow-inner">
               <Sun className="w-5 h-5 text-yellow-200" />
             </div>
             <div>
                <h1 className="font-bold text-lg leading-none tracking-tight text-amber-100">Island Survival</h1>
                <div className="text-[10px] text-amber-500/80 font-bold tracking-widest uppercase">Castaway Edition</div>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Energy Bar */}
             <div className="hidden md:flex flex-col w-32">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                   <span>ENERGY</span>
                   <span>{gameState.energy}/{gameState.maxEnergy}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" style={{ width: `${(gameState.energy / gameState.maxEnergy) * 100}%` }}></div>
                </div>
             </div>

             <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="text-yellow-400 font-bold">{Math.floor(gameState.money).toLocaleString()}</span>
                <span className="text-xs text-yellow-600 font-bold">G</span>
             </div>
             <button 
                onClick={() => setActiveTab('wardrobe')}
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-slate-700 overflow-hidden"
             >
                <div className="w-full h-full flex items-center justify-center bg-slate-700 text-xs font-bold text-slate-400">
                   <User className="w-5 h-5" />
                </div>
             </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto w-full py-6">
            {activeTab === 'fish' && (
                <FishingGame 
                    onCatch={handleCatch}
                    onInstantSell={handleInstantSell}
                    rodLevel={gameState.rodLevel}
                    baitLevel={gameState.baitLevel}
                    depthLevel={gameState.depthLevel}
                    dockLevel={gameState.dockLevel}
                    boatLevel={gameState.boatLevel}
                    isVip={gameState.vip}
                    quests={gameState.quests}
                    onClaimQuest={handleClaimQuest}
                    currentInventory={gameState.inventory.length}
                    maxCapacity={maxCapacity}
                    characterConfig={characterConfig}
                    luckBonus={luckBonus}
                    waitReduction={waitReduction}
                    energy={gameState.energy}
                    onUseEnergy={handleUseEnergy}
                    onOpenShop={handleOpenShop}
                />
            )}

            {activeTab === 'craft' && (
                <Shop 
                    money={gameState.money}
                    rodLevel={gameState.rodLevel}
                    baitLevel={gameState.baitLevel}
                    depthLevel={gameState.depthLevel}
                    bucketLevel={gameState.bucketLevel}
                    dockLevel={gameState.dockLevel}
                    boatLevel={gameState.boatLevel}
                    isVip={gameState.vip}
                    onUpgradeRod={(c) => handleUpgrade('rodLevel', c)}
                    onUpgradeBait={(c) => handleUpgrade('baitLevel', c)}
                    onUpgradeDepth={(c) => handleUpgrade('depthLevel', c)}
                    onUpgradeBucket={(c) => handleUpgrade('bucketLevel', c)}
                    onUpgradeDock={(c) => handleUpgrade('dockLevel', c)}
                    onUpgradeBoat={(c) => handleUpgrade('boatLevel', c)}
                    onBuyVip={handleBuyVip}
                    characters={SHOP_CHARACTERS}
                    unlockedCharacters={gameState.unlockedCharacters}
                    activeCharacterId={gameState.activeCharacterId}
                    onBuyCharacter={handleBuyCharacter}
                    foodItems={FOOD_ITEMS}
                    onBuyFood={handleBuyFood}
                    currentEnergy={gameState.energy}
                    maxEnergy={gameState.maxEnergy}
                    hiredFishermen={gameState.hiredFishermen}
                    onHireFisherman={handleHireFisherman}
                    nextFisherman={{ 
                        cost: getNextFishermanCost(), 
                        incomePerSecond: 1 + gameState.hiredFishermen.length, 
                        role: 'Survivor' 
                    }}
                    inventory={gameState.inventory}
                    onSellFish={handleSell}
                    onSellAllFish={handleSellAll}
                />
            )}

            {activeTab === 'inventory' && (
                <Inventory 
                    items={gameState.inventory} 
                    onSell={handleSell} 
                    maxCapacity={maxCapacity}
                />
            )}

            {activeTab === 'leaderboard' && (
                <Leaderboard 
                    currentMoney={gameState.money} 
                    stats={gameState.stats}
                    isVip={gameState.vip}
                    playerName={gameState.playerName}
                />
            )}

            {activeTab === 'wardrobe' && (
                <Wardrobe 
                    config={characterConfig}
                    onUpdate={setCharacterConfig}
                    playerName={gameState.playerName}
                    onNameChange={(name) => setGameState(prev => ({ ...prev, playerName: name }))}
                />
            )}

            {activeTab === 'pokedex' && (
                <Encyclopedia discovered={gameState.discoveredFish} />
            )}

            {activeTab === 'studio' && (
                <ImageEditor />
            )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-slate-900 border-t border-slate-800 pb-safe">
        <div className="max-w-lg mx-auto flex justify-around items-center p-2">
            <NavButton active={activeTab === 'fish'} onClick={() => { setActiveTab('fish'); playUiSelect(); }} icon={<Anchor className="w-6 h-6" />} label="Fish" />
            <NavButton active={activeTab === 'craft'} onClick={() => { setActiveTab('craft'); playUiSelect(); }} icon={<Hammer className="w-6 h-6" />} label="Craft" />
            <NavButton active={activeTab === 'inventory'} onClick={() => { setActiveTab('inventory'); playUiSelect(); }} icon={<ShoppingBag className="w-6 h-6" />} label="Bag" badge={gameState.inventory.length > 0 ? gameState.inventory.length : undefined} />
            <NavButton active={activeTab === 'studio'} onClick={() => { setActiveTab('studio'); playUiSelect(); }} icon={<Camera className="w-6 h-6" />} label="Studio" />
            <NavButton active={activeTab === 'pokedex'} onClick={() => { setActiveTab('pokedex'); playUiSelect(); }} icon={<Book className="w-6 h-6" />} label="Log" />
            <NavButton active={activeTab === 'leaderboard'} onClick={() => { setActiveTab('leaderboard'); playUiSelect(); }} icon={<Trophy className="w-6 h-6" />} label="Rank" />
        </div>
      </nav>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 relative ${active ? 'text-amber-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
    >
        {badge !== undefined && (
            <div className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-slate-900">
                {badge}
            </div>
        )}
        <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>{icon}</div>
        <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </button>
);