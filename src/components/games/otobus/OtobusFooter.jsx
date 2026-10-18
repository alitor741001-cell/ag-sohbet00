import React from 'react';

const TABS = [
  ['all', 'Tüm Bahisler'],
  ['mine', 'Bahislerim'],
  ['general', 'Genel Sonuçlar'],
];

/** Alt şerit: tur numarası ve sonuç sekmeleri. */
export default function OtobusFooter({ roundNo, tab, onTab }) {
  return (
    <div className="ob-footer">
      <p className="ob-round">
        TUR: <b>#{roundNo || 1}</b>
      </p>
      <div className="ob-tabsrow">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className={`ob-tabbtn ${tab === id ? 'ob-tabbtn-on' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}