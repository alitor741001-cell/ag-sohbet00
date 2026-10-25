import React from 'react';
import { Image } from '@/components/ui/image';

export default function RocketLaunch({ art }) {
  return <div className="rocket-celebration-frame" aria-label="Roket patladı ve havalanıyor">
    <div className="rocket-launch-flash" />
    <Image src={art.base} alt="Roket patladı!" className="rocket-celebration-art rocket-launch-base" />
    <Image src={art.rocket} alt="Havalanan roket" className="rocket-celebration-art rocket-launch-body" />
    {Array.from({ length: 16 }, (_, i) => <i key={i} className="rocket-launch-spark" aria-hidden="true" style={{ '--rocket-dx': `${Math.cos(i * Math.PI / 8) * 55}vmin`, '--rocket-dy': `${Math.sin(i * Math.PI / 8) * 55}vmin` }} />)}
  </div>;
}