import { useEffect } from 'react';

// Mavi halkanın ışığı, mikrofon yerine doğrudan şarkının ses dalgasını izler.
export default function useMusicPulse(graph, audioRef) {
  useEffect(() => {
    const samples = new Uint8Array(256);
    const root = document.documentElement;
    const timer = window.setInterval(() => {
      const analyser = graph.current?.analyser;
      if (!analyser || audioRef.current?.paused) return;
      analyser.getByteTimeDomainData(samples);
      const energy = Math.min(1, Math.sqrt(samples.reduce((sum, n) => sum + ((n - 128) / 128) ** 2, 0) / samples.length) * 4);
      root.style.setProperty('--music-glow-radius', `${12 + energy * 24}px`);
      root.style.setProperty('--music-glow-spread', `${3 + energy * 6}px`);
    }, 100);
    return () => {
      window.clearInterval(timer);
      root.style.removeProperty('--music-glow-radius');
      root.style.removeProperty('--music-glow-spread');
    };
  }, [graph, audioRef]);
}