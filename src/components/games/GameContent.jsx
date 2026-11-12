import { lazy, Suspense, useMemo } from 'react';
import GameAmbience from '@/components/games/GameAmbience';
import GameErrorBoundary from '@/components/games/GameErrorBoundary';
import loadGameModule from '@/components/games/loadGameModule';
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

const loadSlot = () => import('@/components/games/SlotGame');
const loadOkey = () => import('@/components/games/OkeyGame');
const importers = {
  [OKEY_ID]: loadOkey,
  [OKEY_CLASSIC_ID]: loadOkey,
  [SEKERLI_MEYVE_ID]: () => import('@/components/games/SekerliMeyveGame'),
  [FUTBOL_ID]: () => import('@/components/games/FootballGame'),
  [DEDE_ID]: () => import('@/components/games/DedeGame'),
  [ROCKET_ID]: () => import('@/components/games/CrashRocketGame'),
  [FRUIT_ID]: () => import('@/components/games/FruitGame'),
  [ELIMIN_ID]: () => import('@/components/games/EliminSlotGame'),
  [ROULETTE_ID]: () => import('@/components/games/RouletteGame'),
};

const loadingScreen = (onExit) => (
  <div className="flex h-full flex-col items-center justify-center gap-4 bg-slot text-slot-text" role="status">
    <p>Oyun yükleniyor...</p>
    <button type="button" onClick={onExit} className="min-h-11 rounded-xl border border-slot-gold/40 px-4">Geri dön</button>
  </div>
);

/** Her denemede oyun dosyası baştan istenir: "Tekrar dene" eski hatayı tekrar göstermez. */
function GameLoader({ selected, attempt, ...props }) {
  const Game = useMemo(() => lazy(() => loadGameModule(importers[selected] || loadSlot)), [selected, attempt]);
  return (
    <Suspense fallback={loadingScreen(props.onExit)}>
      <Game {...props} />
    </Suspense>
  );
}

export default function GameContent({ selected, onExit, onBack, roomId }) {
  const variant = selected === OKEY_CLASSIC_ID ? 'okey' : 'okey101';
  return (
    <div className="game-controls-themed game-slot-controls relative h-full w-full" data-game={selected}>
      <GameErrorBoundary key={selected} onExit={onExit}>
        {(attempt) => (
          <GameLoader selected={selected} attempt={attempt} onExit={onExit} onBack={onBack} roomId={roomId} variant={variant} />
        )}
      </GameErrorBoundary>
      {/* Dede rozeti kendi üst görselinde durur; okeyde coin kazancı olmadığı için liste yok. */}
      {LEADER_KEYS[selected] && <GameLeaderBadge game={LEADER_KEYS[selected]} title={GAMES.find((item) => item.id === selected)?.title || ''} />}
      <GameAmbience />
    </div>
  );
}