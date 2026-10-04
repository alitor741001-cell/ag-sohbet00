import { Armchair, Lock, Unlock, UserRound } from 'lucide-react';
import VoiceCard from '@/components/voice/VoiceCard';
import VoiceMenuButton from '@/components/voice/VoiceMenuButton';

/** Boş koltuk menüsü: oturma ve koltuk kilidi. */
export default function VoiceSeatSheet({ open, onClose, seat, index, canMod, myId, onTakeSeat, onToggleLock, onStepDown }) {
  if (!seat) return null;
  const isMine = !!seat.user_id && seat.user_id === myId;
  // Başkasının koltuğu profil kartından yönetilir: burada yalnızca boş ve kendi koltuğu açılır.
  if (seat.user_id && !isMine) return null;
  const locked = !!seat.locked;

  // Kendi koltuğum: oda sahibi ve herkes tek dokunuşla koltuktan inebilir.
  if (isMine) {
    return (
      <VoiceCard open={open} title={`${(index || 0) + 1}. Koltuk`} onClose={onClose}>
        <div className="space-y-2">
          <VoiceMenuButton icon={Armchair} label="Koltuktan in" onClick={() => { onClose(); onStepDown(); }} />
        </div>
      </VoiceCard>
    );
  }

  return (
    <VoiceCard open={open} title={`${(index || 0) + 1}. Koltuk`} onClose={onClose}>
      <div className="space-y-2">
        <VoiceMenuButton
          icon={UserRound}
          label={locked && !canMod ? 'Kilitli koltuk' : 'Otur'}
          disabled={locked && !canMod}
          onClick={() => { onClose(); onTakeSeat(); }}
        />
        {canMod && (
          <VoiceMenuButton
            icon={locked ? Unlock : Lock}
            label={locked ? 'Kilidi aç' : 'Kilitle'}
            onClick={() => { onClose(); onToggleLock(); }}
          />
        )}
      </div>
    </VoiceCard>
  );
}