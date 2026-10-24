import { X } from 'lucide-react';
import VoiceViewerSection from '@/components/voice/VoiceViewerSection';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { isHiddenName } from '@/lib/hiddenUser';

/** İzleyici listesi: yöneticiler, gizli kullanıcılar ve normal izleyiciler ayrı bölümlerde gösterilir. */
export default function VoiceViewerSheet({ open, onClose, participants = [], seats = [], userId, ownerId, moderators = [], onSelect }) {
  // Gizli kullanıcının profili hiç istenmez; yalnızca görünen kişilerin rolü sorgulanır.
  const visibleIds = participants
    .filter((person) => !person.hidden && !isHiddenName(person.name) && person.user_id)
    .map((person) => person.user_id);
  const profiles = useMessageProfiles(open ? visibleIds : []);

  if (!open) return null;

  const owners = [];
  const staff = [];
  const hidden = [];
  const viewers = [];
  participants.forEach((person) => {
    const concealed = person.hidden || isHiddenName(person.name);
    const isOwner = person.user_id === ownerId;
    const isMod = !isOwner && moderators.includes(person.user_id);
    const isAdmin = profiles[person.user_id]?.role === 'admin';
    const entry = { person, isOwner, isMod, isAdmin };
    // Oda sahibi kendi bölümünde, listenin en üstünde durur — yöneticiler bölümüne girmez.
    if (isOwner) owners.push(entry);
    else if (concealed) hidden.push(entry);
    else if (isMod || isAdmin) staff.push(entry);
    else viewers.push(entry);
  });

  const pick = (id) => { onClose(); onSelect?.(id); };

  return (
    <div className="fixed inset-0 z-[250] flex flex-col justify-end">
      {/* Panel 7. koltuk hizasına kadar açılır; arkasındaki koltuklar karartılı olarak görünür kalır. */}
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet-up relative flex h-[var(--voice-dm-height)] w-full flex-col overflow-hidden rounded-t-[26px] bg-gradient-to-b from-[#2E2622] to-[#1D1815] ring-1 ring-[#D9C496]/30">
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
              <div className="space-y-2">
                <VoiceViewerSection title="Oda Sahibi" entries={owners} seats={seats} userId={userId} onSelect={pick} />
                <VoiceViewerSection title="Yöneticiler" entries={staff} seats={seats} userId={userId} onSelect={pick} />
                <VoiceViewerSection title="Gizli Kullanıcı" entries={hidden} seats={seats} userId={userId} onSelect={pick} />
                <VoiceViewerSection title="İzleyiciler" entries={viewers} seats={seats} userId={userId} onSelect={pick} />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}