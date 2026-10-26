import React from 'react';
import '@/components/voice/roomRocket/rocketGroundFlames.css';

export default function RocketGroundFlames() {
  return <div className="rocket-ground-flames" aria-hidden="true">
    {Array.from({ length: 9 }, (_, index) => <span key={index} style={{ '--flame-index': index, '--flame-height': `${48 + (index % 3) * 19}%`, '--flame-delay': `${-index * .09}s` }} />)}
  </div>;
}