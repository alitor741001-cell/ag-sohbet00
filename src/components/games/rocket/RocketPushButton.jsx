import React from 'react';

// Aksiyonun rengine göre düğme gövdesi.
const TONES = {
  cyan: 'rk-push-cyan',
  gold: 'rk-push-gold',
  green: 'rk-push-green',
  red: 'rk-push-red',
  mute: 'rk-push-mute',
};

/**
 * Fırlatma konsolunun gerçek düğmesi: metal yuva içinde kubbeli gövde,
 * üstte ışık şeridi, ortada etiket ve kazanç çarpanı rozeti.
 */
export default function RocketPushButton({ tone = 'cyan', label, badge, sub, disabled, pulse, onClick, ariaLabel }) {
  return (
    <span className="rk-push-bezel">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel || label}
        className={`rk-push ${TONES[tone] || TONES.cyan} ${pulse ? 'rk-push-pulse' : ''}`}
      >
        <span aria-hidden="true" className="rk-push-dome" />
        <span aria-hidden="true" className="rk-push-light" />
        <span className="rk-push-label">
          {label}
          {badge && <span className="rk-push-badge">{badge}</span>}
        </span>
        {sub && <span className="rk-push-sub">{sub}</span>}
      </button>
    </span>
  );
}