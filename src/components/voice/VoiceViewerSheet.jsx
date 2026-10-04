import { MicOff } from 'lucide-react';
import VoiceCard from '@/components/voice/VoiceCard';
import ProfileFrame from '@/components/ProfileFrame';

/** İzleyici listesi: odada kimler var, kim kurucu/yönetici, kim koltukta. */
export default function VoiceViewerSheet({ open, onClose, participants = [], seats = [], userId, ownerId, moderators = [], onSelect }) {
  if (!open) return null;

  return (
    <VoiceCard open={open} title={`Odadakiler (${participants.length})`} onClose={onClose}>
      {participants.length === 0
        ? <p className="py-3 text-center text-xs text-[#C6A45F]">Şu an odada kimse yok.</p>
        : (
          <div className="max-h-[52vh] space-y-1 overflow-y-auto">
            {participants.map((person) => {
              const seatIndex = seats.findIndex((item) => item.user_id === person.user_id);
              const seat = seatIndex >= 0 ? seats[seatIndex] : null;
              const isOwner = person.user_id === ownerId;
              const isMod = !isOwner && moderators.includes(person.user_id);
              return (
                <button
                  key={person.user_id}
                  type="button"
                  onClick={() => { onClose(); onSelect?.(person.user_id); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                >
                  <ProfileFrame frame={seat?.frame} avatar={person.avatar} name={person.name} size="xs" frameScale={seat?.frame_scale} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-[#F2CE6B]">
                        {person.name || 'Kullanıcı'}{person.user_id === userId ? ' (Sen)' : ''}
                      </span>
                      {isOwner && <span className="shrink-0 rounded bg-red-500/15 px-1.5 text-[9px] font-black text-[#FF8A8A]">KURUCU</span>}
                      {isMod && <span className="shrink-0 rounded bg-amber-500/15 px-1.5 text-[9px] font-black text-amber-400">YÖNETİCİ</span>}
                      {person.muted && <MicOff className="h-3.5 w-3.5 shrink-0 text-[#C6A45F]/70" />}
                    </span>
                    <span className="block truncate text-[11px] text-[#C6A45F]">
                      {seat ? `${seatIndex + 1}. koltuk` : 'İzleyici'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
    </VoiceCard>
  );
}