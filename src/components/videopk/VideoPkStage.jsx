import { Loader2, UserPlus, WifiOff } from 'lucide-react';
import PkFeedTile from '@/components/voice/pk/PkFeedTile';
import PkScoreBar from '@/components/voice/pk/PkScoreBar';

/**
 * Görüntülü PK sahnesi: TikTok düzeninde tam ekran.
 * Davet kabul edilene kadar tek kamera kalır; kabul edilince iki kare yan yana açılır.
 */
export default function VideoPkStage({
  me, rival, paired, myTrack, rivalTrack, camOn, error, myScore, rivalScore,
  timerText, live, peerStatus, onOpenRival,
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {paired && live && <PkScoreBar leftScore={myScore} rightScore={rivalScore} timerText={timerText} />}

      <div className="flex min-h-0 flex-1 gap-0.5">
        <PkFeedTile
          name="Sen"
          avatar={me?.avatar}
          score={myScore}
          mine
          camOn={camOn}
          track={myTrack}
          error={error}
        />

        {paired ? (
          <PkFeedTile
            name={rival?.name || 'Rakip'}
            avatar={rival?.avatar}
            score={rivalScore}
            camOn
            track={rivalTrack}
            onOpen={onOpenRival}
          />
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-b from-[#1b0b20] to-black px-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-fuchsia-500/15 ring-1 ring-fuchsia-400/40">
              <UserPlus className="h-5 w-5 text-fuchsia-300" />
            </span>
            <p className="text-[12.5px] font-black text-white">Rakip bekleniyor</p>
            <p className="text-[10.5px] leading-relaxed text-white/55">
              PK Davet Et ile birini çağır. Davet kabul edilince iki kamera aynı anda açılır.
            </p>
            {peerStatus === 'connecting' && (
              <p className="flex items-center gap-1 text-[10px] font-semibold text-white/45">
                <Loader2 className="h-3 w-3 animate-spin" /> Bağlantı kuruluyor…
              </p>
            )}
            {peerStatus === 'disconnected' && (
              <p className="flex items-center gap-1 text-[10px] font-semibold text-amber-300">
                <WifiOff className="h-3 w-3" /> Rakibin bağlantısı kesildi
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}