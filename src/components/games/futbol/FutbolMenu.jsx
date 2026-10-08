import React from 'react';
import HelpSymbolGrid from '@/components/games/help/HelpSymbolGrid';
import { helpFor } from '@/components/games/help/gameHelpContent';

/** Menü: oyunun kuralları, takım kartları, ses düğmesi ve coin yükleme. */
export default function FutbolMenu({ open, sound, onSound, onCoins, onClose }) {
  if (!open) return null;
  const help = helpFor('futbol');

  return (
    <div className="fut-sheet">
      <button type="button" aria-label="Menüyü kapat" className="fut-sheet-veil" onClick={onClose} />
      <div className="fut-sheet-body">
        <p className="fut-sheet-title">ALTIN GOL · NASIL OYNANIR</p>
        <ol className="fut-rules">
          <li>Bir takım kartına dokun, alttaki para butonlarıyla bahsini koy.</li>
          <li>Seçim süresi bitince kare ortadan çıkar ve kartların üstünde dönerek kazananı seçer.</li>
          <li>Kazanan karta bahis koyduysan ödemen <b>bahis x çarpan</b> olarak döner.</li>
          <li>Kazanan her turda sekiz takım arasından çekilir.</li>
        </ol>

        {help?.legend && (
          <>
            <p className="gh-section">TAKIM KARTLARI VE ÇARPANLAR</p>
            <HelpSymbolGrid legend={help.legend} />
          </>
        )}

        <button type="button" onClick={onSound} className="fut-sheet-btn">
          {sound ? 'SESİ KAPAT' : 'SESİ AÇ'}
        </button>
        <button type="button" onClick={onCoins} className="fut-sheet-btn fut-sheet-btn-gold">COIN YÜKLE</button>
        <button type="button" onClick={onClose} className="fut-sheet-btn fut-sheet-btn-ghost">KAPAT</button>
      </div>
    </div>
  );
}