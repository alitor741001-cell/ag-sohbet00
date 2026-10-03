import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSize } from '@/hooks/use-size';
import { LUCKY_OLYMPUS_SCREEN } from './luckyOlympusAssets';
import { REEL_BOX, SCREEN_HEIGHT, SCREEN_WIDTH, boxStyle } from './lucky/luckyLayout';
import { PAYS, SYMBOL_LABELS, SYMBOL_TILES, formatCoins } from './lucky/luckyConfig';
import { isSoundEnabled, setSoundEnabled } from './lucky/luckySound';
import useLuckyGame from './lucky/useLuckyGame';
import LuckyInfoSheet from './lucky/LuckyInfoSheet';
import LuckyPanel from './lucky/LuckyPanel';
import LuckyReels from './lucky/LuckyReels';
import LuckyTopBar from './lucky/LuckyTopBar';
import '@/styles/lucky.css';

const PAY_ROWS = ['crown', 'cup', 'ring', 'star', 'gold', 'purple', 'blue', 'green', 'hourglass'];

/** Lucky Olympus: görseldeki butonların üzerine oturan çalışan slot ekranı. */
export default function LuckyOlympusGame({ onBack, onExit }) {
  const boxRef = useRef(null);
  const size = useSize(boxRef);
  const game = useLuckyGame();
  const [sound, setSound] = useState(isSoundEnabled());

  // Görselin tamamı görünür kalır; canlı katmanlar bu orana oturur.
  const frame = useMemo(() => {
    const width = size?.width || 0;
    const height = size?.height || 0;
    if (!width || !height) return null;
    const scale = Math.min(width / SCREEN_WIDTH, height / SCREEN_HEIGHT);
    const w = SCREEN_WIDTH * scale;
    const h = SCREEN_HEIGHT * scale;
    return { width: w, height: h, left: (width - w) / 2, top: (height - h) / 2 };
  }, [size]);

  const merged = (game.result?.collected || []).filter((item) => item.merged > 0);

  // Durum şeridi: tur mesajı, kalan ücretsiz dönüş ve biriken çarpanlar.
  const status = [game.banner];
  if (game.freeSpins > 0) status.push(`Ücretsiz dönüş ${game.freeSpins}`);
  if (merged.length) status.push(`Çarpan ${merged.map((item) => `x${item.merged}`).join(' ')}`);

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
          <div className="absolute" style={boxStyle(REEL_BOX)}>
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

          {/* Görselin kendi üst şeridi: canlı bakiye ve üç yuvarlak düğme. */}
          <LuckyTopBar coins={game.coins} onOpen={game.setSheet} />

          {/* Görselin kendi kontrol paneli: satın al, SPIN ve bahis satırı. */}
          <LuckyPanel
            bet={game.bet}
            coins={game.coins}
            buyCost={game.buyCost}
            spinning={game.spinning}
            auto={game.auto}
            busy={game.busy}
            banner={status.join(' • ')}
            onSpin={game.runSpin}
            onBuy={game.buyFreeSpins}
            onShiftBet={game.shiftBet}
            onMax={game.maxBet}
            onToggleAuto={game.toggleAuto}
          />
        </div>
      )}

      <LuckyInfoSheet open={game.sheet === 'help'} title="Nasıl Oynanır" onClose={() => game.setSheet(null)}>
        <div className="space-y-2 text-[0.72rem] font-semibold leading-snug text-slot-text/90">
          <p>• 20 satır, 5 makara x 4 satır. Kazanç satır başına soldan sağa 3, 4 veya 5 eşleşmedir.</p>
          <p>• 4 veya daha fazla SCATTER (Zeus) gelirse ücretsiz dönüşler başlar ve kendiliğinden oynar.</p>
          <p>• Çarpan sembolleri (x2 - x25) yalnız ücretsiz dönüşlerde birikir; aynı çarpan tekrar gelince birleşir ve (birleşik çarpan x toplam bahis / 10) coin eklenir.</p>
        </div>
      </LuckyInfoSheet>

      <LuckyInfoSheet open={game.sheet === 'pay'} title="Ödeme Tablosu" onClose={() => game.setSheet(null)}>
        <div className="space-y-1.5">
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
        <button
          type="button"
          onClick={() => {
            game.setSheet(null);
            onBack?.();
          }}
          className="slot-panel-3d mt-2 w-full rounded-xl border border-slot-gold/50 px-3 py-3 text-left text-sm font-black text-slot-gold"
        >
          Oyun Merkezine Dön
        </button>
        <button
          type="button"
          onClick={() => {
            game.setSheet(null);
            onExit?.();
          }}
          className="slot-panel-3d mt-2 w-full rounded-xl border border-slot-gold/50 px-3 py-3 text-left text-sm font-black text-slot-gold"
        >
          Paneli Kapat
        </button>
        <p className="mt-3 text-[0.68rem] font-semibold text-slot-text/70">
          Bakiye: {formatCoins(game.coins)} coin • Toplam bahis: {formatCoins(game.bet)}
        </p>
      </LuckyInfoSheet>
    </div>
  );
}