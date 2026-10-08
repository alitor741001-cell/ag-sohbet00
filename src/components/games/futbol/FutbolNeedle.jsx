import React, { useEffect } from 'react';
import useNeedleSpin from './useNeedleSpin';

/** İbre: ortadan döner, hızı yavaşlar ve kazanan takımın üstünde durur. */
export default function FutbolNeedle({ angle, active, remaining, sound, onLanded }) {
  const { rotation, landed } = useNeedleSpin({ angle, active, remaining, sound });

  useEffect(() => {
    if (landed) onLanded?.();
  }, [landed, onLanded]);

  return (
    <span
      aria-hidden="true"
      className={`fut-needle ${landed ? 'fut-needle-done' : ''}`}
      style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
    />
  );
}