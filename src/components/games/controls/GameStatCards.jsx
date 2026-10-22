import React from 'react';
import ReferenceArt from '@/components/games/controls/ReferenceArt';
import FitGameText from '@/components/games/controls/FitGameText';

export default function GameStatCards({ items }) {
  return (
    <div className="ref-stats">
      {items.map((item, index) => (
        <span key={item.key} className="ref-stat">
          <ReferenceArt name={`stat${index % 4}`} />
          <span className="ref-stat-copy">
            <FitGameText as="strong">{item.label}</FitGameText>
            <FitGameText as="b">{item.value}</FitGameText>
          </span>
        </span>
      ))}
    </div>
  );
}