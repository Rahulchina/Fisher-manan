import React from 'react';
import { CharacterConfig } from '../types';
import { Palette, Scissors, Shirt, User, PenLine, Glasses, Watch } from 'lucide-react';

interface WardrobeProps {
  config: CharacterConfig;
  onUpdate: (config: CharacterConfig) => void;
  playerName: string;
  onNameChange: (name: string) => void;
}

export const Wardrobe: React.FC<WardrobeProps> = ({ config, onUpdate, playerName, onNameChange }) => {
  const handleChange = (key: keyof CharacterConfig, value: string) => {
    onUpdate({ ...config, [key]: value });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl mt-4 pb-24">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
        <User className="w-8 h-8 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Character Wardrobe</h2>
      </div>

      {/* Name Section */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
        <label className="block text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
           <PenLine className="w-4 h-4 text-emerald-400" /> Angler Name
        </label>
        <input 
          type="text" 
          value={playerName}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={12}
          placeholder="Enter your name"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-lg font-bold text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
        />
        <p className="text-xs text-slate-500 mt-2">This name will appear on the global leaderboard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-pink-400" /> Hair & Face
          </h3>
          
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg">
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skin Tone</label>
                <div className="flex items-center gap-3">
                    <input 
                        type="color" 
                        value={config.skinColor}
                        onChange={(e) => handleChange('skinColor', e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-sm font-mono text-slate-500">{config.skinColor}</span>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hair Style</label>
                <div className="flex flex-wrap gap-2">
                    {['bald', 'short', 'spiky', 'long'].map((style) => (
                        <button
                            key={style}
                            onClick={() => handleChange('hairStyle', style)}
                            className={`px-3 py-2 rounded-md text-sm font-bold capitalize transition-all border-2 ${
                                config.hairStyle === style 
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </div>

            {config.hairStyle !== 'bald' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hair Color</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="color" 
                            value={config.hairColor}
                            onChange={(e) => handleChange('hairColor', e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-sm font-mono text-slate-500">{config.hairColor}</span>
                    </div>
                </div>
            )}

            <div className="pt-2 border-t border-slate-700/50">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Facial Hair</label>
               <div className="flex flex-wrap gap-2">
                    {['none', 'beard'].map((feature) => (
                        <button
                            key={feature}
                            onClick={() => handleChange('facialHair', feature)}
                            className={`px-3 py-2 rounded-md text-sm font-bold capitalize transition-all border-2 ${
                                config.facialHair === feature 
                                ? 'bg-purple-600 border-purple-400 text-white shadow-lg scale-105' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {feature}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Outfit Section */}
        <div className="space-y-6">
           <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-indigo-400" /> Outfit
          </h3>

          <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg">
            
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clothing Style</label>
               <div className="flex flex-wrap gap-2 mb-4">
                    {['waders', 'overalls', 'casual', 'suit', 'sporty', 'fantasy'].map((style) => (
                        <button
                            key={style}
                            onClick={() => handleChange('clothingStyle', style)}
                            className={`px-3 py-2 rounded-md text-sm font-bold capitalize transition-all border-2 ${
                                config.clothingStyle === style 
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {config.clothingStyle === 'suit' ? 'Jacket' : 'Shirt / Body'}
                    </label>
                    <input 
                        type="color" 
                        value={config.shirtColor}
                        onChange={(e) => handleChange('shirtColor', e.target.value)}
                        className="w-full h-10 rounded cursor-pointer bg-transparent"
                    />
                </div>
                {config.clothingStyle !== 'casual' && config.clothingStyle !== 'sporty' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {config.clothingStyle === 'suit' ? 'Tie' : config.clothingStyle === 'fantasy' ? 'Armor/Trim' : 'Vest / Bib'}
                        </label>
                        <input 
                            type="color" 
                            value={config.vestColor}
                            onChange={(e) => handleChange('vestColor', e.target.value)}
                            className="w-full h-10 rounded cursor-pointer bg-transparent"
                        />
                    </div>
                )}
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {config.clothingStyle === 'casual' || config.clothingStyle === 'sporty' ? 'Shorts' : 
                     config.clothingStyle === 'overalls' ? 'Overalls' : 
                     config.clothingStyle === 'suit' ? 'Slacks' : 
                     config.clothingStyle === 'fantasy' ? 'Leggings' : 'Waders'}
                </label>
                <input 
                    type="color" 
                    value={config.pantsColor}
                    onChange={(e) => handleChange('pantsColor', e.target.value)}
                    className="w-full h-10 rounded cursor-pointer bg-transparent"
                />
            </div>
          </div>
        </div>
      </div>

      {/* Accessories Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
            <Glasses className="w-5 h-5 text-amber-400" /> Accessories & Headwear
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 p-4 rounded-lg space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hat Style</label>
                    <div className="flex flex-wrap gap-2">
                        {['none', 'bucket', 'cap', 'beanie', 'cowboy'].map((style) => (
                            <button
                                key={style}
                                onClick={() => handleChange('hatStyle', style)}
                                className={`px-2 py-1.5 rounded-md text-xs font-bold capitalize transition-all border-2 ${
                                    config.hatStyle === style 
                                    ? 'bg-amber-600 border-amber-400 text-white shadow-lg' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
                {config.hatStyle !== 'none' && (
                    <div className="animate-in fade-in slide-in-from-left-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hat Color</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                value={config.hatColor}
                                onChange={(e) => handleChange('hatColor', e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                            />
                            <span className="text-xs font-mono text-slate-500">{config.hatColor}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg space-y-4">
                 {/* Eyewear */}
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Eyewear</label>
                    <div className="flex flex-wrap gap-2">
                        {['none', 'sunglasses', 'glasses', 'eyepatch'].map((style) => (
                            <button
                                key={style}
                                onClick={() => handleChange('eyewear', style)}
                                className={`px-2 py-1.5 rounded-md text-xs font-bold capitalize transition-all border-2 ${
                                    config.eyewear === style 
                                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                 </div>

                 {/* Jewelry / Accessories */}
                 <div className="pt-2 border-t border-slate-700/50">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Watch className="w-3 h-3" /> Jewelry
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {['none', 'necklace', 'bracelet'].map((style) => (
                            <button
                                key={style}
                                onClick={() => handleChange('accessory', style)}
                                className={`px-2 py-1.5 rounded-md text-xs font-bold capitalize transition-all border-2 ${
                                    config.accessory === style 
                                    ? 'bg-rose-600 border-rose-400 text-white shadow-lg' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                    {config.accessory !== 'none' && (
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                value={config.accessoryColor}
                                onChange={(e) => handleChange('accessoryColor', e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                            />
                            <span className="text-xs font-mono text-slate-500">Color</span>
                        </div>
                    )}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};