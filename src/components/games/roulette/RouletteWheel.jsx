import React, { useEffect, useRef, useState } from 'react';
import { POCKET_STEP, WHEEL_ORDER, pocketTone } from './rouletteConfig';
import '@/styles/roulette.css';

const CENTER = 50;
const RADIUS = 46; // cep dilimlerinin dış kenarı
const LABEL_RADIUS = 34; // sayıların oturduğu halka
const INNER = 27; // sayıların çevresindeki iç altın çember
const HUB = 14; // göbek
const CORE = 7; // turret
const TRACK = 48.6; // top yatağı

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
      {/* Madeni kasa: top yatağının dışındaki altın kaplama halka. */}
      <span aria-hidden="true" className="rl-wheel-bezel" />
      <span aria-hidden="true" className="rl-wheel-pointer" />
      <svg viewBox="0 0 100 100" className="rl-wheel-disc" style={{ transform: `rotate(${angle}deg)` }}>
        <circle cx={CENTER} cy={CENTER} r={49.4} className="rl-wheel-bowl" />
        <circle cx={CENTER} cy={CENTER} r={TRACK} className="rl-wheel-track" />

        {/* Kasanın çentikleri: her cebin sınırında ince altın çizgi. */}
        {WHEEL_ORDER.map((number, pocket) => {
          const edge = pocket * POCKET_STEP - 90;
          const [x1, y1] = polar(edge, RADIUS + 1.1);
          const [x2, y2] = polar(edge, TRACK - 0.4);
          return <line key={`tick-${number}`} x1={x1} y1={y1} x2={x2} y2={y2} className="rl-wheel-tick" />;
        })}

        {WHEEL_ORDER.map((number, pocket) => {
          const start = pocket * POCKET_STEP - 90;
          const mid = start + POCKET_STEP / 2;
          const [labelX, labelY] = polar(mid, LABEL_RADIUS);
          const [dx1, dy1] = polar(start, INNER);
          const [dx2, dy2] = polar(start, RADIUS);
          return (
            <g key={number}>
              <path d={sectorPath(start, start + POCKET_STEP)} className={`rl-pocket rl-pocket-${pocketTone(number)}`} />
              <line x1={dx1} y1={dy1} x2={dx2} y2={dy2} className="rl-wheel-divider" />
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
        <circle cx={CENTER} cy={CENTER} r={INNER} className="rl-wheel-inner" />
        <circle cx={CENTER} cy={CENTER} r={HUB} className="rl-wheel-hub" />
        <g className="rl-wheel-turret">
          <line x1={CENTER - HUB + 1.5} y1={CENTER} x2={CENTER + HUB - 1.5} y2={CENTER} />
          <line x1={CENTER} y1={CENTER - HUB + 1.5} x2={CENTER} y2={CENTER + HUB - 1.5} />
          <line x1={CENTER - 9} y1={CENTER - 9} x2={CENTER + 9} y2={CENTER + 9} />
          <line x1={CENTER - 9} y1={CENTER + 9} x2={CENTER + 9} y2={CENTER - 9} />
        </g>
        <circle cx={CENTER} cy={CENTER} r={CORE} className="rl-wheel-core" />
      </svg>
      {/* Top, çark dönerken yatakta tur atar. */}
      <span aria-hidden="true" className="rl-wheel-ball-track">
        <span className="rl-wheel-ball" />
      </span>
    </div>
  );
}