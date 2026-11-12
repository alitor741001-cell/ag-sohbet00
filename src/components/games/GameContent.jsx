import { lazy, Suspense } from 'react';
import GameAmbience from '@/components/games/GameAmbience';
import GameErrorBoundary from '@/components/games/GameErrorBoundary';
import '@/styles/gameControlThemes.css';
import '@/components/games/controls/slotStyleControls.css';
import { DEDE_ID, ELIMIN_ID, FRUIT_ID, FUTBOL_ID, GAMES, OKEY_CLASSIC_ID, OKEY_ID, ROCKET_ID, ROULETTE_ID, SEKERLI_MEYVE_ID, SLOT_ID } from '@/components/games/gameCatalog';
import GameLeaderBadge from '@/components/games/leaders/GameLeaderBadge';

// Kazanan listesi tutulan oyunlar ve sunucudaki adları.
const LEADER_KEYS = {
  [SLOT_ID]: 'slot',
  [FRUIT_ID]: 'fruit',
  [SEKERLI_MEYVE_ID]: 'sekerli',
  [ELIMIN_ID]: 'elimin',
  [ROULETTE_ID]: 'roulette',
  [ROCKET_ID]: 'rocket',
  [FUTBOL_ID]: 'futbol',
};

const SlotGame = lazy(() => import('@/components/games/SlotGame'));
const OkeyGame = lazy(() => import('@/components/games/OkeyGame'));
const games = {
  [OKEY_ID]: OkeyGame,
  [OKEY_CLASSIC_ID]: OkeyGame,
  [SEKERLI_MEYVE_ID]: lazy(() => import('@/components/games/SekerliMeyveGame')),
  [FUTBOL_ID]: lazy(() => import('@/components/games/FootballGame')),
  [DEDE_ID]: lazy(() => import('@/components/games/DedeGame')),
  [ROCKET_ID]: lazy(() => import('@/components/games/CrashRocketGame')),
  [FRUIT_ID]: lazy(() => import('@/components/games/FruitGame')),
  [ELIMIN_ID]: lazy(() => import('@/components/games/EliminSlotGame')),
  [ROULETTE_ID]: lazy(() => import('@/components/games/RouletteGame')),
};
export default function GameContent({ selected, onExit, onBack, roomId }) {
  const Game = games[selected] || SlotGame;
  const variant = selected === OKEY_CLASSIC_ID ? 'okey' : 'okey101';
  return (
    <Suspense fallback={<div className="flex h-full flex-col items-center justify-center gap-4 bg-slot text-slot-text" role="status"><p>Oyun yükleniyor...</p><button type="button" onClick={onExit} className="min-h-11 rounded-xl border border-slot-gold/40 px-4">Geri dön</button></div>}>
      <div className="game-controls-themed game-slot-controls relative h-full w-full" data-game={selected}>
        <GameErrorBoundary onExit={onExit}>
          <Game onExit={onExit} onBack={onBack} roomId={roomId} variant={variant} />
        </GameErrorBoundary>
        {/* Dede rozeti kendi üst görselinde durur; okeyde coin kazancı olmadığı için liste yok. */}
        {LEADER_KEYS[selected] && <GameLeaderBadge game={LEADER_KEYS[selected]} title={GAMES.find((item) => item.id === selected)?.title || ''} />}
        <GameAmbience />
      </div>
    </Suspense>
  );
}