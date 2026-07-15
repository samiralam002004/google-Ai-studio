import React from 'react';
import { Coins, Check, Lock, X } from 'lucide-react';
import { Skin, SKINS_DATA } from '../types';
import { audioSynth } from '../audio';

interface SkinShopProps {
  coins: number;
  unlockedSkins: string[];
  selectedSkin: string;
  onSelectSkin: (skinId: string) => void;
  onBuySkin: (skinId: string, cost: number) => void;
  onClose: () => void;
}

export default function SkinShop({
  coins,
  unlockedSkins,
  selectedSkin,
  onSelectSkin,
  onBuySkin,
  onClose,
}: SkinShopProps) {
  
  const getPatternStyle = (skin: Skin) => {
    switch (skin.patternType) {
      case 'rainbow':
        return 'bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-500';
      case 'glow':
        return 'bg-neutral-800 border-2 shadow-[0_0_12px_rgba(236,72,153,0.6)]';
      case 'striped':
        return 'bg-gradient-to-r';
      case 'spotted':
        return 'bg-radial';
      default:
        return '';
    }
  };

  const handleSelect = (skin: Skin) => {
    if (unlockedSkins.includes(skin.id)) {
      onSelectSkin(skin.id);
      audioSynth.playPowerup();
    } else {
      if (coins >= skin.cost) {
        onBuySkin(skin.id, skin.cost);
        audioSynth.playPowerup();
      } else {
        audioSynth.playDie(); // Alert tone for failure
        alert('coins kam hain! Game khele aur coins kamayein.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full max-w-xl rounded-xl overflow-hidden shadow-2xl flex flex-col text-left">
        
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Coins size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">Skin Shop</h2>
              <p className="text-[11px] text-neutral-400">Unlock custom styles with coins</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
              <Coins className="text-yellow-500" size={14} />
              <span className="text-yellow-400 font-bold text-xs">{coins}</span>
            </div>
            <button 
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* List of Skins */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh]">
          {SKINS_DATA.map((skin) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isSelected = selectedSkin === skin.id;

            return (
              <button
                key={skin.id}
                onClick={() => handleSelect(skin)}
                className={`relative group p-4 bg-neutral-950 border-2 rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/10' 
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Skin Preview Circular Segment */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden bg-neutral-900">
                  <div 
                    className="w-10 h-10 rounded-full transition-transform duration-300 group-hover:scale-110 flex items-center justify-center"
                    style={{
                      background: skin.patternType === 'rainbow' 
                        ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
                        : skin.patternType === 'glow'
                        ? skin.color
                        : `linear-gradient(135deg, ${skin.color}, ${skin.secondaryColor || skin.color})`,
                      boxShadow: skin.patternType === 'glow' ? `0 0 16px ${skin.color}` : 'none'
                    }}
                  >
                    {/* Snake Face Outline */}
                    <div className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0.5 h-0.5 bg-black rounded-full" />
                      </div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0.5 h-0.5 bg-black rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skin Info */}
                <div className="text-center w-full">
                  <h3 className="text-xs font-semibold text-neutral-200 truncate">{skin.name}</h3>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    {isSelected ? (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Check size={10} /> Active
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-semibold">
                        Select
                      </span>
                    ) : (
                      <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-yellow-500/20">
                        <Coins size={10} /> {skin.cost}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lock Badge */}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-neutral-500 border border-neutral-800">
                    <Lock size={10} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 text-center text-xs text-neutral-500 font-mono">
          Tip: Collect shining food & destroy AI snakes to harvest coin drops in-game!
        </div>

      </div>
    </div>
  );
}
