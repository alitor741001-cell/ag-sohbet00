import { useEffect, useRef, useState } from 'react';
import { playRocketCrash } from '@/lib/rocketCrashSound';

const KEY = 'aviator-sound';

/** Basit Web Audio sesleri: uçuşta motor uğultusu, çakılınca patlama. */
export default function useAviatorSound(phase, roundNo) {
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
      // Patlama sesi odadaki herkesle aynı kaynaktan gelir: tur başına tek kez çalar.
      playRocketCrash(roundNo);
    }
    if (phase === 'betting') stopEngine();
    return undefined;
  }, [phase, on, roundNo]);

  useEffect(() => () => engineRef.current?.stop(), []);

  return { on, toggle };
}