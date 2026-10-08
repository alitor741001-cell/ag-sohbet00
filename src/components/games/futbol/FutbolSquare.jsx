import React, { useEffect } from 'react';
import useSquareRun from './useSquareRun';

/**
 * Çekiliş karesi: kendi koşusunu yürütür, yalnızca kendini yeniden çizer.
 * Bahis konduktan sonra geri sayım bittiğinde ortadan çıkar, kartların üstünde
 * döner ve kazanan kartın üstünde durur.
 */
export default function FutbolSquare({ containerRef, winner, active, remaining, sound, onLanded }) {
  const { square, landed } = useSquareRun({ containerRef, winner, active, remaining, sound });

  useEffect(() => {
    if (landed) onLanded?.();
  }, [landed, onLanded]);

  if (!square) return null;

  return (
    <span
      aria-hidden="true"
      className={`fut-square ${square.done ? 'fut-square-done' : ''}`}
      style={{
        left: `${square.left}px`,
        top: `${square.top}px`,
        width: `${square.width}px`,
        height: `${square.height}px`,
        transform: `translate(-50%, -50%) rotate(${square.rotate}deg)`,
      }}
    />
  );
}