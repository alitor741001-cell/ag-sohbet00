import { ArrowLeft } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';
import VoiceMenuButton from '@/components/voice/VoiceMenuButton';

/** Mik'e davet listesi: koltukta oturmayan odadakiler tek dokunuşla davet edilir. */
export default function SeatInviteList({ people, invitedIds = [], onPick, onBack }) {
  return (
    <div className="space-y-2">
      {people.length === 0 ? (
        <p className="py-3 text-center text-xs text-[#C6A45F]">Koltukta oturmayan kimse yok.</p>
      ) : (
        <div className="max-h-[46vh] space-y-1 overflow-y-auto">
          {people.map((person) => {
            const invited = invitedIds.includes(person.user_id);
            return (
              <button
                key={person.user_id}
                type="button"
                onClick={() => onPick(person.user_id)}
                disabled={invited}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                <ProfileFrame avatar={person.avatar} name={person.name} size="xs" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#F2CE6B]">{person.name || 'Kullanıcı'}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${invited ? 'bg-white/10 text-[#C6A45F]' : 'bg-[#D9C496]/20 text-[#F2CE6B]'}`}>
                  {invited ? 'Davet edildi' : 'Davet et'}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <VoiceMenuButton icon={ArrowLeft} label="Geri" onClick={onBack} />
    </div>
  );
}