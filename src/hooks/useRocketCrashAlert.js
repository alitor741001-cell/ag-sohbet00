import { useEffect } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { playRocketCrash, unlockRocketSound } from '@/lib/rocketSound';

/**
 * Sesli odada roket çakıldığı an patlama sesi odadaki herkese duyulur:
 * oyun ekranı açık olmasa da ses gelir.
 */
export default function useRocketCrashAlert(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const unlock = () => unlockRocketSound();
    window.addEventListener('pointerdown', unlock, { once: true });
    const off = subscribeEntity('RocketLive', (event) => {
      const live = event?.data;
      if (!live || live.variant !== 'rocket' || live.status !== 'crashed') return;
      playRocketCrash(live.round_no);
    });
    return () => {
      off();
      window.removeEventListener('pointerdown', unlock);
    };
  }, [enabled]);
}