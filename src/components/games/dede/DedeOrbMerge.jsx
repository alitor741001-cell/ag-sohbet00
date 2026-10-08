import React, { useEffect, useState } from 'react';
import DedeOrb from './DedeOrb';

// Jetonlar sırayla katılır: her biri bir öncekinden biraz sonra merkeze varır.
const FLY_STEP_MS = 85;
const SPARK_ANGLES = [0, 60, 120, 180, 240, 300];

/**
 * İnen çarpan küreleri: jetonlar hücrelerinden ekranın ortasına uçar, tek bir altın
 * çekirdekte birleşir ve karolar patlarken o çekirdek de şok dalgasıyla patlar.
 */
export default function DedeOrbMerge({ orbs, multiplier, grid, explode }) {
  const list = orbs || [];
  // Uçuş başlangıcı jetonun indiği hücre: ızgaranın gerçek ölçüsünden hesaplanır.
  const cols = grid?.length || 6;
  const rows = grid?.[0]?.length || 5;
  const [burst, setBurst] = useState(false);

  // Yeni jetonlar indi: uçuş ve birleşme baştan oynanır.
  useEffect(() => { setBurst(false); }, [orbs]);
  // Tur patlaması başladı: ortadaki çekirdek de aynı anda patlar.
  useEffect(() => { if (explode) setBurst(true); }, [explode]);

  if (!list.length) return null;

  // Çekirdek biriken toplam çarpanı gösterir: jetonlar bu değerde birleşir.
  const total = multiplier > 0 ? multiplier : list.reduce((sum, orb) => sum + orb.value, 0);
  const coreDelay = 220 + list.length * FLY_STEP_MS;

  return (
    <span className="dede-merge" aria-hidden="true">
      {list.map((orb, index) => (
        <span
          key={`${orb.reel}-${orb.row}-${orb.value}`}
          className="dede-merge-fly"
          style={{
            '--merge-x': `${((orb.reel + 0.5) / cols) * 100}%`,
            '--merge-y': `${((orb.row + 0.5) / rows) * 100}%`,
            animationDelay: `${index * FLY_STEP_MS}ms`,
          }}
        >
          <DedeOrb value={orb.value} />
        </span>
      ))}

      <span className="dede-merge-core" style={{ animationDelay: `${coreDelay}ms` }}>
        <span className={`dede-merge-core-inner ${burst ? 'dede-merge-pop' : ''}`}>
          <span className="dede-merge-ring" />
          <span className="dede-merge-value">×{total}</span>
          {SPARK_ANGLES.map((angle) => (
            <span key={angle} className="dede-merge-spark" style={{ '--merge-spark': `${angle}deg` }} />
          ))}
        </span>
      </span>
    </span>
  );
}