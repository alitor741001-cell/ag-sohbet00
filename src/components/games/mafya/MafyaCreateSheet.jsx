import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MAFYA_MAX_PLAYERS, MAFYA_MIN_PLAYERS } from './mafyaConfig';

/** Oda kurma formu: oda adı, isteğe bağlı şifre ve oyuncu sayısı. */
export default function MafyaCreateSheet({ open, busy, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [capacity, setCapacity] = useState(MAFYA_MAX_PLAYERS);

  if (!open) return null;

  return (
    <div className="mf-overlay">
      <div className="mf-modal">
        <button type="button" onClick={onClose} aria-label="Kapat" className="absolute right-3 top-3 text-white/60">
          <X className="h-4 w-4" />
        </button>
        <p className="mf-modal-title">ODA KUR</p>
        <label className="mf-panel-text">
          Oda adı
          <input
            className="mf-input mt-1 w-full"
            value={name}
            maxLength={24}
            placeholder="Mafya Gecesi"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="mf-panel-text">
          Şifre (isteğe bağlı)
          <input
            className="mf-input mt-1 w-full"
            value={password}
            maxLength={12}
            placeholder="Boş bırakılırsa açık oda"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div>
          <p className="mf-panel-text">Oyuncu sayısı: {capacity}</p>
          <input
            type="range"
            min={MAFYA_MIN_PLAYERS}
            max={MAFYA_MAX_PLAYERS}
            value={capacity}
            className="w-full accent-[#d4af37]"
            onChange={(event) => setCapacity(Number(event.target.value))}
          />
        </div>
        <button type="button" className="mf-btn mf-btn-gold" disabled={busy} onClick={() => onCreate({ name, password, capacity })}>
          ODAYI AÇ
        </button>
        <p className="mf-panel-text text-center">
          Oda dolduğunda ya da sen başlatınca oyun başlar. Roller gizli dağıtılır.
        </p>
      </div>
    </div>
  );
}