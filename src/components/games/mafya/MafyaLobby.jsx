import React, { useState } from 'react';
import { Play, Plus, RefreshCw } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { MAFYA_HERO } from './mafyaAssets';
import MafyaCreateSheet from './MafyaCreateSheet';
import MafyaIntro from './MafyaIntro';
import MafyaRoomList from './MafyaRoomList';

/** Lobi: sinematik masa görseli, hızlı oyun, oda kurma ve açık odalar listesi. */
export default function MafyaLobby({ game }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { rooms, myRoomId, status, busy, act } = game;

  const join = (room) => {
    let password = '';
    if (room.has_password) {
      password = window.prompt('Oda şifresi') || '';
      if (!password) return;
    }
    act({ action: 'join', room_id: room.id, password });
  };

  return (
    <>
      <div className="mf-hero">
        <Image src={MAFYA_HERO} alt="" className="h-full w-full" fittingType="fill" quality={80} />
        <span className="mf-hero-veil" />
        <span className="mf-hero-text">
          <span className="mf-hero-tag">KİM DOST KİM DÜŞMAN? ÇEYREKTE BELLİ OLUR!</span>
        </span>
      </div>

      <div className="mf-actions">
        <button type="button" className="mf-btn mf-btn-gold" disabled={busy} onClick={() => act({ action: 'quick' })}>
          <Play className="h-4 w-4" /> HIZLI OYNA
        </button>
        <button type="button" className="mf-btn" disabled={busy} onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> ODA KUR
        </button>
      </div>

      <div className="mf-section">
        <p className="mf-section-title">AÇIK ODALAR</p>
        <span className="mf-section-line" />
        <button type="button" aria-label="Odaları tazele" onClick={() => act({ action: 'lobby' })} className="text-[#ffd700]">
          <RefreshCw className={`h-3.5 w-3.5${status === 'loading' ? ' animate-spin' : ''}`} />
        </button>
      </div>
      <MafyaRoomList
        rooms={rooms}
        myRoomId={myRoomId}
        busy={busy}
        onJoin={join}
        onReturn={(roomId) => act({ action: 'sync', room_id: roomId })}
      />

      <MafyaIntro />

      <MafyaCreateSheet
        open={createOpen}
        busy={busy}
        onClose={() => setCreateOpen(false)}
        onCreate={(form) => {
          setCreateOpen(false);
          act({ action: 'create', ...form });
        }}
      />
    </>
  );
}