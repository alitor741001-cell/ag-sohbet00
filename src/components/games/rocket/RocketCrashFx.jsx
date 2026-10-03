import React, { useEffect, useState } from 'react';
import { ROCKET_LAYOUT } from './rocketLayout';

// Sabit yönler: çakılma anında parçalar roketin etrafına dağılır.
const EMBERS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const distance = 70 + (i % 4) * 26;
  return {
    left: 46 + Math.cos(angle) * 6,
    top: 42 + Math.sin(angle) * 6,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 12,
    size: 3 + (i % 3),
    duration: 0.9 + (i % 3) * 0.25,
    delay: (i % 4) * 0.06,
  };
});

/** Çakılma anı: parlama, duman bulutu ve dağılan parçalar. */
export default function RocketCrashFx({ phase, roundNo }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (phase !== 'crashed') {
      setFlash(false);
      return undefined;
    }
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 750);
    return () => window.clearTimeout(timer);
  }, [phase, roundNo]);

  if (phase !== 'crashed') return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {flash && <div className="rocket-flash absolute" style={ROCKET_LAYOUT.crashFlash} />}
      <div className="rocket-smoke absolute" style={ROCKET_LAYOUT.crashSmoke}>
        <div className="rocket-smoke-core h-full w-full" />
      </div>
      {EMBERS.map((ember, index) => (
        <span
          key={`${roundNo}-${index}`}
          className="rocket-ember absolute rounded-full bg-amber-300"
          style={{
            left: `${ember.left}%`,
            top: `${ember.top}%`,
            width: `${ember.size}px`,
            height: `${ember.size}px`,
            '--ember-x': `${ember.x.toFixed(0)}px`,
            '--ember-y': `${ember.y.toFixed(0)}px`,
            '--ember-dur': `${ember.duration}s`,
            animationDelay: `${ember.delay}s`,
          }}
        />
      ))}
    </div>
  );
}