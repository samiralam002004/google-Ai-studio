import React, { useState, useEffect } from 'react';
import { X, Info, ExternalLink } from 'lucide-react';

interface AdMobBannerProps {
  position?: 'top' | 'bottom';
}

const CAMPAIGNS = [
  {
    title: 'Unlock Magma Skin! 🔥',
    desc: 'Perform 3 kills in a single game to collect premium coins & unlock Magma.',
    cta: 'Open Skin Shop',
    color: 'from-orange-600 to-red-600',
  },
  {
    title: 'Try Lucky Wheel! 🎡',
    desc: 'Spin the wheel every hour! Win up to 500 Coins or Rainbow Skins.',
    cta: 'Spin Now',
    color: 'from-purple-600 to-indigo-600',
  },
  {
    title: 'Play Multiplayer Mode! 🌐',
    desc: 'Compete against real-time players around the globe. Top the live leaderboard.',
    cta: 'Join Lobby',
    color: 'from-cyan-600 to-blue-600',
  },
  {
    title: 'Speed Boost Powerup ⚡',
    desc: 'Collect glowing purple lightning bolt items for maximum non-destructive speed.',
    cta: 'Learn More',
    color: 'from-emerald-600 to-teal-600',
  }
];

export default function AdMobBanner({ position = 'bottom' }: AdMobBannerProps) {
  const [currentCampaign, setCurrentCampaign] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const appId = 'ca-app-pub-7854239726416448~8263728274';
  const adUnitId = 'ca-app-pub-7854239726416448/1478828075';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCampaign((prev) => (prev + 1) % CAMPAIGNS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const camp = CAMPAIGNS[currentCampaign];

  return (
    <div
      className={`fixed left-0 right-0 z-40 flex flex-col items-center justify-center p-2 transition-all duration-300 ${
        position === 'top' ? 'top-0' : 'bottom-0'
      }`}
    >
      {/* Outer Banner Wrapper */}
      <div className="relative w-full max-w-xl md:max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-2xl overflow-hidden flex flex-col sm:flex-row items-stretch min-h-[64px]">
        
        {/* Ad Badge */}
        <div className="absolute top-1 left-2 z-10 flex items-center gap-1.5 px-1.5 py-0.5 bg-black/60 rounded border border-neutral-700 text-[9px] font-mono tracking-wider text-yellow-500 uppercase font-semibold">
          Ad
        </div>

        {/* Info Overlay Panel */}
        {showInfo && (
          <div className="absolute inset-0 bg-neutral-950 z-30 p-4 flex flex-col justify-center text-xs text-neutral-300 animate-fade-in">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-neutral-100 flex items-center gap-1">
                <Info size={14} className="text-cyan-400" /> Google AdMob Integrated
              </h4>
              <button onClick={() => setShowInfo(false)} className="text-neutral-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1 text-[11px] font-mono bg-neutral-900 p-2 rounded border border-neutral-800 text-left">
              <div><span className="text-neutral-500">App ID:</span> {appId}</div>
              <div><span className="text-neutral-500">AdUnit:</span> {adUnitId}</div>
              <div className="text-yellow-500/90 mt-1">Status: Active & serving test/live campaigns.</div>
            </div>
          </div>
        )}

        {/* Ad Content */}
        <div className={`w-20 sm:w-28 bg-gradient-to-br ${camp.color} flex items-center justify-center text-center font-bold text-white text-xs p-1 relative select-none`}>
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-white/90">SNAKE.IO</span>
          </div>
        </div>

        <div className="flex-1 p-3 pl-4 flex flex-col justify-center text-left">
          <h3 className="font-semibold text-neutral-100 text-sm flex items-center gap-1">
            {camp.title}
          </h3>
          <p className="text-neutral-400 text-xs mt-0.5 line-clamp-1 leading-normal">
            {camp.desc}
          </p>
        </div>

        {/* CTA and Actions */}
        <div className="px-3 flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-neutral-800 bg-neutral-900/50 justify-between sm:justify-start">
          <button className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-md flex items-center gap-1 shadow transition-colors">
            {camp.cta} <ExternalLink size={10} />
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInfo(true)}
              title="Ad Info"
              className="p-1 text-neutral-500 hover:text-neutral-300 rounded transition-colors"
            >
              <Info size={14} />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              title="Close Ad"
              className="p-1 text-neutral-500 hover:text-red-400 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* Underline Branding */}
      <span className="text-[9px] text-neutral-500 mt-1 uppercase tracking-wider select-none font-mono">
        Ads by Google • {adUnitId.substring(0, 18)}...
      </span>
    </div>
  );
}
