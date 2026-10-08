import React from 'react';
import '@/styles/gameCards.css';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Panelin üst şeridindeki okuma kartı: siyah parlak zemin, çift altın çerçeve. */
export default function SlotDeckStat({ label, value, tone = 'default', icon: Icon }) {
  return (
    <span className={`gd-card ${tone === 'win' ? 'gd-card-win' : ''}`}>
      <span className="gd-card-head">
        {Icon && (
          <span className="gd-card-icon">
            <Icon className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        )}
        <span className="gd-card-label">{label}</span>
      </span>
      <span className={`gd-card-value ${tone === 'muted' ? 'gd-card-value-muted' : ''}`}>{format(value)}</span>
    </span>
  );
}