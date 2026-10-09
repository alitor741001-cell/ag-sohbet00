import React from 'react';
import { formatCoins, ZONES } from './zarConfig';
import ZarZoneChips from './ZarZoneChips';

/** Oval çuha masa: kalın ahşap çerçeve, ince yeşil çizgilerle ayrılmış üç bahis alanı.
    Her alanın üstünde masadaki bütün oyuncuların o alana koyduğu toplam durur;
    altında o alana jeton yatıran oyuncuların tutarları görünür. */
export default function ZarTable({ bets, zoneTotals, chips, disabled, revealed, outcome, onPlace, overlay }) {
  const kaplan = ZONES[0];
  const lowers = ZONES.filter((zone) => zone.id !== 'kaplan');

  // Kendi bekleyen bahsi ve masaya konan jetonlar alanın altında listelenir.
  const chipRow = (zone) => <ZarZoneChips own={bets[zone.id]} entries={chips?.[zone.id]} />;

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
          {chipRow(kaplan)}
        </button>

        <div className="zar-zone-row">
          {lowers.map((zone) => (
            <button {...zoneProps(zone)} key={zone.id} aria-label={`${zone.label} alanına bahis`}>
              <span className="zar-zone-total">{formatCoins(zoneTotals[zone.id])}</span>
              <span className="zar-zone-mult">{zone.range} X{zone.mult}</span>
              <span className="zar-zone-label">{zone.label}</span>
              {chipRow(zone)}
            </button>
          ))}
        </div>

        {/* Kase, Küçük ve Büyük alanlarının altında durur; masa bu alandan
            aşağıya, TOP1-TOP4 şeridine kadar uzanır. */}
        <div className="zar-felt-court">{overlay}</div>
      </div>
    </div>
  );
}