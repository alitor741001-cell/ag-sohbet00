import React from 'react';
import '@/styles/gameCards.css';

/** Üst metrik kartları: siyah parlak zemin, çift altın çerçeve, solda altın madalyon ikon. */
export default function GameStatCards({ items }) {
  return (
    <div className="grid w-full max-w-[27rem] grid-cols-4 gap-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <span key={item.key} className={`gd-card ${item.win ? 'gd-card-win' : ''}`}>
            <span className="gd-card-head">
              {Icon && (
                <span className="gd-card-icon">
                  <Icon className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
              <span className="gd-card-label">{item.label}</span>
            </span>
            <span className={`gd-card-value ${item.muted ? 'gd-card-value-muted' : ''}`}>{item.value}</span>
          </span>
        );
      })}
    </div>
  );
}