import React from 'react';
import { Upgrade } from '../types';
import { Button } from './Button';
import { TrendingUp, Crown, Zap, Anchor, Box, Hammer } from 'lucide-react';

interface ShopProps {
  money: number;
  rodLevel: number;
  baitLevel: number;
  depthLevel: number;
  bucketLevel: number;
  dockLevel: number;
  isVip: boolean;
  onUpgradeRod: (cost: number) => void;
  onUpgradeBait: (cost: number) => void;
  onUpgradeDepth: (cost: number) => void;
  onUpgradeBucket: (cost: number) => void;
  onUpgradeDock: (cost: number) => void;
  onBuyVip: (cost: number) => void;
}

export const Shop: React.FC<ShopProps> = ({ 
  money, rodLevel, baitLevel, depthLevel, bucketLevel, dockLevel, isVip, 
  onUpgradeRod, onUpgradeBait, onUpgradeDepth, onUpgradeBucket, onUpgradeDock, onBuyVip 
}) => {
  
  const rodCost = Math.floor(100 * Math.pow(1.5, rodLevel));
  const baitCost = Math.floor(50 * Math.pow(1.5, baitLevel));
  const depthCost = Math.floor(75 * Math.pow(1.5, depthLevel));
  const bucketCost = Math.floor(150 * Math.pow(1.4, bucketLevel));
  const dockCost = Math.floor(500 * Math.pow(2, dockLevel));
  const vipCost = 5000;

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Angler's Outpost</h2>
          <p className="text-slate-400 text-sm">Upgrade your gear to catch legendary fish.</p>
        </div>
        <div className="text-right">
           <p className="text-sm text-slate-400">Current Funds</p>
           <p className="text-2xl font-bold text-yellow-400 flex items-center justify-end gap-1">
             {money} <span className="text-sm">G</span>
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Rod Upgrade */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-600 flex flex-col gap-4">
          <div className="p-3 bg-blue-900/30 rounded-full w-fit">
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Carbon Rod Mk.{rodLevel + 1}</h3>
            <p className="text-slate-400 text-sm">Increases overall catch quality.</p>
          </div>
          <div className="mt-auto">
             <Button 
               onClick={() => onUpgradeRod(rodCost)} 
               disabled={money < rodCost}
               className="w-full"
             >
               Upgrade ({rodCost} G)
             </Button>
          </div>
        </div>

        {/* Bait Upgrade */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-600 flex flex-col gap-4">
          <div className="p-3 bg-green-900/30 rounded-full w-fit">
            <Zap className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Syntho-Bait Lv.{baitLevel + 1}</h3>
            <p className="text-slate-400 text-sm">Reduces waiting time for bites.</p>
          </div>
          <div className="mt-auto">
             <Button 
               onClick={() => onUpgradeBait(baitCost)} 
               disabled={money < baitCost}
               className="w-full"
             >
               Upgrade ({baitCost} G)
             </Button>
          </div>
        </div>

        {/* Depth Upgrade */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-600 flex flex-col gap-4">
          <div className="p-3 bg-indigo-900/30 rounded-full w-fit">
            <Anchor className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Abyssal Weights Lv.{depthLevel + 1}</h3>
            <p className="text-slate-400 text-sm">Reach deeper waters for rarer fish.</p>
          </div>
          <div className="mt-auto">
             <Button 
               onClick={() => onUpgradeDepth(depthCost)} 
               disabled={money < depthCost}
               className="w-full"
             >
               Upgrade ({depthCost} G)
             </Button>
          </div>
        </div>

        {/* Bucket Upgrade */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-600 flex flex-col gap-4">
          <div className="p-3 bg-orange-900/30 rounded-full w-fit">
            <Box className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Expanded Cooler Lv.{bucketLevel + 1}</h3>
            <p className="text-slate-400 text-sm">Increases max fish capacity (+5 slots).</p>
          </div>
          <div className="mt-auto">
             <Button 
               onClick={() => onUpgradeBucket(bucketCost)} 
               disabled={money < bucketCost}
               className="w-full"
             >
               Upgrade ({bucketCost} G)
             </Button>
          </div>
        </div>

        {/* Dock Upgrade */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-600 flex flex-col gap-4">
          <div className="p-3 bg-stone-700/50 rounded-full w-fit">
            <Hammer className="w-8 h-8 text-stone-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Dock Expansion Lv.{dockLevel + 1}</h3>
            <p className="text-slate-400 text-sm">Increases walkable surface area.</p>
          </div>
          <div className="mt-auto">
             <Button 
               onClick={() => onUpgradeDock(dockCost)} 
               disabled={money < dockCost}
               className="w-full"
             >
               Expand ({dockCost} G)
             </Button>
          </div>
        </div>

        {/* VIP Pass */}
        <div className={`rounded-xl p-6 border flex flex-col gap-4 ${isVip ? 'bg-gradient-to-br from-amber-900/40 to-purple-900/40 border-amber-500/50' : 'bg-slate-800 border-slate-600'}`}>
          <div className="p-3 bg-amber-900/30 rounded-full w-fit">
            <Crown className={`w-8 h-8 ${isVip ? 'text-amber-300' : 'text-slate-500'}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-100">VIP Membership</h3>
            <p className="text-slate-400 text-sm">Unlock +15% luck bonus and golden username frame.</p>
          </div>
          <div className="mt-auto">
             {isVip ? (
                 <div className="text-center py-2 font-bold text-amber-400 uppercase tracking-widest border border-amber-500/30 rounded-lg bg-amber-500/10">
                    Owned
                 </div>
             ) : (
                <Button 
                    variant="vip"
                    onClick={() => onBuyVip(vipCost)} 
                    disabled={money < vipCost}
                    className="w-full"
                >
                    Purchase ({vipCost} G)
                </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};