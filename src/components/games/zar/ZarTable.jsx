import React from 'react';
import { formatCoins, ZONES } from './zarConfig';
import ZarCatChip from './ZarCatChip';

const MAX_CHIPS = 10;
// Jetonlar alan içinde sabit ama dağınık noktalara düşer (her render'da aynı yer).
const spot = (i) => ({
  left: `${14 + ((i * 37) % 62)}%`,
  top: `${22 + ((i * 23) % 44)}%`,
  transform: `rotate(${((i * 47) % 40) - 20}deg) scale(0.62)`,
});

/** Yeşil çuha: üstte Kaplan, altta Küçük / Büyük. Üst sarı sayı masanın toplamı, alt sayı kendi bahsin. */
export default function ZarTable({ bets, zoneTotals, chips, disabled, revealed, outcome, onPlace }) {
  const zone = (z, extra) => {
    const list = [...(bets[z.id] ? [{ stake: bets[z.id] }] : []), ...(chips?.[z.id] || [])].slice(0, MAX_CHIPS);
    return (
      <button
        key={z.id}
        type="button"
        disabled={disabled}
        onClick={() => onPlace(z.id)}
        aria-label={`${z.label} alanına bahis`}
        className={`zr2-zone zr2-zone-${z.id}${revealed && outcome === z.id ? ' zr2-zone-hit' : ''}`}
      >
        <span className="zr2-zone-total">{formatCoins(zoneTotals[z.id])}</span>
        {extra}
        <span className="zr2-zone-label">{z.id === 'kaplan' ? 'Kaplan' : z.id === 'kucuk' ? 'Küçük' : 'Büyük'}</span>
        {list.map((c, i) => (
          <ZarCatChip key={i} value={c.stake} style={{ position: 'absolute', ...spot(i) }} />
        ))}
        <span className="zr2-zone-own">{formatCoins(bets[z.id])}</span>
      </button>
    );
  };

  return (
    <div className="zr2-zones">
      {zone(ZONES[0], <span className="zr2-zone-range">3 · 18 X{ZONES[0].mult}</span>)}
      <div className="zr2-zone-row">
        {ZONES.slice(1).map((z) => zone(z, <span className="zr2-zone-range">{z.range}  X{z.mult}</span>))}
      </div>
    </div>
  );
}