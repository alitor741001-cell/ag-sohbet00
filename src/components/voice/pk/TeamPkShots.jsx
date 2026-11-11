import { useEffect, useRef, useState } from 'react';

const LANES = [30, 52, 74];

/**
 * Takım puanı arttığında o takımdan rakibe doğru neon mermiler atılır.
 * Odadaki herkes aynı maç kaydını izlediği için ateşi herkes görür.
 * `onHit` rakip panelin kısa sarsıntısı için çağrılır.
 */
export default function TeamPkShots({ blue = 0, red = 0, onHit }) {
  const prev = useRef(null);
  const [shots, setShots] = useState([]);

  useEffect(() => {
    const last = prev.current;
    prev.current = { blue, red };
    if (!last) return;
    const sides = [];
    if (blue > last.blue) sides.push('blue');
    if (red > last.red) sides.push('red');
    if (!sides.length) return;
    const born = sides.map((side) => ({ id: `${side}-${Date.now()}-${Math.random()}`, side }));
    setShots((list) => [...list, ...born].slice(-6));
    sides.forEach((side) => window.setTimeout(() => onHit?.(side === 'blue' ? 'red' : 'blue'), 500));
    window.setTimeout(() => setShots((list) => list.filter((shot) => !born.includes(shot))), 1400);
  }, [blue, red]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {shots.map((shot) => (
        <div key={shot.id} className={`team-shot-${shot.side} absolute inset-0`}>
          {LANES.map((top, lane) => {
            const delay = `${lane * 0.12}s`;
            return (
              <span key={lane}>
                <span className="team-shot-flash" style={{ top: `${top}%`, animationDelay: delay }} />
                <span className="team-shot-bolt" style={{ top: `${top}%`, animationDelay: delay }} />
                <span className="team-shot-burst" style={{ top: `${top}%`, animationDelay: `${lane * 0.12 + 0.45}s` }} />
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}