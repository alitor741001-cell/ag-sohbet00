import { Play } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { GAMES } from '@/components/games/gameCatalog';

/** Ana sayfadaki Oyunlar sekmesi: oda kurmadan oyun seçilir ve tam ekran açılır. */
export default function GameDiscoveryRow({ onPick }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {GAMES.map((game) => (
        <button
          key={game.id}
          type="button"
          onClick={() => onPick(game.id)}
          className="group relative block w-full overflow-hidden rounded-2xl border border-[#f2ce6b]/40 active:scale-[0.99]"
        >
          <Image
            src={game.cover}
            alt={game.title}
            className="aspect-[4/3] w-full"
            fittingType="fill"
            originWidth={game.originWidth}
            originHeight={game.originHeight}
            quality={92}
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1.5 bg-black/70 px-2 py-1.5">
            <span className="min-w-0 flex-1 truncate text-[11px] font-black tracking-wide text-[#f2ce6b]">{game.title}</span>
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-black text-white">
              <Play className="h-3 w-3" /> OYNA
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}