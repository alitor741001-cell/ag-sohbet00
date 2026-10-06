import RoomTrackRow from '@/components/voice/RoomTrackRow';

/** Kişiye özel şarkı listesi: dokununca şarkı odada çalar, sola kaydırınca Sil ile listeden çıkar. */
export default function RoomTrackList({ tracks = [], currentUri, busy, onPlay, onDelete }) {
  if (!tracks.length) {
    return (
      <p className="mt-3 rounded-xl bg-white/5 px-3 py-2.5 text-[11px] leading-snug text-white/45">
        Henüz şarkı yüklemedin. Telefondan bir şarkı seçtiğinde burada listelenir; hangi odaya gidersen git yalnızca sen görürsün.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#FFD700]">Şarkılarım ({tracks.length})</p>
        <p className="text-[10px] text-white/40">Sola kaydır: sil</p>
      </div>
      <div className="mt-1.5 space-y-1.5">
        {tracks.map((track) => (
          <RoomTrackRow
            key={track.id || track.file_uri}
            track={track}
            active={track.file_uri === currentUri}
            busy={busy}
            onPlay={onPlay}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}