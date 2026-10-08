import React from 'react';

/** Bedava çevrim başlangıcı: bonus duyurusu ve tur sayısı. */
export default function SekerliFreeSpinIntro({ open, count, onStart }) {
  if (!open) return null;

  return (
    <div className="sl-overlay sl-overlay-free" role="dialog" aria-modal="true">
      <span className="sl-overlay-rays" aria-hidden="true" />
      <div className="sl-free-card">
        <p className="sl-free-kicker">YILDIZ BONUS</p>
        <p className="sl-free-title">BEDAVA ÇEVRİM</p>
        <p className="sl-free-count" key={count}>+{count}</p>
        <p className="sl-free-note">Bahis düşmeden çevirirsin</p>
        <button type="button" onClick={onStart} className="sl-overlay-btn sl-free-btn">BAŞLA</button>
      </div>
    </div>
  );
}