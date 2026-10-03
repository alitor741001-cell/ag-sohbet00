// Oyun sesleri — dosya gerektirmeyen WebAudio sinyalleri. Tercih cihazda saklanır.
const STORAGE_KEY = 'filmkeyfi-game-sound';

let context = null;
let muted = false;
try { muted = localStorage.getItem(STORAGE_KEY) === 'off'; } catch { muted = false; }

const audio = () => {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
};

const tone = ({ freq, duration = 0.12, type = 'sine', gain = 0.06, delay = 0, slideTo = null }) => {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
};

export const sounds = {
  isMuted: () => muted,
  setMuted(next) {
    muted = !!next;
    try { localStorage.setItem(STORAGE_KEY, muted ? 'off' : 'on'); } catch {}
  },
  play(name) {
    if (muted) return;
    switch (name) {
      case 'click': tone({ freq: 420, duration: 0.06, type: 'square', gain: 0.045 }); break;
      case 'spin': [0, 0.06, 0.12, 0.18].forEach((delay, index) => tone({ freq: 260 + index * 90, duration: 0.08, type: 'triangle', gain: 0.05, delay })); break;
      case 'reel': tone({ freq: 170, duration: 0.1, type: 'square', gain: 0.05, slideTo: 96 }); break;
      case 'coin': tone({ freq: 880, duration: 0.08, gain: 0.06 }); tone({ freq: 1320, duration: 0.12, gain: 0.05, delay: 0.07 }); break;
      case 'win': [523, 659, 784, 1047].forEach((freq, index) => tone({ freq, duration: 0.18, type: 'triangle', gain: 0.06, delay: index * 0.09 })); break;
      case 'jackpot': [523, 659, 784, 1047, 1319, 1568].forEach((freq, index) => tone({ freq, duration: 0.32, type: 'sawtooth', gain: 0.05, delay: index * 0.11 })); break;
      case 'cashout': [659, 988, 1319].forEach((freq, index) => tone({ freq, duration: 0.15, gain: 0.06, delay: index * 0.07 })); break;
      case 'crash': tone({ freq: 420, duration: 0.7, type: 'sawtooth', gain: 0.06, slideTo: 60 }); break;
      case 'launch': tone({ freq: 180, duration: 0.7, type: 'triangle', gain: 0.05, slideTo: 620 }); break;
      default: break;
    }
  },
};

export default sounds;