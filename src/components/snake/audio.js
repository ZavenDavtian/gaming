// Procedural Web Audio API sound synthesizer for Snake Arena
// 100% client-side, zero external audio asset dependencies.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.sfxVolume = 0.4;
    this.ambientVolume = 0.15;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientGain = null;
    this.isAmbientPlaying = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.ambientGain && this.ctx) {
      const target = muted ? 0 : this.ambientVolume;
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.1);
    }
  }

  setVolume(sfx, ambient) {
    if (typeof sfx === 'number') this.sfxVolume = Math.max(0, Math.min(1, sfx));
    if (typeof ambient === 'number') {
      this.ambientVolume = Math.max(0, Math.min(1, ambient));
      if (this.ambientGain && this.ctx && !this.isMuted) {
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(this.ambientVolume, this.ctx.currentTime + 0.1);
      }
    }
  }

  // Soft pleasant orb munch / pop with micro frequency slide
  playEat(massBonus = 1) {
    if (this.isMuted || !this.ctx) return;
    try {
      this.ensureContext();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 340 + Math.min(massBonus * 12, 380);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

      gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (_) {}
  }

  // High-energy turbo boost sound
  playBoostBurst() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.ensureContext();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(260, now + 0.12);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (_) {}
  }

  // Big neon explosion when a snake crashes & disintegrates
  playExplosion(isPlayer = false) {
    if (this.isMuted || !this.ctx) return;
    try {
      this.ensureContext();
      const now = this.ctx.currentTime;

      // Low bass drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isPlayer ? 180 : 140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);

      gain.gain.setValueAtTime(this.sfxVolume * (isPlayer ? 0.9 : 0.6), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      // Noise generator for thunderous shockwave
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
      whiteNoise.start(now);
      whiteNoise.stop(now + 0.4);
    } catch (_) {}
  }

  // Triumphant kill notification or milestone chime
  playKillFanfare() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.ensureContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(this.sfxVolume * 0.5, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch (_) {}
  }

  // Start continuous ambient cyberpunk harmonic drone
  startAmbientDrone() {
    if (this.isAmbientPlaying || !this.ctx) return;
    try {
      this.ensureContext();
      const now = this.ctx.currentTime;

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : this.ambientVolume, now);

      // Low pulsating sine
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(55, now); // A1 note

      // Gentle fifth above
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(82.41, now); // E2 note

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
      this.isAmbientPlaying = true;
    } catch (_) {}
  }

  stopAmbientDrone() {
    if (!this.isAmbientPlaying) return;
    try {
      if (this.ambientOsc1) {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
      }
      if (this.ambientOsc2) {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
      }
      if (this.ambientGain) {
        this.ambientGain.disconnect();
      }
    } catch (_) {}
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientGain = null;
    this.isAmbientPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
