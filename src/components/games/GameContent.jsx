import { lazy, Suspense } from 'react';
import { ANKA_ID, DEDE_ID, ELIMIN_ID, FRUIT_ID, FUTBOL_ID, OKEY_CLASSIC_ID, OKEY_ID, ROCKET_ID, ROULETTE_ID, SEKERLI_MEYVE_ID, SEKER_ID, ZAR_ID } from '@/components/games/gameCatalog';

const SlotGame = lazy(() => import('@/components/games/SlotGame'));
const OkeyGame = lazy(() => import('@/components/games/OkeyGame'));
const games = {
  [ANKA_ID]: lazy(() => import('@/components/games/anka/AnkaGame')),
  [OKEY_ID]: OkeyGame,
  [OKEY_CLASSIC_ID]: OkeyGame,
  [SEKERLI_MEYVE_ID]: lazy(() => import('@/components/games/SekerliMeyveGame')),
  [FUTBOL_ID]: lazy(() => import('@/components/games/FootballGame')),
  [DEDE_ID]: lazy(() => import('@/components/games/DedeGame')),
  [ROCKET_ID]: lazy(() => import('@/components/games/CrashRocketGame')),
  [FRUIT_ID]: lazy(() => import('@/components/games/FruitGame')),
  [ELIMIN_ID]: lazy(() => import('@/components/games/EliminSlotGame')),
  [ROULETTE_ID]: lazy(() => import('@/components/games/RouletteGame')),
  [ZAR_ID]: lazy(() => import('@/components/games/ZarGame')),
  [SEKER_ID]: lazy(() => import('@/components/games/SekerGame')),
};
export default function GameContent({ selected, onExit, onBack, roomId }) {
  const Game = games[selected] || SlotGame;
  const variant = selected === OKEY_CLASSIC_ID ? 'okey' : 'okey101';
  return (
    <Suspense fallback={<div className="flex h-full flex-col items-center justify-center gap-4 bg-slot text-slot-text" role="status"><p>Oyun yükleniyor...</p><button type="button" onClick={onExit} className="min-h-11 rounded-xl border border-slot-gold/40 px-4">Geri dön</button></div>}>
      <Game onExit={onExit} onBack={onBack} roomId={roomId} variant={variant} />
    </Suspense>
  );
}