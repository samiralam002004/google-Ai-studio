import React, { useState, useEffect } from 'react';
import { GameState, GameStats, GameSettings, SKINS_DATA } from './types';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import SkinShop from './components/SkinShop';
import DailyReward from './components/DailyReward';
import LuckyWheel from './components/LuckyWheel';
import AdMobBanner from './components/AdMobBanner';
import { Trophy, Coins, Target, RefreshCw, LogOut, Star, Sparkles } from 'lucide-react';
import { audioSynth } from './audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [activeIsMultiplayer, setActiveIsMultiplayer] = useState(false);

  // Unlocks & Wallets Saved States
  const [coins, setCoins] = useState(150); // starting coins
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['classic_green', 'neon_blue']);
  const [stats, setStats] = useState<GameStats>({
    totalMatches: 0,
    highScore: 0,
    totalKills: 0,
    totalCoins: 0,
  });
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    controlType: 'mouse',
    playerName: 'SnakeWorm',
    selectedSkin: 'classic_green',
  });

  // Modal displays
  const [isSkinShopOpen, setIsSkinShopOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);

  // Match telemetry for Game Over screen
  const [lastMatchStats, setLastMatchStats] = useState({
    score: 0,
    kills: 0,
    coinsEarned: 0,
    newHighScore: false,
  });

  // Load state on mount
  useEffect(() => {
    const savedCoins = localStorage.getItem('snake_coins');
    if (savedCoins) setCoins(parseInt(savedCoins));

    const savedSkins = localStorage.getItem('snake_unlocked_skins');
    if (savedSkins) {
      try {
        setUnlockedSkins(JSON.parse(savedSkins));
      } catch (e) {
        console.error(e);
      }
    }

    const savedStats = localStorage.getItem('snake_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error(e);
      }
    }

    const savedSettings = localStorage.getItem('snake_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error(e);
      }
    }

    // Start background synth audio loop on user action fallback
    const initMusic = () => {
      audioSynth.setSoundEnabled(settings.soundEnabled);
      audioSynth.setMusicEnabled(settings.musicEnabled);
      window.removeEventListener('click', initMusic);
    };
    window.addEventListener('click', initMusic);
    return () => window.removeEventListener('click', initMusic);
  }, []);

  // Sync methods to localStorage
  const saveCoins = (newCoins: number) => {
    setCoins(newCoins);
    localStorage.setItem('snake_coins', newCoins.toString());
  };

  const saveUnlockedSkins = (skinsList: string[]) => {
    setUnlockedSkins(skinsList);
    localStorage.setItem('snake_unlocked_skins', JSON.stringify(skinsList));
  };

  const saveStats = (updatedStats: GameStats) => {
    setStats(updatedStats);
    localStorage.setItem('snake_stats', JSON.stringify(updatedStats));
  };

  const handleUpdateSettings = (updatedSettings: GameSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem('snake_settings', JSON.stringify(updatedSettings));
  };

  // Launch into play mode
  const handleStartGame = (isMultiplayerMode: boolean) => {
    setActiveIsMultiplayer(isMultiplayerMode);
    setGameState(isMultiplayerMode ? 'GAME_ONLINE' : 'GAME_OFFLINE');
    audioSynth.playPowerup();
    audioSynth.startMusic();
  };

  // Quit back to menu
  const handleQuitToMenu = () => {
    setGameState('MENU');
    audioSynth.stopMusic();
  };

  // Game over state triggers
  const handleGameOver = (finalScore: number, kills: number, coinsEarned: number) => {
    audioSynth.stopMusic();
    audioSynth.playDie();

    const isNewHigh = finalScore > stats.highScore;

    // Update player wallet & career metrics
    const newCoinsBalance = coins + coinsEarned;
    saveCoins(newCoinsBalance);

    const updatedStats: GameStats = {
      totalMatches: stats.totalMatches + 1,
      highScore: isNewHigh ? finalScore : stats.highScore,
      totalKills: stats.totalKills + kills,
      totalCoins: stats.totalCoins + coinsEarned,
    };
    saveStats(updatedStats);

    setLastMatchStats({
      score: finalScore,
      kills,
      coinsEarned,
      newHighScore: isNewHigh,
    });

    setGameState('GAMEOVER');
  };

  // Skin Purchases
  const handleSelectSkin = (skinId: string) => {
    handleUpdateSettings({ ...settings, selectedSkin: skinId });
  };

  const handleBuySkin = (skinId: string, cost: number) => {
    if (coins >= cost) {
      const newCoins = coins - cost;
      saveCoins(newCoins);
      const updatedSkins = [...unlockedSkins, skinId];
      saveUnlockedSkins(updatedSkins);
      handleUpdateSettings({ ...settings, selectedSkin: skinId });
    }
  };

  const handleAwardCoins = (amount: number) => {
    const newCoins = coins + amount;
    saveCoins(newCoins);
  };

  const handleAwardSkin = (skinId: string) => {
    if (!unlockedSkins.includes(skinId)) {
      const updatedSkins = [...unlockedSkins, skinId];
      saveUnlockedSkins(updatedSkins);
    }
  };

  const getSelectedSkinColor = () => {
    const skin = SKINS_DATA.find((s) => s.id === settings.selectedSkin);
    return skin ? skin.color : '#10b981';
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Route Views Switching */}
      {gameState === 'MENU' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenSkins={() => setIsSkinShopOpen(true)}
          onOpenDaily={() => setIsDailyOpen(true)}
          onOpenWheel={() => setIsWheelOpen(true)}
          coins={coins}
          stats={stats}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {(gameState === 'GAME_OFFLINE' || gameState === 'GAME_ONLINE') && (
        <GameCanvas
          playerName={settings.playerName}
          selectedSkinColor={getSelectedSkinColor()}
          selectedSkinId={settings.selectedSkin}
          isMultiplayer={activeIsMultiplayer}
          onGameOver={handleGameOver}
          onQuit={handleQuitToMenu}
        />
      )}

      {gameState === 'GAMEOVER' && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-4 relative overflow-hidden select-none">
          {/* Decorative background stars */}
          <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />

          <div className="bg-slate-900/65 backdrop-blur-md border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative z-10 animate-fade-in space-y-6">
            
            {/* Crown or Trophy banner */}
            <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-bounce">
              <Trophy size={32} />
            </div>

            <div>
              <h2 className="text-3xl font-black tracking-tight text-red-500">GAME OVER</h2>
              <p className="text-xs text-slate-400 font-mono mt-1">Aapki snake crash ho gayi!</p>
            </div>

            {/* High score celebratory ribbon */}
            {lastMatchStats.newHighScore && (
              <div className="py-1 px-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full max-w-max mx-auto flex items-center gap-1.5 animate-pulse">
                <Sparkles size={13} /> NEW HIGH SCORE RECORD!
              </div>
            )}

            {/* Telemetry Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Final Length</span>
                <span className="text-lg font-black text-yellow-500 font-mono mt-1 block">{lastMatchStats.score}</span>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Kills tally</span>
                <span className="text-lg font-black text-rose-500 font-mono mt-1 block">{lastMatchStats.kills}</span>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Coins Reward</span>
                <span className="text-lg font-black text-amber-500 font-mono mt-1 block">+{lastMatchStats.coinsEarned}c</span>
              </div>
            </div>

            {/* Simulated Interstitial Ad Notice */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-left gap-4">
              <div>
                <span className="px-1.5 py-0.5 bg-yellow-500/15 border border-yellow-500/20 rounded text-[8px] font-mono font-bold text-yellow-400 uppercase">Ad</span>
                <p className="text-[11px] font-semibold text-slate-200 mt-1">Get Double Coins with Ad!</p>
                <p className="text-[9px] text-slate-500 leading-normal">Watch a brief promotional visual to double your gains.</p>
              </div>
              <button 
                onClick={() => {
                  audioSynth.playPowerup();
                  handleAwardCoins(lastMatchStats.coinsEarned);
                  alert('Shukriya! Double coins claim ho gaye hain.');
                }}
                className="px-3 py-1.5 bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-bold text-[10px] rounded shadow transition-colors flex items-center gap-1 shrink-0"
              >
                Watch Ad
              </button>
            </div>

            {/* Reset / Quit Actions */}
            <div className="space-y-2.5">
              <button
                onClick={() => handleStartGame(activeIsMultiplayer)}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} strokeWidth={3} /> TRY AGAIN
              </button>

              <button
                onClick={handleQuitToMenu}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={14} /> EXIT TO MAIN MENU
              </button>
            </div>

          </div>

          {/* AdMob Banner placement on Game Over view */}
          <AdMobBanner position="bottom" />
        </div>
      )}

      {/* OVERLAY MODALS */}

      {/* Skin Shop Modal */}
      {isSkinShopOpen && (
        <SkinShop
          coins={coins}
          unlockedSkins={unlockedSkins}
          selectedSkin={settings.selectedSkin}
          onSelectSkin={handleSelectSkin}
          onBuySkin={handleBuySkin}
          onClose={() => setIsSkinShopOpen(false)}
        />
      )}

      {/* Daily Gift Reward Modal */}
      {isDailyOpen && (
        <DailyReward
          onAwardCoins={handleAwardCoins}
          onClose={() => setIsDailyOpen(false)}
        />
      )}

      {/* Lucky Wheel Modal */}
      {isWheelOpen && (
        <LuckyWheel
          onAwardCoins={handleAwardCoins}
          onAwardSkin={handleAwardSkin}
          onClose={() => setIsWheelOpen(false)}
        />
      )}

    </div>
  );
}
