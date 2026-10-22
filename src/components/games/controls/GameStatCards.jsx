import React from 'react';
import ReferenceArt from '@/components/games/controls/ReferenceArt';

export default function GameStatCards({ items }) {
  return (
    <div className="ref-stats">
      {items.map((item, index) => (
        <span key={item.key} className="ref-stat">
          <ReferenceArt name={`stat${index % 4}`} />
          <span className="ref-stat-copy">
            <strong>{item.label}</strong>
            <b>{item.value}</b>
          </span>
        </span>
      ))}
    </div>
  );
}