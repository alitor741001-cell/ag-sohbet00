import React, { useEffect, useRef, useState } from 'react';
import { POCKET_STEP, WHEEL_ORDER, pocketTone } from './rouletteConfig';
import '@/styles/roulette.css';

const CENTER = 50;
const RADIUS = 47;
const LABEL_RADIUS = 36;

const polar = (angle, radius) => [
  CENTER + radius * Math.cos((angle * Math.PI) / 180),
  CENTER + radius * Math.sin((angle * Math.PI) / 180),
];

// Cep dilimi: merkezden iki yarıçapa uzanan pasta parçası.
function sectorPath(start, end) {
  const [x1, y1] = polar(start, RADIUS);
  const [x2, y2] = polar(end, RADIUS);
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} Z`;
}

/** Çark: 37 cep saat yönünde dizilir; tur sonucunda kazanan cep üstteki ibrenin altına gelir. */
export default function RouletteWheel({ index, spinning }) {
  const angleRef = useRef(0);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (index === null || index === undefined) return;
    // Kazanan cebin merkezi üstteki ibreye (saat 12) gelsin.
    const target = -((index + 0.5) * POCKET_STEP);
    const current = angleRef.current;
    const delta = ((target - current) % 360 + 360) % 360;
    const next = current + 360 * 5 + delta;
    angleRef.current = next;
    setAngle(next);
  }, [index]);

  return (
    <div className={`rl-wheel ${spinning ? 'rl-wheel-live' : ''}`}>
      <span aria-hidden="true" className="rl-wheel-pointer" />
      <svg viewBox="0 0 100 100" className="rl-wheel-disc" style={{ transform: `rotate(${angle}deg)` }}>
        {WHEEL_ORDER.map((number, pocket) => {
          const start = pocket * POCKET_STEP - 90;
          const end = start + POCKET_STEP;
          const mid = start + POCKET_STEP / 2;
          const [labelX, labelY] = polar(mid, LABEL_RADIUS);
          return (
            <g key={number}>
              <path d={sectorPath(start, end)} className={`rl-pocket rl-pocket-${pocketTone(number)}`} />
              <text
                className="rl-pocket-label"
                x={labelX}
                y={labelY}
                transform={`rotate(${mid + 90} ${labelX} ${labelY})`}
              >
                {number}
              </text>
            </g>
          );
        })}
        <circle cx={CENTER} cy={CENTER} r={RADIUS} className="rl-wheel-rim" />
        <circle cx={CENTER} cy={CENTER} r={19} className="rl-wheel-hub" />
        <circle cx={CENTER} cy={CENTER} r={11} className="rl-wheel-hub-core" />
      </svg>
      <span aria-hidden="true" className="rl-wheel-ball" />
    </div>
  );
}