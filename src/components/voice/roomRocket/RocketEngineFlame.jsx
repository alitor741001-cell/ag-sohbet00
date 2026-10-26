import React from 'react';
import '@/components/voice/roomRocket/rocketEngineFlame.css';

export default function RocketEngineFlame() {
  return <div className="rocket-engine-system" aria-hidden="true">
    <div className="rocket-level-exhaust">
      <span className="rocket-engine-halo" />
      <span className="rocket-engine-fire" />
      <span className="rocket-engine-core" />
      {Array.from({ length: 12 }, (_, index) => <i key={index} className="rocket-engine-ember" style={{ '--ember-x': `${(index % 5 - 2) * 28}%`, '--ember-delay': `${-index * .13}s`, '--ember-speed': `${.5 + index % 4 * .12}s` }} />)}
    </div>
    <span className="rocket-engine-booster rocket-engine-booster-left" />
    <span className="rocket-engine-booster rocket-engine-booster-right" />
  </div>;
}