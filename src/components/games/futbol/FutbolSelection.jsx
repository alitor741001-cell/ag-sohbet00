import React from 'react';

/** Seçim göstergesi: geri sayım küçük yuvarlak çemberin içinde akar. */
export default function FutbolSelection({ status, clock, ratio, hasPicks, onClear }) {
  const drawing = status === 'drawing';
  const arc = Math.max(0, Math.min(1, ratio || 0)) * 360;

  return (
    <div className="fut-select">
      <span
        className={`fut-dial ${drawing ? 'fut-dial-draw' : ''}`}
        style={{ '--fut-arc': `${arc.toFixed(1)}deg` }}
      >
        <b className="fut-dial-clock">{clock}</b>
      </span>
      <span className="fut-dial-label">{drawing ? 'ÇEKİLİŞ' : 'SEÇİM ZAMANI'}</span>

      {hasPicks && !drawing && (
        <button type="button" onClick={onClear} className="fut-clear">SEÇİMLERİ TEMİZLE</button>
      )}
    </div>
  );
}