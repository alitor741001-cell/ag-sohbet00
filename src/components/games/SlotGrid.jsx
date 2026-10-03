import { symbolMap } from '@/components/games/gameHelpers';
import { skinFor } from '@/components/games/gameSkins';

const FRAMES = {
  zeus: 'border-game-gold/70 bg-game-deepest/85 shadow-[0_0_44px_-10px_hsl(var(--game-gold)/0.75)]',
  jackpot: 'border-game-gold/55 bg-game-space/85 shadow-[0_0_44px_-14px_hsl(var(--game-gold)/0.65)]',
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
                  className={`relative flex aspect-square min-w-0 items-center justify-center rounded-xl border transition-colors ${
                    isWin
                      ? 'game-symbol-win border-game-gold bg-game-gold/25'
                      : 'border-game-gold/20 bg-gradient-to-b from-white/10 to-black/35'
                  } ${rolling[reel] ? 'blur-[1.5px]' : ''}`}
                >
                  {art.label
                    ? <span className={`text-xl font-black ${isWin ? 'text-white' : 'text-game-gold'} drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]`}>{art.label}</span>
                    : <span className="text-2xl drop-shadow-[0_1px_5px_rgba(0,0,0,0.85)]">{art.face || symbol?.icon || '⭐'}</span>}
                  {art.badge && <span className="absolute bottom-0.5 text-[7px] font-black tracking-widest text-game-gold">{art.badge}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}