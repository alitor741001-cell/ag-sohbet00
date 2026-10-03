import React from 'react';
import { ROCKET_LAYOUT } from './rocketLayout';

// Sabit dizilim: her karede yeniden üretilmez, kayma hızı sabit kalır.
const STREAKS = Array.from({ length: 14 }, (_, i) => ({
  left: 8 + ((i * 37) % 88),
  top: -12 + ((i * 53) % 112),
  delay: (((i * 7) % 10) / 10) * 1.1,
  duration: 0.7 + ((i * 3) % 5) * 0.12,
  length: 44 + ((i * 11) % 44),
}));

/** Uçuş sırasında hız çizgileri ve motor parlaması: mekiğin hızlandığını hissettirir. */
export default function RocketFlightFx({ phase, progress }) {
  if (phase !== 'running') return null;
  const boost = Math.min(1, progress * 1.15);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ opacity: boost * 0.7 }}>
        {STREAKS.map((streak, index) => (
          <span
            key={index}
            className="rocket-streak"
            style={{
              left: `${streak.left}%`,
              top: `${streak.top}%`,
              height: `${streak.length}px`,
              animationDelay: `${streak.delay}s`,
              animationDuration: `${streak.duration}s`,
            }}
          />
        ))}
      </div>
      <div
        className="rocket-engine-glow absolute"
        style={{ ...ROCKET_LAYOUT.engineGlow, opacity: 0.3 + boost * 0.6 }}
      />
    </div>
  );
}