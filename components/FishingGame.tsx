import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Fish, Rarity, Quest, CharacterConfig } from '../types';
import { FISH_TYPES } from '../constants';
import { Button } from './Button';
import { QuestBoard } from './QuestBoard';
import { FishermanScene } from './FishermanScene';
import { RewardBadge } from './RewardBadge';
import { Anchor, Fish as FishIcon, AlertCircle, Check, X, Star, Coins, Trash2, Footprints, Zap, Cpu, Sparkles, Gem, Crown, Clock, Box, Target, ShoppingBag } from 'lucide-react';
import { playCast, playBite, playReel, playCatch, playBucketFull } from '../services/soundService';

interface FishingGameProps {
  onCatch: (fish: Fish) => void;
  onInstantSell: (fish: Fish) => void;
  rodLevel: number;
  baitLevel: number;
  depthLevel: number;
  dockLevel: number;
  boatLevel: number;
  isVip: boolean;
  quests: Quest[];
  onClaimQuest: (id: string) => void;
  currentInventory: number;
  maxCapacity: number;
  characterConfig: CharacterConfig;
  luckBonus: number;
  waitReduction: number;
  energy: number;
  onUseEnergy: (amount: number) => void;
  onOpenShop: () => void;
}

const RarityColors = {
  [Rarity.COMMON]: 'text-slate-400 border-slate-600 bg-slate-800',
  [Rarity.RARE]: 'text-blue-400 border-blue-500 bg-blue-900/40',
  [Rarity.EPIC]: 'text-purple-400 border-purple-500 bg-purple-900/40',
  [Rarity.LEGENDARY]: 'text-amber-400 border-amber-500 bg-amber-900/40',
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

const ENERGY_COST_PER_CAST = 5;

export const FishingGame: React.FC<FishingGameProps> = ({ 
  onCatch, onInstantSell, rodLevel, baitLevel, depthLevel, dockLevel, boatLevel, isVip, 
  quests, onClaimQuest, currentInventory, maxCapacity, characterConfig,
  luckBonus, waitReduction, energy, onUseEnergy, onOpenShop
}) => {
  const [status, setStatus] = useState<'idle' | 'aiming' | 'casting' | 'waiting' | 'bited' | 'reeling' | 'caught'>('idle');
  const [message, setMessage] = useState('Ready to cast...');
  const [currentCatch, setCurrentCatch] = useState<Fish | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [castPower, setCastPower] = useState(0);
  const [isNearShop, setIsNearShop] = useState(false);
  const powerDirection = useRef(1);
  const powerReqRef = useRef<number>();
  
  const isBucketFull = currentInventory >= maxCapacity;
  const isEnergyLow = energy < ENERGY_COST_PER_CAST;

  // Power Meter Loop
  useEffect(() => {
    if (status === 'aiming') {
      const animatePower = () => {
        setCastPower(prev => {
          let next = prev + (1.5 * powerDirection.current);
          if (next >= 100) { next = 100; powerDirection.current = -1; }
          if (next <= 0) { next = 0; powerDirection.current = 1; }
          return next;
        });
        powerReqRef.current = requestAnimationFrame(animatePower);
      };
      powerReqRef.current = requestAnimationFrame(animatePower);
    } else {
      if (powerReqRef.current) cancelAnimationFrame(powerReqRef.current);
    }
    return () => {
      if (powerReqRef.current) cancelAnimationFrame(powerReqRef.current);
    };
  }, [status]);

  // Timer for fish biting
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    if (status === 'casting') {
      timeout = setTimeout(() => {
        setStatus('waiting');
        setMessage('Waiting for a bite...');
      }, 1000);
    } else if (status === 'waiting') {
      const baseTime = 3000;
      const reduction = baitLevel * 400;
      const totalWaitTime = Math.max(500, baseTime - reduction - waitReduction + (Math.random() * 2000));
      
      timeout = setTimeout(() => {
        playBite();
        setStatus('bited');
        setMessage('SOMETHING BIT! REEL IT IN!');
      }, totalWaitTime);
    } else if (status === 'bited') {
      timeout = setTimeout(() => {
        setStatus('idle');
        setMessage('The fish got away...');
        setCastPower(0);
      }, 2000);
    }

    return () => clearTimeout(timeout);
  }, [status, baitLevel, waitReduction]);

  const handleCastClick = () => {
    if (isBucketFull) {
        playBucketFull();
        setMessage("Bucket is full! Sell some fish.");
        return;
    }
    if (isEnergyLow) {
      setMessage("Out of energy! Eat food from the Shop.");
      return;
    }

    if (status === 'idle') {
      setStatus('aiming');
      setMessage('Aiming...');
      setCastPower(0);
    } else if (status === 'aiming') {
      // Lock in power
      playCast();
      onUseEnergy(ENERGY_COST_PER_CAST);
      setStatus('casting');
      setMessage('Casting line...');
    }
  };

  const handleReel = () => {
    if (status === 'bited') {
      playReel();
      setStatus('reeling');
      setMessage('Reeling in...');
      
      setTimeout(() => {
        const fish = determineCatch();
        playCatch(fish.rarity);
        setCurrentCatch(fish); 
        setShowModal(false);   
        setStatus('caught');   
        setMessage('FISH ON!');
        
        setTimeout(() => {
            setShowModal(true);
            setStatus('idle'); 
            setMessage('Nice Catch!');
            setCastPower(0);
        }, 1800);
        
      }, 1000);
    }
  };

  const handleCollect = () => {
    if (currentCatch) {
      onCatch(currentCatch);
      setCurrentCatch(null);
      setShowModal(false);
      setMessage('Ready to cast...');
    }
  };

  const handleInstantSellAction = () => {
    if (currentCatch) {
      onInstantSell(currentCatch);
      setCurrentCatch(null);
      setShowModal(false);
      setMessage(`Sold ${currentCatch.name}!`);
    }
  };

  const handleRelease = () => {
    setCurrentCatch(null);
    setShowModal(false);
    setMessage('Released. Ready to cast...');
  };

  const determineCatch = (): Fish => {
    // Power affects quality slightly? Maybe cast power adds to luck.
    const powerLuck = castPower > 90 ? 10 : castPower > 50 ? 5 : 0;
    const roll = Math.random() * 100 + (rodLevel * 5) + (depthLevel * 3) + (isVip ? 15 : 0) + luckBonus + powerLuck;
    
    let pool = FISH_TYPES.filter(f => f.rarity === Rarity.COMMON);
    
    if (roll > 105) pool = FISH_TYPES.filter(f => f.rarity === Rarity.LEGENDARY);
    else if (roll > 85) pool = FISH_TYPES.filter(f => f.rarity === Rarity.EPIC);
    else if (roll > 65) pool = FISH_TYPES.filter(f => f.rarity === Rarity.RARE);

    const template = pool[Math.floor(Math.random() * pool.length)];
    
    return {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
    };
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full space-y-8 p-4 relative">

      {/* Catch Modal */}
      {currentCatch && showModal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 h-full">
          <div className={`w-full max-w-sm p-1 rounded-2xl bg-gradient-to-b ${
            currentCatch.rarity === Rarity.LEGENDARY ? 'from-amber-300 via-amber-500 to-amber-700' : 
            currentCatch.rarity === Rarity.EPIC ? 'from-purple-400 via-purple-600 to-indigo-900' :
            currentCatch.rarity === Rarity.RARE ? 'from-blue-300 via-blue-500 to-blue-800' :
            'from-slate-400 via-slate-600 to-slate-800'
          }`}>
            <div className="bg-slate-900 rounded-xl p-6 flex flex-col items-center gap-4 text-center h-full relative overflow-hidden">
               {/* Legendary Background Effect */}
               {currentCatch.rarity === Rarity.LEGENDARY && (
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent animate-pulse pointer-events-none"></div>
               )}

               <div className="w-full flex justify-between items-start z-10">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${RarityColors[currentCatch.rarity]}`}>
                    {currentCatch.rarity}
                  </div>
                  {(currentCatch.rarity === Rarity.LEGENDARY || currentCatch.rarity === Rarity.EPIC) ? (
                     <div className="animate-bounce">
                        <RewardBadge className="w-8 h-8 drop-shadow-lg" />
                     </div>
                  ) : (
                    <div className="flex gap-1">
                        {[...Array(currentCatch.rarity === Rarity.RARE ? 3 : 1)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                  )}
               </div>

               <div className="my-4 relative z-10">
                 <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
                   currentCatch.rarity === Rarity.LEGENDARY ? 'bg-amber-500/20 shadow-amber-500/50' :
                   'bg-slate-700/50'
                 }`}>
                   {getFishIcon(currentCatch.name, `w-20 h-20 ${
                     currentCatch.rarity === Rarity.LEGENDARY ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 
                     currentCatch.rarity === Rarity.EPIC ? 'text-purple-300' :
                     currentCatch.rarity === Rarity.RARE ? 'text-blue-300' : 'text-slate-400'
                   }`)}
                 </div>
               </div>

               <div className="z-10">
                 <h3 className="text-2xl font-bold text-white mb-1">{currentCatch.name}</h3>
                 <p className="text-slate-400 text-sm italic">"{currentCatch.description}"</p>
               </div>

               <div className="text-xl font-bold text-green-400 flex items-center gap-2 bg-green-900/20 px-4 py-2 rounded-lg border border-green-500/30 z-10">
                  <span>Value:</span>
                  <span>{currentCatch.value} G</span>
               </div>

               <div className="flex flex-col gap-3 w-full mt-4 z-10">
                  <Button 
                    onClick={handleInstantSellAction}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 border-emerald-400/20 py-3"
                  >
                     <Coins className="w-5 h-5 text-yellow-300" />
                     <span className="text-lg">Sell Now</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={handleRelease} className="text-slate-300">
                        <X className="w-4 h-4" /> Release
                    </Button>
                    <Button onClick={handleCollect} disabled={isBucketFull} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50">
                        <Check className="w-4 h-4" /> {isBucketFull ? "Full!" : "Keep"}
                    </Button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Scene Replacement */}
      <div className={`relative w-full max-w-md h-72 rounded-xl overflow-hidden shadow-2xl transition-colors duration-200 ${status === 'bited' ? 'ring-4 ring-red-500' : 'ring-2 ring-slate-700'}`}>
         <FishermanScene 
            status={status} 
            isVip={isVip} 
            dockLevel={dockLevel} 
            depthLevel={depthLevel}
            boatLevel={boatLevel}
            caughtFish={currentCatch}
            characterConfig={characterConfig}
            castPower={castPower}
            onNearShop={setIsNearShop}
            onOpenShop={onOpenShop}
         />
         
         {/* Interaction Prompt */}
         {isNearShop && status === 'idle' && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-bounce">
                <Button onClick={onOpenShop} className="bg-green-600 hover:bg-green-500 shadow-xl border-2 border-green-400 px-6 py-3 rounded-full font-bold text-lg">
                    <ShoppingBag className="w-6 h-6 mr-2" /> Press E to Trade
                </Button>
             </div>
         )}
         
         {/* HUD Overlays */}
         <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-sm font-medium pointer-events-none">
            {status.toUpperCase()}
         </div>
         
         {/* Depth Indicator */}
         <div className="absolute bottom-2 right-2 text-xs font-mono text-slate-700 font-bold bg-white/30 backdrop-blur px-2 py-1 rounded pointer-events-none">
            Depth: {depthLevel * 10}m
         </div>

         {/* Bucket Capacity Indicator */}
         <div className={`absolute bottom-2 left-2 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded pointer-events-none ${isBucketFull ? 'bg-red-500/80 text-white animate-pulse' : 'bg-slate-900/50 text-slate-300'}`}>
            <Box className="w-3 h-3" />
            {currentInventory}/{maxCapacity}
         </div>

         {/* Power Meter Overlay */}
         {(status === 'aiming' || status === 'casting' || status === 'waiting') && (
             <div className="absolute right-4 top-1/2 -translate-y-1/2 h-40 w-4 bg-black/50 rounded-full border border-white/20 overflow-hidden">
                 <div 
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-75 ${castPower > 90 ? 'bg-red-500' : castPower > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ height: `${castPower}%` }}
                 />
                 {status === 'aiming' && (
                     <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                         <div className="h-0.5 w-full bg-white/50 absolute top-[10%]"></div>
                         <div className="h-0.5 w-full bg-red-500/80 absolute top-[5%]"></div>
                     </div>
                 )}
             </div>
         )}
      </div>

      <div className="text-center space-y-4">
        <h2 className={`text-2xl font-bold ${status === 'bited' ? 'text-red-400 scale-110 drop-shadow-lg' : 'text-slate-200'} transition-all`}>
          {message}
        </h2>
        
        {/* Controls hint */}
        <div className="text-xs text-slate-500 font-mono">
            WASD or ARROWS to Move | E to Shop
        </div>

        <div className="flex gap-4 justify-center">
            {(status === 'idle' || status === 'aiming') && (
                <div className="flex flex-col items-center gap-2">
                    <Button 
                        onClick={handleCastClick} 
                        className={`w-48 h-16 text-lg ${isBucketFull || isEnergyLow ? 'bg-red-900/50 border-red-500/50 text-red-300 hover:bg-red-900/50 cursor-not-allowed' : ''}`}
                        disabled={isBucketFull || isEnergyLow}
                    >
                        {status === 'aiming' ? (
                            <><Target className="w-5 h-5 animate-pulse" /> THROW!</>
                        ) : (
                            <><Anchor className="w-5 h-5" /> {isBucketFull ? "Bucket Full!" : isEnergyLow ? "No Energy!" : "Cast Line"}</>
                        )}
                    </Button>
                    <div className={`text-xs font-bold ${isEnergyLow ? 'text-red-400 animate-pulse' : 'text-yellow-400/70'}`}>
                        Cost: {ENERGY_COST_PER_CAST} Energy
                    </div>
                </div>
            )}

            {status === 'bited' && (
                <Button onClick={handleReel} variant="danger" className="w-48 h-16 text-lg animate-bounce">
                    <FishIcon className="w-6 h-6" /> REEL IT IN!
                </Button>
            )}

            {(status === 'waiting' || status === 'casting' || status === 'reeling' || status === 'caught') && (
                <Button disabled className="w-48 h-16 text-lg bg-slate-600 cursor-wait">
                   ...
                </Button>
            )}
        </div>
      </div>
      
      {isVip && (
        <div className="flex items-center gap-2 text-amber-400 bg-amber-900/20 px-4 py-2 rounded-full border border-amber-500/30">
            <span className="text-xs font-bold tracking-wider">VIP ACTIVE</span>
            <span className="text-xs opacity-75">Luck Boosted</span>
        </div>
      )}

      {/* Quest Board */}
      <QuestBoard quests={quests} onClaim={onClaimQuest} />
    </div>
  );
};