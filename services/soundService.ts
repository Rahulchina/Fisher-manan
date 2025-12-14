
// Check for browser support
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx && AudioContextClass) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

const ensureContext = () => {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
};

// Generic tone generator
const playTone = (freq: number, type: OscillatorType, duration: number, startTime = 0, vol = 0.1) => {
  const ctx = ensureContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
};

// Noise buffer for mechanical/water sounds
let noiseBuffer: AudioBuffer | null = null;
const getNoiseBuffer = (ctx: AudioContext) => {
  if (!noiseBuffer) {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
};

export const playUiClick = () => {
  playTone(800, 'sine', 0.1, 0, 0.05);
};

export const playUiSelect = () => {
  playTone(1200, 'sine', 0.1, 0, 0.05);
};

export const playCast = () => {
  const ctx = ensureContext();
  if (!ctx) return;

  // Swoosh sound (noise + filter)
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);
  filter.Q.value = 1;

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  noise.stop(ctx.currentTime + 0.6);
  
  // Slide whistle effect
  playTone(600, 'triangle', 0.4, 0, 0.1);
};

export const playBite = () => {
  // Urgent double beep
  playTone(880, 'square', 0.1, 0, 0.1); // A5
  playTone(880, 'square', 0.1, 0.15, 0.1);
};

export const playReel = () => {
  const ctx = ensureContext();
  if (!ctx) return;
  // Ratchet sound
  for(let i=0; i<10; i++) {
     playTone(200, 'sawtooth', 0.05, i * 0.08, 0.05);
  }
};

export const playCatch = (rarity: string) => {
  const ctx = ensureContext();
  if (!ctx) return;

  const now = 0;
  // Base success sound
  playTone(523.25, 'sine', 0.2, now, 0.1); // C5
  playTone(659.25, 'sine', 0.2, now + 0.1, 0.1); // E5
  playTone(783.99, 'sine', 0.4, now + 0.2, 0.1); // G5

  if (rarity === 'Rare') {
      playTone(1046.50, 'sine', 0.5, now + 0.3, 0.1); // C6
  }
  if (rarity === 'Epic') {
      playTone(1046.50, 'square', 0.1, now + 0.3, 0.05); // C6
      playTone(1318.51, 'square', 0.1, now + 0.4, 0.05); // E6
      playTone(1567.98, 'square', 0.6, now + 0.5, 0.05); // G6
  }
  if (rarity === 'Legendary') {
      // Magical Arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
      notes.forEach((freq, i) => {
          playTone(freq, 'triangle', 0.3, now + (i * 0.08), 0.1);
      });
  }
};

export const playSell = () => {
  // Coin sound
  playTone(1200, 'sine', 0.1, 0, 0.1);
  playTone(1600, 'sine', 0.4, 0.05, 0.1);
};

export const playUpgrade = () => {
  // Power up sound
  const ctx = ensureContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
};

export const playQuestComplete = () => {
    // Fanfare
    playTone(523.25, 'square', 0.1, 0, 0.1);
    playTone(523.25, 'square', 0.1, 0.15, 0.1);
    playTone(523.25, 'square', 0.1, 0.30, 0.1);
    playTone(783.99, 'square', 0.6, 0.45, 0.1);
};

export const playBucketFull = () => {
    playTone(150, 'sawtooth', 0.3, 0, 0.1);
    playTone(100, 'sawtooth', 0.3, 0.2, 0.1);
};
