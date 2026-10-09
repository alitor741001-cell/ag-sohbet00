import React, { useState } from 'react';
import { ChevronLeft, HelpCircle, X } from 'lucide-react';
import '@/styles/mafya.css';
import '@/styles/gameControls.css';
import GameHelpSheet from '@/components/games/help/GameHelpSheet';
import MafyaBrand from './mafya/MafyaBrand';
import MafyaLobby from './mafya/MafyaLobby';
import MafyaRoomView from './mafya/MafyaRoomView';
import useMafyaGame from './mafya/useMafyaGame';

/** ÇEYREK MAFYA: 4-8 kişilik sosyal çıkarım oyunu.
    Lobi → oda → rol dağıtımı → gece → gündüz tartışma → oylama → SON 4 → sonuç. */
export default function MafyaGame({ onExit, onBack }) {
  const game = useMafyaGame();
  const [helpOpen, setHelpOpen] = useState(false);
  const inRoom = !!game.room;

  return (
    <div className="mf-sky relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <span aria-hidden="true" className="mf-sky-glow" />

      <header className="mf-head">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="gctl-pill gctl-icon">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <MafyaBrand compact />
        <button type="button" onClick={() => setHelpOpen(true)} aria-label="Nasıl oynanır" className="gctl-pill gctl-icon">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button type="button" onClick={onExit} aria-label="Oyunu kapat" className="gctl-pill gctl-icon ring-1 ring-[#d4af37]/50">
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className={`mf-body${inRoom ? ' mf-body-fixed' : ''}`}>
        {game.room ? <MafyaRoomView game={game} /> : <MafyaLobby game={game} />}
      </main>

      {game.error ? <p className="mf-toast" role="status">{game.error}</p> : null}

      <GameHelpSheet game="mafya" open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}