import React from 'react';

export default function RocketLaunchBurst() {
  return <div className="rocket-level-burst" aria-hidden="true">
    <span className="rocket-level-flash" />
    <span className="rocket-level-shockwave" />
    {Array.from({ length: 28 }, (_, index) => {
      const angle = index * Math.PI * 2 / 28;
      const radius = index % 2 ? 42 : 30;
      return <i key={index} className="rocket-level-particle" style={{ '--burst-x': `${Math.cos(angle) * radius}vmin`, '--burst-y': `${Math.sin(angle) * radius}vmin`, '--burst-angle': `${index * 360 / 28}deg` }} />;
    })}
  </div>;
}