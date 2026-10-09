import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import ZarDie from './ZarDie';
import { sumTone } from './zarConfig';

const DICE_ORDER = [1, 2, 3];
const diceOf = (entry) => DICE_ORDER.map((no) => entry?.[`d${no}`] || 1);

/** Referans tasarımdaki "YENİ" paneli: en son atılan zarlar toplamın altında
    alt alta durur; yandaki ok önceki turların zarlarını açar. */
export default function ZarHistory({ entries, live }) {
  const [open, setOpen] = useState(false);
  const rows = Array.isArray(entries) ? entries : [];
  // Zarlar açıkken panel doğrudan onları gösterir; yoksa son sonuçlanan tur.
  const latest = live || rows[0] || null;
  const past = live ? rows : rows.slice(1);
  const revealing = !!live;

  // Zarlar açılırken geçmiş paneli kapanır: açılan zarlar görünür kalır.
  useEffect(() => {
    if (revealing) setOpen(false);
  }, [revealing]);

  return (
    <aside className="zar-history" aria-label="Son atılan zarlar">
      <p className="zar-history-head">YENİ</p>

      <div className="zar-history-frame">
        <span className="zar-history-total">{latest ? latest.sum : '—'}</span>
        <span className="zar-history-stack">
          {diceOf(latest).map((value, index) => (
            <ZarDie key={index} value={value} tone="white" size="mini" />
          ))}
        </span>
      </div>

      <button
        type="button"
        className="zar-history-more"
        onClick={() => setOpen((value) => !value)}
        aria-label="Geçmiş zarları gör"
        aria-expanded={open}
      >
        <ChevronRight className="zar-history-arrow" />
      </button>

      {open && (
        <div className="zar-history-sheet">
          <p className="zar-history-sheet-head">GEÇMİŞ</p>
          <div className="zar-history-list">
            {past.map((row) => (
              <span key={row.round_no} className={`zar-history-row zar-history-row-${sumTone(row.sum)}`}>
                <span className="zar-history-row-dice">
                  {diceOf(row).map((value, index) => (
                    <ZarDie key={index} value={value} tone="white" size="mini" />
                  ))}
                </span>
                <span className="zar-history-sum">{row.sum}</span>
              </span>
            ))}
            {!past.length && <p className="zar-history-empty">Geçmiş yok</p>}
          </div>
        </div>
      )}
    </aside>
  );
}