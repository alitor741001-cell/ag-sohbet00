import VoiceViewerRow from '@/components/voice/VoiceViewerRow';

/** İzleyici listesinin tek bölümü: başlık (Yöneticiler / Gizli Kullanıcı / İzleyiciler) ve altındaki kişiler. */
export default function VoiceViewerSection({ title, entries = [], seats = [], userId, onSelect }) {
  if (!entries.length) return null;
  return (
    <div className="space-y-1">
      <p className="px-2 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#C6A45F]">{title} ({entries.length})</p>
      {entries.map(({ person, isOwner, isMod, isAdmin }) => {
        const seatIndex = seats.findIndex((item) => item.user_id === person.user_id);
        return (
          <VoiceViewerRow
            key={person.user_id}
            person={person}
            seat={seatIndex >= 0 ? seats[seatIndex] : null}
            isOwner={isOwner}
            isMod={isMod}
            isAdmin={isAdmin}
            isSelf={person.user_id === userId}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}