import React from 'react';
import { BETTING_MS } from './rocketConfig';

const PHASE_TEXT = { running: 'YÜKSELİYOR', crashed: 'ÇAKILDI' };

/** Dairesel gösterge: ortada canlı çarpan, çevresinde turun ilerleme halkası. */
export default function RocketHud({ phase, mult, countdown, progress }) {
  const crashed = phase === 'crashed';
  const betting = phase === 'betting';
  const seconds = countdown ?? 0;
  const fill = betting
    ? Math.min(1, Math.max(0, 1 - seconds / (BETTING_MS / 1000)))
    : Math.min(1, Math.max(0, progress || 0));

  return (
    <div className="rk-hud" style={{ '--rk-fill': `${(fill * 100).toFixed(1)}%` }}>
      <div className="rk-hud-core">
        <p className={`rk-mult text-[clamp(2.2rem,11vw,3rem)] leading-none ${crashed ? 'rk-mult-crash' : ''}`}>
          {betting ? seconds : (Math.round((mult || 0) * 100) / 100).toFixed(2)}
        </p>
        <p className="text-[9px] font-black tracking-[0.22em] text-white/60">
          {betting ? 'BAHİS AÇIK' : PHASE_TEXT[phase] || ''}
        </p>
      </div>
    </div>
  );
}