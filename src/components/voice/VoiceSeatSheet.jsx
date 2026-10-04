import { useState } from 'react';
import { Armchair, Lock, Mic, MicOff, Unlock, UserRound } from 'lucide-react';
import VoiceCard from '@/components/voice/VoiceCard';
import VoiceMenuButton from '@/components/voice/VoiceMenuButton';
import SeatInviteList from '@/components/voice/SeatInviteList';

/** Boş koltuk menüsü: oturma, koltuk kilidi ve mik'e davet. */
export default function VoiceSeatSheet({ open, onClose, seat, index, canMod, myId, micActive = false, viewers = [], invitedIds = [], onTakeSeat, onToggleLock, onStepDown, onInviteToSeat, onMuteMic }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  if (!seat) return null;
  const isMine = !!seat.user_id && seat.user_id === myId;
  // Başkasının koltuğu profil kartından yönetilir: burada yalnızca boş ve kendi koltuğu açılır.
  if (seat.user_id && !isMine) return null;
  const locked = !!seat.locked;
  // Kart kapanınca davet listesi de kapanır; sonraki açılışta menüden başlar.
  const close = () => { setInviteOpen(false); onClose(); };

  // Kendi koltuğum: oda sahibi ve herkes tek dokunuşla koltuktan inebilir.
  if (isMine) {
    return (
      <VoiceCard open={open} title={`${(index || 0) + 1}. Koltuk`} onClose={close}>
        <div className="space-y-2">
          <VoiceMenuButton icon={Armchair} label="Koltuktan in" onClick={() => { close(); onStepDown(); }} />
        </div>
      </VoiceCard>
    );
  }

  // Mik'e davet: koltukta oturmayan izleyiciler listelenir, dokunulan kişiye davet gider.
  if (inviteOpen) {
    return (
      <VoiceCard open={open} title={`${(index || 0) + 1}. Koltuk · Mik'e davet`} onClose={close}>
        <SeatInviteList
          people={viewers}
          invitedIds={invitedIds}
          onPick={(targetId) => onInviteToSeat(targetId, index)}
          onBack={() => setInviteOpen(false)}
        />
      </VoiceCard>
    );
  }

  return (
    <VoiceCard open={open} title={`${(index || 0) + 1}. Koltuk`} onClose={close}>
      <div className="space-y-2">
        <VoiceMenuButton
          icon={UserRound}
          label={locked && !canMod ? 'Kilitli koltuk' : 'Otur'}
          disabled={locked && !canMod}
          onClick={() => { close(); onTakeSeat(); }}
        />
        {/* Koltuk boş olsa da kişi kendi mikrofonunu kapatabilir. */}
        <VoiceMenuButton
          icon={MicOff}
          label={micActive ? 'Mikrofonu kapat' : 'Mikrofon zaten kapalı'}
          disabled={!micActive}
          onClick={() => { close(); onMuteMic(); }}
        />
        {canMod && (
          <VoiceMenuButton
            icon={locked ? Unlock : Lock}
            label={locked ? 'Kilidi aç' : 'Kilitle'}
            onClick={() => { close(); onToggleLock(); }}
          />
        )}
        {canMod && (
          <VoiceMenuButton icon={Mic} label="Mik'e davet et" onClick={() => setInviteOpen(true)} />
        )}
      </div>
    </VoiceCard>
  );
}