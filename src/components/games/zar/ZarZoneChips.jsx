import React from 'react';
import { chipTone, formatChipAmount } from './zarConfig';

// Alan başına gösterilen miktar sayısı: kalabalık masada blok taşmaz.
const MAX_CHIPS = 6;

/** Bahis alanına yatan tutarlar: yalnızca miktarlar görünür, profil gösterilmez.
    İlk jeton kendi bekleyen bahis, yanındakiler masadaki diğer oyuncuların tutarlarıdır. */
export default function ZarZoneChips({ own, entries }) {
  const list = (Array.isArray(entries) ? entries : []).slice(0, MAX_CHIPS);
  if (!own && !list.length) return null;

  return (
    <span className="zar-zone-chips">
      {own ? (
        <span className={`zar-mini-chip zar-mini-chip-${chipTone(own)} zar-mini-chip-self`}>
          {formatChipAmount(own)}
        </span>
      ) : null}
      {list.map((entry, index) => (
        <span
          key={`${entry.user_id}-${index}`}
          className={`zar-mini-chip zar-mini-chip-${chipTone(entry.stake)}`}
        >
          {formatChipAmount(entry.stake)}
        </span>
      ))}
    </span>
  );
}