import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { LUCKY_OLYMPUS_SCREEN } from './luckyOlympusAssets';
import { REEL_BOX, HEADER_HEIGHT, PANEL_TOP, SCREEN_HEIGHT, SCREEN_WIDTH } from './lucky/luckyLayout';
import { PAYS, SYMBOL_LABELS, SYMBOL_TILES, formatCoins } from './lucky/luckyConfig';
import { isSoundEnabled, setSoundEnabled } from './lucky/luckySound';
import useLuckyGame from './lucky/useLuckyGame';
import LuckyControls from './lucky/LuckyControls';
import LuckyHeader from './lucky/LuckyHeader';
import LuckyInfoSheet from './lucky/LuckyInfoSheet';
import LuckyReels from './lucky/LuckyReels';
import '@/styles/lucky.css';

const PAY_ROWS = ['crown', 'cup', 'ring', 'star', 'gold', 'purple', 'blue', 'green', 'hourglass'];

/** Lucky Olympus: tanıtım görselinin üzerine oturan çalışan slot ekranı. */
export default function LuckyOlympusGame({ onBack, onExit }) {
  const boxRef = useRef(null);
  const size = useSize(boxRef);
  const game = useLuckyGame();
  const [sound, setSound] = useState(isSoundEnabled());

  // Görsel paneli kaplayacak şekilde ölçeklenir; canlı katmanlar bu orana oturur.
  const frame = useMemo(() => {
    const width = size?.width || 0;
    const height = size?.height || 0;
    if (!width || !height) return null;
    const scale = Math.max(width / SCREEN_WIDTH, height / SCREEN_HEIGHT);
    const w = SCREEN_WIDTH * scale;
    const h = SCREEN_HEIGHT * scale;
    return { width: w, height: h, left: (width - w) / 2, top: (height - h) / 2 };
  }, [size]);

  const merged = (game.result?.collected || []).filter((item) => item.merged > 0);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
  };

  const loading = game.status === 'loading' || game.status === 'error';

  return (
    <div ref={boxRef} className="relative h-full w-full overflow-hidden bg-slot">
      {loading && (
        <>
          <button
            type="button"
            onClick={onBack}
            aria-label="Oyun merkezine dön"
            className="absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex h-full w-full items-center justify-center">
            {game.status === 'loading' ? (
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-slot-border border-t-slot-gold" />
            ) : (
              <p className="px-6 text-center text-sm font-bold text-slot-gold">Oyun yüklenemedi. Tekrar dene.</p>
            )}
          </div>
        </>
      )}

      {!loading && frame && (
        <div className="absolute" style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}>
          <Image
            src={LUCKY_OLYMPUS_SCREEN}
            alt="Lucky Olympus"
            fittingType="fill"
            quality={92}
            className="absolute inset-0 h-full w-full"
          />

          {/* Canlı makara alanı: görseldeki 5x4 ızgaranın tam üzerinde durur. */}
          <div
            className="absolute"
            style={{
              left: `${REEL_BOX.left}%`,
              top: `${REEL_BOX.top}%`,
              width: `${REEL_BOX.width}%`,
              height: `${REEL_BOX.height}%`,
            }}
          >
            <LuckyReels
              grid={game.grid}
              multiValues={game.multiValues}
              spinning={game.spinning}
              spinId={game.spinId}
            />
            {game.result?.freeSpinsAwarded > 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="lucky-merging rounded-2xl border border-slot-gold bg-slot-panel px-5 py-3 text-center">
                  <p className="text-xs font-black tracking-widest text-slot-gold">ÜCRETSİZ DÖNÜŞ</p>
                  <p className="text-2xl font-black text-white">{game.result.freeSpinsAwarded}</p>
                </div>
              </div>
            )}
          </div>

          {/* Üst şerit: bakiye, ücretsiz dönüş sayacı ve üst simgeler. */}
          <div
            className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/85 via-black/50 to-transparent"
            style={{ height: `${HEADER_HEIGHT}%` }}
          >
            <LuckyHeader coins={game.coins} freeSpins={game.freeSpins} onOpen={game.setSheet} />
          </div>

          {/* Alt kontrol paneli: görseldeki butonların yerini alır. */}
          <div className="absolute bottom-0 left-0 right-0 bg-slot/95 backdrop-blur-sm" style={{ top: `${PANEL_TOP}%` }}>
            <LuckyControls
              bet={game.bet}
              coins={game.coins}
              buyCost={game.buyCost}
              spinning={game.spinning}
              auto={game.auto}
              busy={game.busy}
              banner={game.banner}
              multipliers={game.multipliers}
              merged={merged}
              onSpin={game.runSpin}
              onBuy={game.buyFreeSpins}
              onShiftBet={game.shiftBet}
              onMax={game.maxBet}
              onToggleAuto={game.toggleAuto}
            />
          </div>

          {/* Oyun merkezine dönüş: görselin sol üst köşesindeki alanı kullanır. */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Oyun merkezine dön"
            className="absolute left-1 top-[9%] flex h-8 w-8 items-center justify-center rounded-full border border-slot-gold/40 bg-black/70 text-slot-gold"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      <LuckyInfoSheet
        open={game.sheet === 'help'}
        title="Nasıl Oynanır"
        onClose={() => game.setSheet(null)}
      >
        <div className="space-y-2 text-[0.72rem] font-semibold leading-snug text-slot-text/90">
          <p>• 20 satır, 5 makara x 4 satır. Kazanç satır başına soldan sağa 3, 4 veya 5 eşleşmedir.</p>
          <p>• 4 veya daha fazla SCATTER (Zeus) gelirse {game.result?.freeSpinsAwarded ? '' : '15 '}ücretsiz dönüş başlar ve kendiliğinden oynar.</p>
          <p>• Çarpan sembolleri (x2 - x25) yalnız ücretsiz dönüşlerde birikir; aynı çarpan tekrar gelince birleşir ve (birleşik çarpan x toplam bahis / 10) coin eklenir.</p>
        </div>
        <div className="mt-3 space-y-1.5">
          {PAY_ROWS.map((id) => (
            <div key={id} className="flex items-center gap-2">
              <Image src={SYMBOL_TILES[id]} alt="" fittingType="fill" className="h-8 w-8 shrink-0 rounded" />
              <span className="min-w-0 flex-1 truncate text-[0.68rem] font-bold text-slot-text/85">{SYMBOL_LABELS[id]}</span>
              <span className="shrink-0 text-[0.66rem] font-black text-slot-gold">
                {PAYS[id].map((value) => `${Math.round((value / 20) * 10) / 10}x`).join(' • ')}
              </span>
            </div>
          ))}
        </div>
      </LuckyInfoSheet>

      <LuckyInfoSheet open={game.sheet === 'menu'} title="Menü" onClose={() => game.setSheet(null)}>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              game.setSheet(null);
              onBack?.();
            }}
            className="slot-panel-3d w-full rounded-xl border border-slot-gold/50 px-3 py-3 text-left text-sm font-black text-slot-gold"
          >
            Oyun Merkezine Dön
          </button>
          <button
            type="button"
            onClick={() => {
              game.setSheet(null);
              onExit?.();
            }}
            className="slot-panel-3d w-full rounded-xl border border-slot-gold/50 px-3 py-3 text-left text-sm font-black text-slot-gold"
          >
            Paneli Kapat
          </button>
        </div>
      </LuckyInfoSheet>

      <LuckyInfoSheet open={game.sheet === 'settings'} title="Ayarlar" onClose={() => game.setSheet(null)}>
        <button
          type="button"
          onClick={toggleSound}
          className="slot-panel-3d flex w-full items-center justify-between rounded-xl border border-slot-gold/50 px-3 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-black text-slot-gold">
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Oyun sesi
          </span>
          <span className="text-xs font-black text-white">{sound ? 'Açık' : 'Kapalı'}</span>
        </button>
        <p className="mt-3 text-[0.68rem] font-semibold text-slot-text/70">
          Bakiye: {formatCoins(game.coins)} coin • Toplam bahis: {formatCoins(game.bet)}
        </p>
      </LuckyInfoSheet>
    </div>
  );
}