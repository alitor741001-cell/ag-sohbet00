import { useEffect, useRef, useState } from 'react';

const KEY = 'aviator-sound';

/** Basit Web Audio sesleri: uçuşta motor uğultusu, uçup gidince düşen ton. */
export default function useAviatorSound(phase) {
  const [on, setOn] = useState(() => localStorage.getItem(KEY) !== 'off');
  const ctxRef = useRef(null);
  const engineRef = useRef(null);

  const toggle = () => setOn((v) => { localStorage.setItem(KEY, v ? 'off' : 'on'); return !v; });

  useEffect(() => {
    const stopEngine = () => { engineRef.current?.stop(); engineRef.current = null; };
    if (!on) { stopEngine(); return undefined; }
    const ctx = ctxRef.current || (ctxRef.current = new (window.AudioContext || window.webkitAudioContext)());
    ctx.resume();
    if (phase === 'running' && !engineRef.current) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 90;
      osc.frequency.linearRampToValueAtTime(260, ctx.currentTime + 20);
      gain.gain.value = 0.04;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      engineRef.current = osc;
    }
    if (phase === 'crashed') {
      stopEngine();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.7);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
    if (phase === 'betting') stopEngine();
    return undefined;
  }, [phase, on]);

  useEffect(() => () => engineRef.current?.stop(), []);

  return { on, toggle };
}