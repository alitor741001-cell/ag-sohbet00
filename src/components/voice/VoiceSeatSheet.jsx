import { Lock, Unlock, UserRound } from 'lucide-react';
import VoiceCard from '@/components/voice/VoiceCard';
import VoiceMenuButton from '@/components/voice/VoiceMenuButton';

/** Boş koltuk menüsü: oturma ve koltuk kilidi. */
export default function VoiceSeatSheet({ open, onClose, seat, index, canMod, onTakeSeat, onToggleLock }) {
  if (!seat || seat.user_id) return null;
  const locked = !!seat.locked;
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