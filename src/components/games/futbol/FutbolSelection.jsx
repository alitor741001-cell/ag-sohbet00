import React from 'react';

/** "Seçim Zamanı" şeridi: geri sayım, kalan süre çubuğu ve seçimleri temizleme. */
export default function FutbolSelection({ status, clock, ratio, hasPicks, onClear }) {
  const drawing = status === 'drawing';

  return (
    <div className="fut-select">
      <span className={`fut-select-pill ${drawing ? 'fut-select-draw' : ''}`}>
        {drawing ? 'ÇEKİLİŞ' : 'SEÇİM ZAMANI'}
        <b className="fut-select-clock">{clock}</b>
      </span>

      <span className="fut-progress" aria-hidden="true">
        <span
          className={`fut-progress-fill ${drawing ? 'fut-progress-fill-draw' : ''}`}
          style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />
      </span>

      {hasPicks && !drawing && (
        <button type="button" onClick={onClear} className="fut-clear">SEÇİMLERİ TEMİZLE</button>
      )}
    </div>
  );
}