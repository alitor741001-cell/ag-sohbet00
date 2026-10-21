import { X } from 'lucide-react';
import VoiceViewerRow from '@/components/voice/VoiceViewerRow';

/** İzleyici listesi: ekranın dibinden yarıya kadar yukarı kayarak açılan kart. */
export default function VoiceViewerSheet({ open, onClose, participants = [], seats = [], userId, ownerId, moderators = [], onSelect }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet-up relative flex h-[50vh] supports-[height:100dvh]:h-[50dvh] w-full flex-col overflow-hidden rounded-t-[26px] bg-gradient-to-b from-[#2E2622] to-[#1D1815] ring-1 ring-[#D9C496]/30">
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-4">
          <p className="text-sm font-bold text-[#F2CE6B]">Odadakiler ({participants.length})</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-[#D9C496] transition-colors hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
          {participants.length === 0
            ? <p className="py-3 text-center text-xs text-[#C6A45F]">Şu an odada kimse yok.</p>
            : (
              <div className="space-y-1">
                {participants.map((person) => {
                  const seatIndex = seats.findIndex((item) => item.user_id === person.user_id);
                  const seat = seatIndex >= 0 ? seats[seatIndex] : null;
                  const isOwner = person.user_id === ownerId;
                  const isMod = !isOwner && moderators.includes(person.user_id);
                  return (
                    <VoiceViewerRow key={person.user_id} person={person} seat={seat} isOwner={isOwner} isMod={isMod}
                      isSelf={person.user_id === userId} onSelect={(id) => { onClose(); onSelect?.(id); }} />
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}