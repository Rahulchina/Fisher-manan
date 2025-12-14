import React, { useState } from 'react';
import { Quest } from '../types';
import { Button } from './Button';
import { ClipboardList, CheckCircle, Coins } from 'lucide-react';

interface QuestBoardProps {
  quests: Quest[];
  onClaim: (questId: string) => void;
}

const ANIMATION_STYLES = `
  @keyframes float-up {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    100% { transform: translate(-50%, -150%) scale(1); opacity: 0; }
  }
`;

export const QuestBoard: React.FC<QuestBoardProps> = ({ quests, onClaim }) => {
  const [animatingQuests, setAnimatingQuests] = useState<string[]>([]);

  const handleClaimClick = (questId: string) => {
    setAnimatingQuests(prev => [...prev, questId]);
    onClaim(questId);
    setTimeout(() => {
        setAnimatingQuests(prev => prev.filter(id => id !== questId));
    }, 1000);
  };

  return (
    <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 mt-8 shadow-lg relative">
      <style>{ANIMATION_STYLES}</style>
      <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
        <ClipboardList className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-slate-100">Daily Quests</h3>
      </div>
      
      <div className="space-y-3">
        {quests.map((quest) => {
          const isCompleted = quest.progress >= quest.target;
          const percent = Math.min(100, Math.floor((quest.progress / quest.target) * 100));
          const isAnimating = animatingQuests.includes(quest.id);

          return (
            <div key={quest.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 flex flex-col gap-2 relative overflow-hidden transition-all hover:bg-slate-900/70">
              
              {/* Reward Animation Overlay */}
              {isAnimating && (
                 <div className="absolute top-1/2 left-1/2 z-50 pointer-events-none flex items-center gap-1 text-yellow-400 font-bold text-2xl animate-[float-up_0.8s_ease-out_forwards] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
                    <Coins className="w-6 h-6 fill-yellow-400 text-yellow-200" /> +{quest.reward} G
                 </div>
              )}

              <div className="flex justify-between items-start z-10 relative">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-200">{quest.description}</p>
                        {/* Percentage Indicator */}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                            isCompleted 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}>
                           {percent}%
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                        Reward: <span className="text-yellow-400 font-bold">{quest.reward} G</span>
                    </p>
                </div>

                {quest.isClaimed ? (
                   <div className="flex items-center gap-1 text-green-500 text-xs font-bold uppercase tracking-wide bg-green-900/20 px-2 py-1 rounded border border-green-500/20">
                     <CheckCircle className="w-3 h-3" /> Done
                   </div>
                ) : (
                    <Button 
                        disabled={!isCompleted}
                        onClick={() => handleClaimClick(quest.id)}
                        className={`text-xs py-1 px-3 h-auto min-h-[30px] transition-all ${
                            isCompleted 
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-[0_0_10px_rgba(202,138,4,0.3)] hover:shadow-[0_0_15px_rgba(202,138,4,0.5)]' 
                                : 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        {isCompleted ? 'Claim' : 'Active'}
                    </Button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative border border-slate-700">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${
                            isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500'
                        }`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>PROGRESS</span>
                      <span>{Math.min(quest.progress, quest.target)} / {quest.target}</span>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};