import React from 'react';
import { MODE_MAP } from './futbolConfig';

/** Menü: oyunun kuralları, ses düğmesi ve coin yükleme. */
export default function FutbolMenu({ open, mode, sound, onSound, onCoins, onClose }) {
  if (!open) return null;

  return (
    <div className="fut-sheet">
      <button type="button" aria-label="Menüyü kapat" className="fut-sheet-veil" onClick={onClose} />
      <div className="fut-sheet-body">
        <p className="fut-sheet-title">ALTIN GOL · NASIL OYNANIR</p>
        <ol className="fut-rules">
          <li>Bir takım kartına dokun, alttaki para butonlarıyla bahsini koy.</li>
          <li>Seçim süresi bitince kazanan takım çekilir.</li>
          <li>Kazanan karta bahis koyduysan ödemen <b>bahis x çarpan</b> olarak döner.</li>
          <li>Modlar hangi kartlara bahis koyabileceğini belirler: <b>{MODE_MAP[mode]?.hint}</b>.</li>
          <li>Kazanan her turda sekiz takım arasından çekilir.</li>
        </ol>
        <button type="button" onClick={onSound} className="fut-sheet-btn">
          {sound ? 'SESİ KAPAT' : 'SESİ AÇ'}
        </button>
        <button type="button" onClick={onCoins} className="fut-sheet-btn fut-sheet-btn-gold">COIN YÜKLE</button>
        <button type="button" onClick={onClose} className="fut-sheet-btn fut-sheet-btn-ghost">KAPAT</button>
      </div>
    </div>
  );
}