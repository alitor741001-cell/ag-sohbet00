import { Armchair, UserMinus } from 'lucide-react';
import VoiceCard from '@/components/voice/VoiceCard';
import VoiceMenuButton from '@/components/voice/VoiceMenuButton';

/** Gelen koltuk daveti: "Otur" ile koltuğa oturur, "Aya kalk" ile oturmaz. */
export default function VoiceSeatInvitePrompt({ invite, roomName, onAccept, onDecline }) {
  if (!invite) return null;

  return (
    <VoiceCard open title="Koltuk daveti" onClose={onDecline}>
      <p className="px-1 pb-2 text-center text-xs text-[#4A4A4A]">
        {invite.invited_by_name || 'Bir yetkili'} seni {roomName ? `"${roomName}"` : 'odada'} {(invite.seat_index ?? 0) + 1}. koltuğa davet etti.
      </p>
      <div className="space-y-2">
        <VoiceMenuButton icon={Armchair} label="Otur" onClick={() => onAccept(invite.seat_index)} />
        <VoiceMenuButton icon={UserMinus} label="Aya kalk" danger onClick={onDecline} />
      </div>
    </VoiceCard>
  );
}