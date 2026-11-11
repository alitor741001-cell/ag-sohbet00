import { useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { GAMES, SLOT_ID, DEDE_ID } from '@/components/games/gameCatalog';
import '@/styles/referenceGameDecks.css';

const ordered = [SLOT_ID, DEDE_ID].map(id => GAMES.find(game => game.id === id)).concat(GAMES.filter(game => ![SLOT_ID, DEDE_ID].includes(game.id)));
export default function GameQuickNav({ selected, onSelect, onBack }) {
  const activeRef = useRef(null);
  useEffect(() => { activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [selected]);
  return (
    <nav className="game-quick-nav" aria-label="Oyunlar arasında geçiş">
      <button className="game-quick-back" type="button" onClick={onBack} aria-label="Oyundan çık"><ChevronLeft /></button>
      <div className="game-quick-list no-scrollbar">
        {ordered.map(game => (
          <button key={game.id} ref={selected === game.id ? activeRef : null} type="button" onClick={() => onSelect(game.id)} aria-label={`${game.title} oyununu aç`} aria-current={selected === game.id ? 'page' : undefined} title={game.title} className="game-quick-orb">
            <Image src={game.cover} alt={game.title} fittingType="fill" className="h-full w-full rounded-full" blurPlaceholder={false} />
          </button>
        ))}
      </div>
    </nav>
  );
}