import { useEffect, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

/** Karşı tarafın kamerası: gelen görüntü doğrudan oynatılır. */
function RemoteVideo({ track }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !track) return undefined;
    ref.current.srcObject = new MediaStream([track.mediaStreamTrack]);
    ref.current.play?.().catch(() => {});
    return () => { if (ref.current) ref.current.srcObject = null; };
  }, [track]);
  return <video ref={ref} autoPlay playsInline muted className="h-full w-full object-cover" />;
}

/**
 * PK'daki kare görüntü: TikTok düzeninde iki eşit kare yan yana durur.
 * İçinde kişinin kamerası, adı, puanı ve mikrofon durumu görünür.
 */
export default function PkSquareTile({ name, avatar, score = 0, muted, mine = false, localVideoRef, track, error, accent = 'emerald' }) {
  const hasVideo = mine ? !error : !!track;
  const border = accent === 'emerald' ? 'border-emerald-400/80' : 'border-fuchsia-400/80';
  const tag = accent === 'emerald' ? 'bg-emerald-500/90' : 'bg-fuchsia-500/90';

  return (
    <div className={`relative aspect-square w-full overflow-hidden rounded-2xl border-2 bg-black ${border}`}>
      {mine ? (
        <video ref={localVideoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${hasVideo ? '' : 'opacity-0'}`} />
      ) : track ? (
        <RemoteVideo track={track} />
      ) : null}

      {!hasVideo && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-white/10 to-black/70 px-2 text-center">
          {avatar ? (
            <img src={avatar} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-white/40" />
          ) : (
            <VideoOff className="h-7 w-7 text-white/35" />
          )}
          <span className="text-[11px] font-bold text-white/85">{name}</span>
          <span className="text-[9px] text-white/50">{error || 'Kamera bekleniyor'}</span>
        </span>
      )}

      <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-black ${tag}`}>{mine ? 'SEN' : name}</span>
      {muted && (
        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-red-300">
          <MicOff className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1 pt-3 text-[11px] font-black tabular-nums text-amber-300">
        {formatCoinAmount(score)}
      </span>
    </div>
  );
}