import { Play } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { GAMES } from '@/components/games/gameCatalog';

/** Ana sayfadaki Oyunlar sekmesi: altın çerçeveli premium oyun kartları, oda kurmadan oynanır. */
export default function GameDiscoveryRow({ onPick }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {GAMES.map((game) => (
        <button
          key={game.id}
          type="button"
          onClick={() => onPick(game.id)}
          className="group relative block w-full overflow-hidden rounded-2xl border border-premium-gold/35 shadow-[0_0_24px_-12px_rgba(198,40,40,0.95)] active:scale-[0.99]"
        >
          <Image
            src={game.cover}
            alt={game.title}
            className="aspect-square w-full"
            fittingType="fit"
            originWidth={game.originWidth}
            originHeight={game.originHeight}
            quality={92}
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1.5 bg-gradient-to-t from-black/90 to-black/40 px-2 py-1.5">
            <span className="min-w-0 flex-1 truncate text-[11px] font-black tracking-wide text-premium-gold">{game.title}</span>
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-premium-gold/60 bg-gradient-to-r from-premium-red-deep to-premium-red px-2 py-0.5 text-[9.5px] font-black text-white">
              <Play className="h-3 w-3" /> OYNA
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}