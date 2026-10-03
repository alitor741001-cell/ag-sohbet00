import { symbolMap } from '@/components/games/gameHelpers';

/** 5 makara × 3 sıra ızgara. Kazanan hatlar parlar, dönen makaralar bulanıklaşır. */
export default function SlotGrid({ columns = [], rolling = [], symbols = [], winRows = [] }) {
  const map = symbolMap(symbols);
  return (
    <div className="rounded-2xl border-2 border-game-gold/40 bg-black/60 p-2 shadow-[0_0_32px_-12px_hsl(var(--game-gold))]">
      <div className="grid grid-cols-5 gap-1.5">
        {columns.map((column, reel) => (
          <div key={reel} className="flex min-w-0 flex-col gap-1.5">
            {column.map((symbolId, row) => {
              const symbol = map[symbolId];
              const isWin = !rolling[reel] && winRows.includes(row);
              return (
                <div
                  key={row}
                  className={`flex aspect-square min-w-0 items-center justify-center rounded-xl border text-xl transition-colors sm:text-2xl ${
                    isWin
                      ? 'game-symbol-win border-game-gold bg-game-gold/20'
                      : 'border-white/10 bg-gradient-to-b from-white/8 to-transparent'
                  } ${rolling[reel] ? 'blur-[1.5px]' : ''}`}
                >
                  <span className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">{symbol?.icon || '⭐'}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}