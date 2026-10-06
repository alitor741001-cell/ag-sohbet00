import { Loader2, Music, Play } from 'lucide-react';

/** Kişiye özel şarkı listesi: dokununca şarkı odada çalar, çalan şarkı işaretlenir. */
export default function RoomTrackList({ tracks = [], currentUri, busy, onPlay }) {
  if (!tracks.length) {
    return (
      <p className="mt-3 rounded-xl bg-white/5 px-3 py-2.5 text-[11px] leading-snug text-white/45">
        Henüz şarkı yüklemedin. Telefondan bir şarkı seçtiğinde burada listelenir; hangi odaya gidersen git yalnızca sen görürsün.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-[#FFD700]">Şarkılarım ({tracks.length})</p>
      <div className="mt-1.5 space-y-1.5">
        {tracks.map((track) => {
          const active = track.file_uri === currentUri;
          return (
            <button
              key={track.id || track.file_uri}
              type="button"
              disabled={busy}
              onClick={() => onPlay(track)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left disabled:opacity-60 ${active ? 'bg-[#FFD700]/20' : 'bg-black/50'}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-[#FFD700] text-black' : 'bg-white/10 text-white'}`}>
                {active ? <Music className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{track.title || 'Şarkı'}</span>
                <span className="block truncate text-[10px] text-white/45">
                  {active ? 'Şu an odada çalıyor' : 'Dokununca odada çalar'}
                </span>
              </span>
              {busy && active && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/60" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}