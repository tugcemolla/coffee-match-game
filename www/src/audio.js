/* ==========================================================================
   AUDIO SYNTHESIZER ENGINE (Web Audio API)
   ========================================================================== */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmNoteStep = 0;

    // 4-Bar Cozy Lo-Fi Coffee Shop Jazz Chord Progression (Hz)
    // Cmaj7 -> Am7 -> Dm7 -> G7
    this.lofiChords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7: C4, E4, G4, B4
      [220.00, 261.63, 329.63, 392.00], // Am7: A3, C4, E4, G4
      [293.66, 349.23, 440.00, 523.25], // Dm7: D4, F4, A4, C5
      [196.00, 293.66, 349.23, 493.88]  // G7: G3, D4, F4, B4
    ];

    this.initOnFirstTouch();
  }

  initOnFirstTouch() {
    const unlock = () => {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      if (this.soundEnabled && !this.bgmPlaying) {
        this.startBGM();
      }

      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (this.soundEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.soundEnabled;
  }

  startBGM() {
    if (this.bgmPlaying || !this.soundEnabled) return;
    this.bgmPlaying = true;
    this.bgmNoteStep = 0;

    const playNextBar = () => {
      if (!this.bgmPlaying || !this.ctx || !this.soundEnabled) return;

      const chordIdx = Math.floor(this.bgmNoteStep / 4) % this.lofiChords.length;
      const noteIdx = this.bgmNoteStep % 4;
      const freq = this.lofiChords[chordIdx][noteIdx];

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Very soft, relaxing acoustic volume envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.02, now + 0.15); // Soft attack
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5); // Warm lingering decay

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.5);
      } catch (e) {}

      this.bgmNoteStep++;
    };

    playNextBar();
    this.bgmTimer = setInterval(playNextBar, 850); // Relaxed lo-fi tempo (70 BPM)
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // Play tile swap sound (Cozy & Warm Wooden Kalimba Tap)
  playSwap() {
    if (!this.soundEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Primary Warm Kalimba Note (G4 -> C5 Warm Upward Tap)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(392.00, now); // G4
      osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.05); // C5
      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      // Warm Wooden Sub Body (Soft C4 Cushion)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(329.63, now + 0.05); // E4
      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.06);
      osc2.start(now);
      osc2.stop(now + 0.06);
    } catch (e) {}
  }

  // Play Match Chime (Coffee Cup Chime)
  playMatch(comboLevel = 1) {
    if (!this.soundEnabled || !this.ctx) return;
    const baseFreq = 440 + (comboLevel * 60);
    
    [baseFreq, baseFreq * 1.25, baseFreq * 1.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (idx * 0.04));
      
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + (idx * 0.04));
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (idx * 0.04) + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(this.ctx.currentTime + (idx * 0.04));
      osc.stop(this.ctx.currentTime + (idx * 0.04) + 0.3);
    });
  }

  // Play POS Receipt Thermal Printing Sound
  playReceiptPrint() {
    if (!this.soundEnabled || !this.ctx) return;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.03;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
      }, i * 70);
    }
  }

  // Play Shuffle Sound
  playShuffle() {
    if (!this.soundEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Play Victory Fanfare
  playVictory() {
    if (!this.soundEnabled || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (idx * 0.12));
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + (idx * 0.12));
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (idx * 0.12) + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + (idx * 0.12));
      osc.stop(this.ctx.currentTime + (idx * 0.12) + 0.4);
    });
  }

  playVictoryFanfare() {
    this.playVictory();
  }

  playMatchChime(combo = 1) {
    this.playMatch(combo);
  }
}

const audioEngine = new AudioEngine();
