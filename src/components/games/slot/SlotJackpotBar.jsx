import React from 'react';

const JACKPOT_IMAGE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/39d8edfa4_IMG_0119.jpg';
const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Görseldeki sabit rakamların üstüne canlı havuz değerleri yazılır (konumlar görsele göre %).
const SPOTS = [
  { key: 'xmega', x: 54.5, y: 22, w: 15, h: 13, size: '3.1cqw', tone: 'text-white' },
  { key: 'mini', x: 88, y: 22, w: 15, h: 13, size: '3.1cqw', tone: 'text-white' },
  { key: 'mega', x: 18.5, y: 79, w: 25, h: 15, size: '4.6cqw', tone: 'text-violet-100' },
  { key: 'jackpot', x: 50, y: 79, w: 27, h: 15, size: '4.6cqw', tone: 'text-yellow-300' },
  { key: 'big', x: 82.5, y: 79, w: 23, h: 15, size: '4.6cqw', tone: 'text-sky-100' },
];

/** Oyunun üst konsolu: gönderilen jackpot görseli, canlı havuz miktarlarıyla. */
export default function SlotJackpotBar({ pools, topGap = 0 }) {
  return (
    <div className="relative shrink-0 bg-neutral-950" style={{ paddingTop: `${topGap}px` }}>
      {/* Alttaki yansıma/kırık şeridi kırpılır. */}
      <div className="relative mx-auto w-full max-w-2xl overflow-hidden" style={{ aspectRatio: '1024 / 300', containerType: 'inline-size' }}>
        <img src={JACKPOT_IMAGE} alt="Jackpot" className="absolute left-0 top-0 block w-full" draggable={false} />
        {SPOTS.map(s => (
          <span key={s.key}
            className={`absolute flex items-center justify-center rounded-full bg-black font-black tabular-nums ${s.tone}`}
            style={{ left: `${s.x - s.w / 2}%`, top: `${s.y - s.h / 2}%`, width: `${s.w}%`, height: `${s.h}%`,
              fontSize: s.size, textShadow: '0 0 6px currentColor' }}>
            {format(pools?.[s.key])}
          </span>
        ))}
      </div>
    </div>
  );
}