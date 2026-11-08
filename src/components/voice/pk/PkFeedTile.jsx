import { useEffect, useRef } from 'react';
import { Gem, MicOff, VideoOff } from 'lucide-react';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

/** Görüntü karesi: LiveKit görüntüsü öğeye bağlanır (yerel önizleme aynalı gösterilir). */
function VideoFeed({ track, mirror }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !track) return undefined;
    try { track.attach(node); } catch (attachError) { /* görüntü henüz hazır değil */ }
    node.play?.().catch(() => {});
    return () => { try { track.detach(node); } catch (detachError) { /* görüntü kapanmış */ } };
  }, [track]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className="h-full w-full object-cover"
      style={mirror ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
}

/**
 * PK yayın karesi: TikTok düzeninde iki dikey görüntü yan yana durur.
 * Kişinin kamerası, adı, mikrofon durumu ve puanı görünür.
 * Ayna yalnızca kendi ön kamera önizlemesine uygulanır; karşı tarafın görüntüsü aynalanmaz.
 */
export default function PkFeedTile({
  name, avatar, score = 0, muted, mine = false, camOn = true,
  track, error, footer, onOpen,
}) {
  const hasVideo = mine ? camOn && !!track && !error : !!track;

  return (
    <div className="relative h-full min-w-0 flex-1 overflow-hidden bg-black">
      {track && <VideoFeed track={track} mirror={mine} />}

      {!hasVideo && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-white/5 to-black/80 px-2 text-center">
          {avatar
            ? <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/40" />
            : <VideoOff className="h-8 w-8 text-white/35" />}
          <span className="text-[11px] font-bold text-white/85">{name}</span>
          <span className="text-[9px] text-white/50">{error || 'Kamera kapalı'}</span>
        </span>
      )}

      <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9.5px] font-black tabular-nums text-white ring-1 ring-white/20">
        <Gem className="h-2.5 w-2.5 text-cyan-300" /> {formatCoinAmount(score)}
      </span>

      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1.5 pt-5 text-left active:opacity-80"
      >
        {muted && <MicOff className="h-3 w-3 shrink-0 text-red-300" />}
        <span className="min-w-0 truncate text-[10.5px] font-black text-white">{name}</span>
      </button>

      {footer && <div className="absolute bottom-1 right-1 flex items-center gap-1">{footer}</div>}
    </div>
  );
}