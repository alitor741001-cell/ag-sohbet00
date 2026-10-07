import { useCallback, useEffect, useRef, useState } from 'react';
import useMusicPulse from '@/hooks/useMusicPulse';

const KEY = 'filmykeyfi:roomMusicVolume';
export default function useRoomMusicVolume(audioRef, muted = false) {
  const [volume, updateVolume] = useState(() => Math.min(1, Math.max(0, Number(localStorage.getItem(KEY) ?? 0.8))));
  const value = useRef(volume);
  // Hoparlör kapatıldığında şarkı da susar; ses seviyesi ayarı olduğu gibi saklanır.
  const silent = useRef(!!muted);
  const graph = useRef(null);
  useMusicPulse(graph, audioRef);
  const resume = useCallback(() => {
    const audio = audioRef.current;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!audio) return;
    if (!graph.current && Context) {
      const context = new Context();
      const source = context.createMediaElementSource(audio);
      const gain = context.createGain();
      gain.gain.value = value.current;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser); analyser.connect(gain); gain.connect(context.destination);
      graph.current = { context, gain, analyser };
    }
    const level = silent.current ? 0 : value.current;
    if (graph.current) {
      audio.volume = 1;
      graph.current.gain.gain.value = level;
      if (graph.current.context.state !== 'running') graph.current.context.resume().catch(() => {});
    } else audio.volume = level;
    audio.muted = level === 0;
  }, [audioRef]);
  const setVolume = useCallback((input) => {
    const next = Math.min(1, Math.max(0, Number(input) || 0));
    value.current = next; updateVolume(next);
    localStorage.setItem(KEY, String(next));
    resume();
  }, [resume]);
  useEffect(() => {
    window.addEventListener('pointerdown', resume);
    window.addEventListener('touchstart', resume, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('touchstart', resume);
      graph.current?.context.close().catch(() => {});
      graph.current = null;
    };
  }, [resume]);
  // Hoparlör düğmesi: şarkı yalnızca kısılır; konumu ve ses seviyesi ayarı bozulmaz.
  useEffect(() => {
    silent.current = !!muted;
    const audio = audioRef.current;
    if (graph.current) graph.current.gain.gain.value = silent.current ? 0 : value.current;
    if (!audio) return;
    audio.muted = silent.current || value.current === 0;
    if (!graph.current) audio.volume = silent.current ? 0 : value.current;
  }, [muted, audioRef]);
  return { volume, setVolume, resume };
}