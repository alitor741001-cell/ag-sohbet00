import { useCallback, useEffect, useRef, useState } from 'react';

const LANES = [40, 72];
const AUTO_FIRE_MS = 5000;

/**
 * Takım puanı arttığında o takımdan rakibe doğru neon mermiler atılır; önde olan takım
 * (`leader`) ayrıca her 5 saniyede bir ateş eder. Odadaki herkes aynı maç kaydını
 * izlediği için ateşi herkes görür. `onHit` rakip panelin kısa sarsıntısı için çağrılır.
 */
export default function TeamPkShots({ blue = 0, red = 0, leader = '', onHit }) {
  const prev = useRef(null);
  const [shots, setShots] = useState([]);

  const fire = useCallback((sides) => {
    const born = sides.map((side) => ({ id: `${side}-${Date.now()}-${Math.random()}`, side }));
    setShots((list) => [...list, ...born].slice(-6));
    sides.forEach((side) => window.setTimeout(() => onHit?.(side === 'blue' ? 'red' : 'blue'), 500));
    window.setTimeout(() => setShots((list) => list.filter((shot) => !born.includes(shot))), 1400);
  }, [onHit]);

  useEffect(() => {
    const last = prev.current;
    prev.current = { blue, red };
    if (!last) return;
    const sides = [];
    if (blue > last.blue) sides.push('blue');
    if (red > last.red) sides.push('red');
    if (sides.length) fire(sides);
  }, [blue, red]); // eslint-disable-line react-hooks/exhaustive-deps

  // Önde olan takımın silahları 5 saniyede bir rakibe ateş eder.
  useEffect(() => {
    if (!leader) return undefined;
    const timer = window.setInterval(() => fire([leader]), AUTO_FIRE_MS);
    return () => window.clearInterval(timer);
  }, [leader, fire]);

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