import React from 'react';
import { chipTone, formatChipAmount } from './zarConfig';

// Alan başına gösterilen jeton sayısı: kalabalık masada blok taşmaz.
const MAX_CHIPS = 4;

const initial = (name) => (name ? name.trim().charAt(0).toUpperCase() : '·');

/** Bahis alanına konan jetonlar: üstlerinde tutar yazar; ilk jeton kendi
    bekleyen bahistir, yanındakiler masada o alana yatıran oyunculardır. */
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
          title={entry.user_name || ''}
          className={`zar-mini-chip zar-mini-chip-${chipTone(entry.stake)}`}
        >
          <i aria-hidden="true">{initial(entry.user_name)}</i>
          {formatChipAmount(entry.stake)}
        </span>
      ))}
    </span>
  );
}