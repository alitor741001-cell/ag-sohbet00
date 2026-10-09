import React from 'react';
import { formatCoins, ZONES } from './zarConfig';

/** Oval çuha masa: kalın ahşap çerçeve, ince yeşil çizgilerle ayrılmış üç bahis alanı.
    Her alanın üstünde masadaki bütün oyuncuların o alana koyduğu toplam durur. */
export default function ZarTable({ bets, zoneTotals, disabled, revealed, outcome, onPlace, overlay }) {
  const kaplan = ZONES[0];
  const lowers = ZONES.filter((zone) => zone.id !== 'kaplan');

  const zoneProps = (zone) => ({
    type: 'button',
    disabled,
    onClick: () => onPlace(zone.id),
    className: `zar-zone zar-zone-${zone.id}${revealed && outcome === zone.id ? ' zar-zone-hit' : ''}${bets[zone.id] ? ' zar-zone-bet' : ''}`,
  });

  return (
    <div className="zar-felt">
      <div className="zar-felt-inner">
        <span aria-hidden="true" className="zar-felt-mark">ZAR</span>

        <button {...zoneProps(kaplan)} aria-label={`${kaplan.label} alanına bahis`}>
          <span className="zar-zone-total">{formatCoins(zoneTotals[kaplan.id])}</span>
          <span className="zar-zone-mult">X{kaplan.mult}</span>
          <span className="zar-zone-label">{kaplan.label}</span>
          <span className="zar-zone-range">{kaplan.range}</span>
          {bets[kaplan.id] ? <span className="zar-zone-chip">{formatCoins(bets[kaplan.id])}</span> : null}
        </button>

        <div className="zar-zone-row">
          {lowers.map((zone) => (
            <button {...zoneProps(zone)} key={zone.id} aria-label={`${zone.label} alanına bahis`}>
              <span className="zar-zone-total">{formatCoins(zoneTotals[zone.id])}</span>
              <span className="zar-zone-mult">{zone.range} X{zone.mult}</span>
              <span className="zar-zone-label">{zone.label}</span>
              {bets[zone.id] ? <span className="zar-zone-chip">{formatCoins(bets[zone.id])}</span> : null}
            </button>
          ))}
        </div>

        {/* Masanın ortasındaki katman: zar kasesi ve sonuç şeridi. */}
        {overlay}
      </div>
    </div>
  );
}