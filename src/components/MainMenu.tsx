import React, { useState, useEffect } from 'react';
import { Play, Coins, User, Compass, Trophy, Flame, HelpCircle, Gift, Settings, ShieldAlert, Shield, Volume2, VolumeX, Music } from 'lucide-react';
import { GameStats, GameSettings, SKINS_DATA } from '../types';
import AdMobBanner from './AdMobBanner';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface MainMenuProps {
  onStartGame: (isMultiplayer: boolean) => void;
  onOpenSkins: () => void;
  onOpenDaily: () => void;
  onOpenWheel: () => void;
  coins: number;
  stats: GameStats;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
}

export default function MainMenu({
  onStartGame,
  onOpenSkins,
  onOpenDaily,
  onOpenWheel,
  coins,
  stats,
  settings,
  onUpdateSettings
}: MainMenuProps) {
  const [name, setName] = useState(settings.playerName || 'SnakeWorm');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const selectedSkin = SKINS_DATA.find((s) => s.id === settings.selectedSkin) || SKINS_DATA[0];

  useEffect(() => {
    onUpdateSettings({ ...settings, playerName: name });
  }, [name]);

  const handleSoundToggle = () => {
    const updated = !settings.soundEnabled;
    onUpdateSettings({ ...settings, soundEnabled: updated });
    // update audio synth
    import('../audio').then(({ audioSynth }) => {
      audioSynth.setSoundEnabled(updated);
      audioSynth.playEat();
    });
  };

  const handleMusicToggle = () => {
    const updated = !settings.musicEnabled;
    onUpdateSettings({ ...settings, musicEnabled: updated });
    import('../audio').then(({ audioSynth }) => {
      audioSynth.setMusicEnabled(updated);
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 pb-28 relative overflow-hidden select-none">
      
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      <div className="relative w-full max-w-4xl z-10 flex flex-col items-center">
        
        {/* Game Title Logo Banner */}
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-1">
            <span className="px-2.5 py-1 bg-yellow-500 text-slate-950 text-[10px] font-mono tracking-widest uppercase font-extrabold rounded">
              Beta Live
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-rose-400 drop-shadow">
            SNAKE.IO ONLINE
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Eat Pellets • Hunt Rivals • Dominate the Slither Arena
          </p>
        </div>

        {/* Outer Dashboard Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          
          {/* Column 1: Profile & Customization */}
          <div className="bg-slate-900/40 backdrop-blur border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                My Profile
              </h3>
              
              {/* Display Name Input */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-slate-400 font-mono font-semibold">Enter Nickname</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={13} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.substring(0, 15))}
                    placeholder="Enter nickname..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs font-bold text-slate-200 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              {/* Skin Display Panel */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] text-slate-400 font-mono font-semibold">Current Skin</label>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full border border-slate-800"
                      style={{
                        background: selectedSkin.patternType === 'rainbow' 
                          ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
                          : selectedSkin.patternType === 'glow'
                          ? selectedSkin.color
                          : `linear-gradient(135deg, ${selectedSkin.color}, ${selectedSkin.secondaryColor || selectedSkin.color})`,
                        boxShadow: selectedSkin.patternType === 'glow' ? `0 0 10px ${selectedSkin.color}` : 'none'
                      }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{selectedSkin.name}</h4>
                      <p className="text-[10px] text-slate-400">Tap customize to unlock more</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenSkins}
              className="mt-4 w-full py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-lg text-xs font-bold text-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Compass size={14} /> Customize Skin
            </button>
          </div>

          {/* Column 2: Play Modes Selector */}
          <div className="bg-slate-900/40 backdrop-blur border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl md:col-span-1">
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                Game Modes
              </h3>

              <div className="flex items-center justify-between bg-slate-950/40 px-3.5 py-1.5 rounded-full border border-slate-800 max-w-max mx-auto">
                <Coins className="text-yellow-500" size={14} />
                <span className="text-yellow-400 font-bold font-mono text-xs ml-1.5">{coins} COINS</span>
              </div>
            </div>

            {/* Launch Action Buttons */}
            <div className="space-y-3 mt-4">
              <button
                onClick={() => onStartGame(false)}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={15} strokeWidth={3} /> PLAY SOLO (OFFLINE)
              </button>

              <button
                onClick={() => onStartGame(true)}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass size={15} strokeWidth={2.5} /> MULTIPLAYER (ONLINE)
              </button>
            </div>

            {/* Daily & Wheel triggers */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={onOpenDaily}
                className="py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] font-bold text-slate-300 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Gift size={13} className="text-emerald-500" /> Daily Gift
              </button>
              <button
                onClick={onOpenWheel}
                className="py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] font-bold text-slate-300 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Flame size={13} className="text-yellow-500" /> Lucky Wheel
              </button>
            </div>
          </div>

          {/* Column 3: Stats & settings */}
          <div className="bg-slate-900/40 backdrop-blur border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                My Career Stats
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Total Matches</span>
                  <span className="font-bold text-slate-200 font-mono">{stats.totalMatches}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">High Score Peak</span>
                  <span className="font-bold text-yellow-400 font-mono">{stats.highScore}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Total Kills</span>
                  <span className="font-bold text-rose-400 font-mono">{stats.totalKills}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Total Gold Earned</span>
                  <span className="font-bold text-amber-500 font-mono">{stats.totalCoins}</span>
                </div>
              </div>
            </div>

            {/* Audio Settings Toggles */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleSoundToggle}
                className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  settings.soundEnabled 
                    ? 'bg-slate-950 border-slate-700 text-slate-300' 
                    : 'bg-slate-950/20 border-slate-800/60 text-slate-600'
                }`}
                title="Toggle sound effects"
              >
                {settings.soundEnabled ? <Volume2 size={13} className="text-cyan-500" /> : <VolumeX size={13} />} Sound FX
              </button>
              
              <button
                onClick={handleMusicToggle}
                className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  settings.musicEnabled 
                    ? 'bg-slate-950 border-slate-700 text-slate-300' 
                    : 'bg-slate-950/20 border-slate-800/60 text-slate-600'
                }`}
                title="Toggle ambient music"
              >
                <Music size={13} className={settings.musicEnabled ? 'text-purple-500' : ''} /> BGM Music
              </button>
            </div>
          </div>

        </div>

        {/* Small Bottom Info Row & Privacy policy trigger */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between w-full max-w-lg px-2 text-[10px] text-slate-500 font-mono">
          <span>Version 1.0.8 (Stable Build)</span>
          <button 
            onClick={() => setIsPrivacyOpen(true)}
            className="hover:text-yellow-500 underline transition-colors cursor-pointer"
          >
            Privacy Policy (गोपनीयता नीति)
          </button>
        </div>

      </div>

      {/* Simulated AdMob Banner */}
      <AdMobBanner position="bottom" />

      {/* Privacy Policy Modal overlay */}
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

    </div>
  );
}
