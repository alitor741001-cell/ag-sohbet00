import { useEffect, useState } from 'react';
import prepareRocketCelebration from '@/components/voice/roomRocket/rocketCelebrationArtwork';

export default function useRocketCelebrationArt() {
  const [result, setResult] = useState({ art: null, error: false });
  useEffect(() => {
    let active = true;
    prepareRocketCelebration().then(
      art => { if (active) setResult({ art, error: false }); },
      () => { if (active) setResult({ art: null, error: true }); },
    );
    return () => { active = false; };
  }, []);
  return result;
}