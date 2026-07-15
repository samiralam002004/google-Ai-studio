import React, { useRef, useEffect, useState } from 'react';
import { HelpCircle, Star, Sparkles, Clock, X, Info } from 'lucide-react';
import { audioSynth } from '../audio';

interface LuckyWheelProps {
  onAwardCoins: (amount: number) => void;
  onAwardSkin: (skinId: string) => void;
  onClose: () => void;
}

interface Sector {
  label: string;
  color: string;
  textColor: string;
  value: number; // coins, or special code
  type: 'coins' | 'skin' | 'try_again';
  skinId?: string;
}

const SECTORS: Sector[] = [
  { label: '10 Coins', color: '#1e293b', textColor: '#f1f5f9', value: 10, type: 'coins' },
  { label: '50 Coins', color: '#0ea5e9', textColor: '#ffffff', value: 50, type: 'coins' },
  { label: 'Magma Skin! 🔥', color: '#f97316', textColor: '#ffffff', value: 100, type: 'skin', skinId: 'magma_orange' },
  { label: '25 Coins', color: '#1e293b', textColor: '#f1f5f9', value: 25, type: 'coins' },
  { label: 'Jackpot 💎', color: '#eab308', textColor: '#000000', value: 500, type: 'coins' },
  { label: '5 Coins', color: '#64748b', textColor: '#f1f5f9', value: 5, type: 'coins' },
  { label: 'Royal Purple! 👑', color: '#a855f7', textColor: '#ffffff', value: 250, type: 'skin', skinId: 'royal_purple' },
  { label: '100 Coins', color: '#10b981', textColor: '#ffffff', value: 100, type: 'coins' },
];

export default function LuckyWheel({ onAwardCoins, onAwardSkin, onClose }: LuckyWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCooldown, setSpinCooldown] = useState<number | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);

  const rotationRef = useRef(0);
  const speedRef = useRef(0);
  const friction = 0.98; // slow down factor

  useEffect(() => {
    const savedTime = localStorage.getItem('snake_wheel_last_spin');
    if (savedTime) {
      setSpinCooldown(parseInt(savedTime));
    }
  }, []);

  useEffect(() => {
    if (!spinCooldown) {
      setCanSpin(true);
      return;
    }

    const checkCooldown = () => {
      const now = Date.now();
      const difference = now - spinCooldown;
      const oneHour = 60 * 60 * 1000;

      if (difference >= oneHour) {
        setCanSpin(true);
        setTimeRemaining('');
      } else {
        setCanSpin(false);
        const remaining = oneHour - difference;
        const mins = Math.floor(remaining / (1000 * 60));
        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [spinCooldown]);

  // Draw the Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const radius = size / 2;
    const numSectors = SECTORS.length;
    const arcSize = (Math.PI * 2) / numSectors;

    const drawWheel = () => {
      ctx.clearRect(0, 0, size, size);

      // Draw shadow circle
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw sectors
      SECTORS.forEach((sec, idx) => {
        const startAngle = rotationRef.current + idx * arcSize;
        const endAngle = startAngle + arcSize;

        ctx.fillStyle = sec.color;
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius - 12, startAngle, endAngle);
        ctx.lineTo(radius, radius);
        ctx.fill();

        // Overlay slice border
        ctx.strokeStyle = '#262626';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw sector labels
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(startAngle + arcSize / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = sec.textColor;
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.fillText(sec.label, radius - 28, 0);
        ctx.restore();
      });

      // Draw golden outer rim
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 10, 0, Math.PI * 2);
      ctx.stroke();

      // Draw shining outer dots
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 16; i++) {
        const angle = rotationRef.current + (Math.PI * 2 / 16) * i;
        const dotX = radius + Math.cos(angle) * (radius - 10);
        const dotY = radius + Math.sin(angle) * (radius - 10);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw center core button
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#171717';
      ctx.beginPath();
      ctx.arc(radius, radius, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(radius, radius, 25, 0, Math.PI * 2);
      ctx.stroke();

      // Center logo Star
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', radius, radius);
    };

    drawWheel();
  }, [rotationRef.current]);

  const spin = () => {
    if (isSpinning || !canSpin) return;
    setRewardMsg(null);
    setIsSpinning(true);

    // Initial random physical spin velocities
    speedRef.current = Math.random() * 0.35 + 0.45; // rad per frame

    const animateSpin = () => {
      rotationRef.current += speedRef.current;
      speedRef.current *= friction;

      if (speedRef.current < 0.001) {
        setIsSpinning(false);
        speedRef.current = 0;
        calculateReward();
      } else {
        requestAnimationFrame(animateSpin);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  const calculateReward = () => {
    const numSectors = SECTORS.length;
    const arcSize = (Math.PI * 2) / numSectors;

    // Normalizing rotation angle between [0, 2PI]
    const normalizedRotation = (rotationRef.current % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    
    // The pointer sits at the TOP of the wheel, i.e., at index 0 (angle = -PI/2)
    // To match canvas rotation, we offset and compute sector
    const pointerAngle = (Math.PI * 3) / 2; // top center (270 degrees)
    const winningAngle = (pointerAngle - normalizedRotation + Math.PI * 2) % (Math.PI * 2);
    const winningIndex = Math.floor(winningAngle / arcSize) % numSectors;

    const reward = SECTORS[winningIndex];

    audioSynth.playPowerup();

    if (reward.type === 'skin' && reward.skinId) {
      onAwardSkin(reward.skinId);
      setRewardMsg(`Mubarak ho! Aapne reward me ek special skin jeeti: ${reward.label}`);
    } else {
      onAwardCoins(reward.value);
      setRewardMsg(`Mubarak ho! Aapne ${reward.label} jeete! 🎉`);
    }

    const now = Date.now();
    localStorage.setItem('snake_wheel_last_spin', now.toString());
    setSpinCooldown(now);
    setCanSpin(false);
  };

  const handleDevResetCooldown = () => {
    localStorage.removeItem('snake_wheel_last_spin');
    setSpinCooldown(null);
    setCanSpin(true);
    setRewardMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full max-w-md rounded-xl overflow-hidden shadow-2xl flex flex-col text-left">
        
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Sparkles size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">Lucky Wheel</h2>
              <p className="text-[11px] text-neutral-400">Spin the wheel once an hour for free items!</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wheel Body */}
        <div className="p-6 flex flex-col items-center justify-center relative">
          
          {/* Top Indicator Arrow */}
          <div className="absolute top-[20px] left-1/2 -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-500 filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
          </div>

          {/* Canvas Wheel */}
          <div className="relative">
            <canvas 
              ref={canvasRef} 
              width={280} 
              height={280} 
              className="max-w-full rounded-full border border-neutral-800"
            />
          </div>

          {/* Rewards Notice */}
          {rewardMsg && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-bold text-center w-full animate-pulse">
              {rewardMsg}
            </div>
          )}

          {/* Spin Buttons */}
          <div className="mt-6 w-full space-y-3">
            {canSpin ? (
              <button
                disabled={isSpinning}
                onClick={spin}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-yellow-500/15 disabled:opacity-50"
              >
                {isSpinning ? 'Wheeee Spinning...' : 'SPIN FOR FREE'}
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 w-full">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-neutral-500" />
                  <span className="text-xs text-neutral-400">Next spin available in:</span>
                </div>
                <span className="text-xs font-mono font-bold text-yellow-400">
                  {timeRemaining || 'Loading...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer info / Dev Reset */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center text-[10px] text-neutral-500 font-mono">
          <span className="flex items-center gap-1 text-[9px]">
            <Info size={10} /> hourly rewards testing
          </span>
          <button
            onClick={handleDevResetCooldown}
            className="px-2 py-0.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded transition-all font-mono"
          >
            ⚡ Dev: Reset Hour Timer
          </button>
        </div>

      </div>
    </div>
  );
}
