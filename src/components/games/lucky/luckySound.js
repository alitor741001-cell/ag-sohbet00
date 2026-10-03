import { SPIN_MS } from './luckyConfig';

// Basit Web Audio efektleri: ayarlardan kapatılabilir.
let enabled = true;
let context = null;

export const setSoundEnabled = (value) => {
  enabled = value;
};

export const isSoundEnabled = () => enabled;

const audio = () => {
  if (!enabled) return null;
  if (!context) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      context = new Ctor();
    } catch (error) {
      return null;
    }
  }
  return context;
};

const tone = (frequency, duration, type, gain) => {
  const ctx = audio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    amp.gain.value = gain;
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    /* ses desteklenmiyorsa oyun sessiz devam eder */
  }
};

export const playSpin = () => tone(180, Math.min(0.25, SPIN_MS / 1000), 'triangle', 0.04);

export const playWin = () => {
  tone(660, 0.18, 'sine', 0.06);
  window.setTimeout(() => tone(880, 0.22, 'sine', 0.06), 120);
  window.setTimeout(() => tone(1180, 0.3, 'sine', 0.05), 260);
};