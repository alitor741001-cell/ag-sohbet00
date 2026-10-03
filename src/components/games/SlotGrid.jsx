import { Image } from '@/components/ui/image';
import { symbolMap } from '@/components/games/gameHelpers';
import { skinFor } from '@/components/games/gameSkins';

const FRAMES = {
  zeus: 'border-game-gold/70 bg-game-deepest/85 shadow-[0_0_44px_-10px_hsl(var(--game-gold)/0.75)]',
  jackpot: 'border-game-gold/55 bg-game-space/85 shadow-[0_0_44px_-14px_hsl(var(--game-gold)/0.65)]',
};

const CARD_TONES = {
  blue: 'from-sky-400 via-sky-600 to-blue-950',
  magenta: 'from-fuchsia-400 via-fuchsia-600 to-purple-950',
  gold: 'from-amber-200 via-amber-400 to-yellow-800',
};

/** 5 makara × 3 sıra ızgara. Kazanan hatlar parlar, dönen makaralar bulanıklaşır. */
export default function SlotGrid({ columns = [], rolling = [], symbols = [], winRows = [], skin = 'zeus' }) {
  const map = symbolMap(symbols);
  const theme = skinFor(skin);
  return (
    <div className={`relative rounded-2xl border-2 p-2 ${FRAMES[skin] || FRAMES.zeus}`}>
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-game-gold/20" />
      <div className="grid grid-cols-5 gap-1.5">
        {columns.map((column, reel) => (
          <div key={reel} className="relative flex min-w-0 flex-col gap-1.5">
            <span className="pointer-events-none absolute -inset-x-0.5 inset-y-0 rounded-xl border border-game-gold/25" />
            {column.map((symbolId, row) => {
              const symbol = map[symbolId];
              const art = theme.symbols?.[symbolId] || {};
              const isWin = !rolling[reel] && winRows.includes(row);
              return (
                <div
                  key={row}
                  className={`relative flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-xl border transition-colors ${
                    isWin
                      ? 'game-symbol-win border-game-gold bg-game-gold/25'
                      : 'border-game-gold/20 bg-gradient-to-b from-white/10 to-black/35'
                  } ${rolling[reel] ? 'blur-[1.5px]' : ''}`}
                >
                  {art.art ? (
                    <Image
                      src={art.art}
                      alt={symbol?.label || symbolId}
                      fittingType="fill"
                      className="absolute inset-0 h-full w-full"
                    />
                  ) : art.card ? (
                    <span
                      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-b ${CARD_TONES[art.tone] || CARD_TONES.gold} text-xl font-black text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]`}
                    >
                      {art.card}
                    </span>
                  ) : (
                    <span className="text-2xl drop-shadow-[0_1px_5px_rgba(0,0,0,0.85)]">{art.face || symbol?.icon || '⭐'}</span>
                  )}
                  {art.overlay && (
                    <span className="relative text-2xl font-black text-game-gold drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                      {art.overlay}
                    </span>
                  )}
                  {art.badge && (
                    <span className="absolute bottom-0.5 z-10 text-[7px] font-black tracking-widest text-game-gold drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                      {art.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}