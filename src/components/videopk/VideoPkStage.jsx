import { Loader2, UserPlus, WifiOff } from 'lucide-react';
import PkFeedTile from '@/components/voice/pk/PkFeedTile';
import PkScoreBar from '@/components/voice/pk/PkScoreBar';

/**
 * Görüntülü PK sahnesi: iki kamera yan yana, kareye yakın çerçevelerde durur.
 * Davet kabul edilene kadar tek kamera kalır; kabul edilince iki kare yan yana açılır.
 */
export default function VideoPkStage({
  me, rival, paired, myTrack, rivalTrack, camOn, error, myScore, rivalScore,
  timerText, live, peerStatus, onOpenRival,
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {paired && live && <PkScoreBar leftScore={myScore} rightScore={rivalScore} timerText={timerText} />}

      {/* Kareler ekranı boydan boya kaplamaz: kareye yakın çerçeveler ortada durur. */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-1 pb-1">
        <div className="flex h-full max-h-[46vh] w-full gap-1">
          <div className="relative w-1/2 overflow-hidden rounded-2xl">
            <PkFeedTile
              name="Sen"
              avatar={me?.avatar}
              score={myScore}
              mine
              camOn={camOn}
              track={myTrack}
              error={error}
            />
          </div>

          {paired ? (
            <div className="relative w-1/2 overflow-hidden rounded-2xl">
              <PkFeedTile
                name={rival?.name || 'Rakip'}
                avatar={rival?.avatar}
                score={rivalScore}
                camOn
                track={rivalTrack}
                onOpen={onOpenRival}
              />
            </div>
          ) : (
            <div className="relative flex w-1/2 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-b from-[#1b0b20] to-black px-3 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fuchsia-500/15 ring-1 ring-fuchsia-400/40">
                <UserPlus className="h-5 w-5 text-fuchsia-300" />
              </span>
              <p className="text-[12px] font-black text-white">Rakip bekleniyor</p>
              <p className="text-[10px] leading-relaxed text-white/55">
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
    </div>
  );
}