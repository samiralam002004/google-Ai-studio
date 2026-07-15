import React, { useState, useEffect } from 'react';
import { Calendar, Gift, Check, Clock, X, Info } from 'lucide-react';
import { audioSynth } from '../audio';

interface DailyRewardProps {
  onAwardCoins: (amount: number) => void;
  onClose: () => void;
}

const REWARDS = [
  { day: 1, amount: 50 },
  { day: 2, amount: 100 },
  { day: 3, amount: 150 },
  { day: 4, amount: 200 },
  { day: 5, amount: 300 },
  { day: 6, amount: 450 },
  { day: 7, amount: 1000 },
];

export default function DailyReward({ onAwardCoins, onClose }: DailyRewardProps) {
  const [currentDay, setCurrentDay] = useState(1); // 1 to 7
  const [lastClaimed, setLastClaimed] = useState<number | null>(null);
  const [canClaim, setCanClaim] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    // Load progress from localStorage
    const savedDay = localStorage.getItem('snake_daily_day');
    const savedTime = localStorage.getItem('snake_daily_last_claimed');
    
    if (savedDay) {
      setCurrentDay(parseInt(savedDay));
    }
    if (savedTime) {
      setLastClaimed(parseInt(savedTime));
    }
  }, []);

  useEffect(() => {
    if (!lastClaimed) {
      setCanClaim(true);
      return;
    }

    const checkClaimable = () => {
      const now = Date.now();
      const difference = now - lastClaimed;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (difference >= twentyFourHours) {
        setCanClaim(true);
        setTimeRemaining('');
      } else {
        setCanClaim(false);
        const remaining = twentyFourHours - difference;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        setTimeRemaining(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    };

    checkClaimable();
    const interval = setInterval(checkClaimable, 1000);
    return () => clearInterval(interval);
  }, [lastClaimed]);

  const handleClaim = () => {
    if (!canClaim) return;

    const reward = REWARDS.find((r) => r.day === currentDay);
    if (!reward) return;

    onAwardCoins(reward.amount);
    audioSynth.playPowerup();

    const now = Date.now();
    localStorage.setItem('snake_daily_last_claimed', now.toString());
    setLastClaimed(now);

    // Increment current day for next claim, wrap around on day 7
    const nextDay = currentDay >= 7 ? 1 : currentDay + 1;
    localStorage.setItem('snake_daily_day', nextDay.toString());
    setCurrentDay(nextDay);
    setCanClaim(false);
  };

  // Developer Helper: fast-forward time to test claims instantly
  const handleDevFastForward = () => {
    const expiredTime = Date.now() - 24 * 60 * 60 * 1000 - 1000;
    localStorage.setItem('snake_daily_last_claimed', expiredTime.toString());
    setLastClaimed(expiredTime);
    setCanClaim(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl flex flex-col text-left">
        
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Gift size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">Daily Reward</h2>
              <p className="text-[11px] text-neutral-400">Log in daily to claim free gold coins!</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Reward Calendar */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {REWARDS.map((reward) => {
              const isClaimed = reward.day < currentDay;
              const isToday = reward.day === currentDay;
              const isFuture = reward.day > currentDay;

              return (
                <div
                  key={reward.day}
                  className={`relative p-2.5 rounded-lg border-2 flex flex-col items-center justify-center text-center gap-1.5 select-none transition-all duration-200 ${
                    isToday
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
                      : isClaimed
                      ? 'border-neutral-800 bg-neutral-950/40 opacity-60'
                      : 'border-neutral-800 bg-neutral-950'
                  }`}
                >
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">
                    Day {reward.day}
                  </span>

                  <div className={`p-1.5 rounded-full ${isToday ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                    <Gift size={16} />
                  </div>

                  <span className={`text-[11px] font-bold ${isToday ? 'text-emerald-400' : 'text-yellow-500'}`}>
                    +{reward.amount}
                  </span>

                  {/* Status Check overlays */}
                  {isClaimed && (
                    <div className="absolute inset-0 bg-neutral-950/40 flex items-center justify-center rounded-lg">
                      <span className="p-1 bg-emerald-500 text-black rounded-full">
                        <Check size={8} strokeWidth={4} />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Area */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-neutral-400 font-mono">Current streak</p>
              <h3 className="text-sm font-bold text-neutral-200 mt-0.5">
                Day {currentDay} of 7 Reward
              </h3>
            </div>

            {canClaim ? (
              <button
                onClick={handleClaim}
                className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-500/15"
              >
                Claim Reward
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-800">
                <Clock size={14} className="text-neutral-500" />
                <span className="text-[11px] font-mono text-neutral-400 font-bold">
                  Next Claim in {timeRemaining || 'Loading...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Dev Controls */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center text-[10px] text-neutral-500 font-mono">
          <span className="flex items-center gap-1 text-[9px]">
            <Info size={10} /> Fast testing included
          </span>
          <button
            onClick={handleDevFastForward}
            className="px-2 py-0.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded transition-all font-mono"
          >
            ⚡ Dev: Reset 24h Timer
          </button>
        </div>

      </div>
    </div>
  );
}
