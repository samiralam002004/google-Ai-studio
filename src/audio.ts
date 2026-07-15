class AudioSynth {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private isMusicPlaying = false;
  private soundEnabled = true;
  private musicEnabled = true;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled && this.isMusicPlaying) {
      this.stopMusic();
    } else if (enabled && !this.isMusicPlaying) {
      this.startMusic();
    }
  }

  playEat() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playPowerup() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.06, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.15);
    });
  }

  playDie() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Low frequency rumbling explosion
    const osc = this.ctx.createOscillator();
    const noiseGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(20, now + 0.4);

    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.4);

    // High frequency break noise
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(300, now);
    osc2.frequency.setValueAtTime(100, now + 0.15);
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start();
    osc2.stop(now + 0.2);
  }

  playBoost() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    // A brief low pitch boost puff sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  startMusic() {
    if (!this.musicEnabled) return;
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    this.initCtx();

    let step = 0;
    // Ambient simple loop: G-scale rhythmic soft notes
    const melody = [196.00, 220.00, 246.94, 293.66, 196.00, 293.66, 329.63, 392.00]; // G3, A3, B3, D4
    const bass = [98.00, 98.00, 110.00, 110.00, 123.47, 123.47, 146.83, 146.83]; // Bassline G2, A2, B2, D3

    this.musicInterval = setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;

      const now = this.ctx.currentTime;

      // Play soft bass every 2 beats (step % 2 === 0)
      if (step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bass[(step / 2) % bass.length], now);
        bassGain.gain.setValueAtTime(0.03, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start();
        bassOsc.stop(now + 0.5);
      }

      // Play melody note with 40% probability on subdivisions
      if (Math.random() < 0.4) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'triangle';
        melOsc.frequency.setValueAtTime(melody[Math.floor(Math.random() * melody.length)], now);
        melGain.gain.setValueAtTime(0.012, now);
        melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        melOsc.connect(melGain);
        melGain.connect(this.ctx.destination);
        melOsc.start();
        melOsc.stop(now + 0.3);
      }

      step++;
    }, 250); // 120 BPM subdivisions (quarter notes)
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const audioSynth = new AudioSynth();
