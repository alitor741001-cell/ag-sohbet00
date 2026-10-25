import { useEffect, useRef } from 'react';

export default function useDedeWizardVideo({ orbs, spinKey, rolling, spinning }) {
  const videoRef = useRef(null);
  const queue = useRef([]);
  const playing = useRef(false);
  const seen = useRef(new Set());
  const struckSpin = useRef(0);
  const orbKey = (orbs || []).map(o => `${o.reel}:${o.row}:${o.value}`).join('-');
  const playNext = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || playing.current || !queue.current.length) return;
    queue.current.shift();
    playing.current = true;
    video.currentTime = 0;
    video.playbackRate = video.duration / 2;
    video.play();
  };
  useEffect(() => {
    if (!spinKey || rolling) return;
    const multiplier = Boolean(orbKey);
    if (!multiplier && (spinning || struckSpin.current === spinKey)) return;
    const cue = `${spinKey}:${multiplier ? orbKey : 'empty'}`;
    if (seen.current.has(cue)) return;
    seen.current.add(cue);
    struckSpin.current = spinKey;
    if (seen.current.size > 100) seen.current = new Set([cue]);
    queue.current.push(cue);
    playNext();
  }, [spinKey, rolling, spinning, orbKey]);
  useEffect(() => () => {
    queue.current = [];
    videoRef.current?.pause();
  }, []);
  return {
    ref: videoRef,
    onLoadedData: playNext,
    onEnded: () => {
      playing.current = false;
      playNext();
    },
  };
}