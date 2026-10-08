import React, { useMemo, useState } from 'react';
import '@/styles/futbol.css';
import { Image } from '@/components/ui/image';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import FutbolHeader from './futbol/FutbolHeader';
import FutbolTrophy from './futbol/FutbolTrophy';
import FutbolSelection from './futbol/FutbolSelection';
import FutbolTeamGrid from './futbol/FutbolTeamGrid';
import FutbolLegend from './futbol/FutbolLegend';
import FutbolStakeDock from './futbol/FutbolStakeDock';
import FutbolBalanceBar from './futbol/FutbolBalanceBar';
import FutbolResults from './futbol/FutbolResults';
import FutbolMenu from './futbol/FutbolMenu';
import FutbolWinOverlay from './futbol/FutbolWinOverlay';
import useFutbolGame from './futbol/useFutbolGame';
import { FUTBOL_BACKDROP } from './futbol/futbolAssets';
import { MODES, TEAMS, formatClock, formatCoins } from './futbol/futbolConfig';

// Seçim süresi: çubuğun dolması için tur uzunluğuyla aynı olmalı (sunucu 45 saniye verir).
const BET_MS = 45000;

/**
 * ALTIN GOL: futbol çekilişi. Bütün oyuncular aynı turu oynar: kartlara bahis konur,
 * süre bitince kazanan takım çekilir ve kazanan kartın bahsi çarpanıyla ödenir.
 */
export default function FootballGame({ onExit, onBack }) {
  const game = useFutbolGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const stats = useMemo(
    () => Object.fromEntries(game.teams.map((team) => [team.id, team])),
    [game.teams]
  );

  const totalPot = useMemo(
    () => game.teams.reduce((sum, team) => sum + (team.pot || 0), 0),
    [game.teams]
  );

  // Popülerlik: turun parasının en az beşte biri o karta konmuşsa kart ateş alır.
  const hot = useMemo(
    () => new Set(game.teams.filter((team) => totalPot > 0 && (team.pot || 0) / totalPot >= 0.2).map((team) => team.id)),
    [game.teams, totalPot]
  );

  const drawing = game.round?.status === 'drawing';
  const roundNo = game.round?.round_no || 0;
  const winner = game.round?.winner_id || '';
  const mineOnWinner = winner ? stats[winner]?.mine ?? 0 : 0;
  const hasPicks = game.teams.some((team) => (team.mine || 0) > 0);
  const clock = formatClock(game.left);
  const ratio = drawing ? game.left / 8000 : game.left / BET_MS;
  const modeLabel = MODES.find((item) => item.id === game.mode)?.label || 'Normal';

  return (
    <div className="fut-sky">
      <div className="fut-backdrop" aria-hidden="true">
        <Image src={FUTBOL_BACKDROP} alt="" className="h-full w-full" fittingType="fill" quality={70} />
      </div>
      <span className="fut-veil" aria-hidden="true" />

      <div className="fut-scroll">
        <FutbolHeader
          mode={game.mode}
          roundNo={roundNo}
          sound={game.sound}
          onMode={game.changeMode}
          onSound={game.toggleSound}
          onMenu={() => setMenuOpen(true)}
          onBack={onBack}
          onExit={onExit}
        />

        <FutbolTrophy
          count={game.picksCount}
          winner={winner}
          mine={mineOnWinner}
          drawing={drawing}
        />

        <FutbolSelection
          status={game.round?.status}
          clock={clock}
          ratio={ratio}
          hasPicks={hasPicks}
          onClear={game.clearPicks}
        />

        <FutbolTeamGrid
          teams={TEAMS}
          stats={stats}
          selected={game.selected}
          hot={hot}
          onSelect={game.pickTeam}
        />

        <FutbolLegend />

        <FutbolStakeDock
          selected={game.selected}
          disabled={drawing || game.busy || game.status !== 'ready'}
          follow={game.follow}
          onStake={game.addStake}
          onFollow={game.toggleFollow}
        />

        <FutbolBalanceBar coins={game.coins} today={game.today} onCoins={() => setCoinOpen(true)} />

        <FutbolResults history={game.history} />

        <p className="fut-footnote">Mod: {modeLabel} · Toplam kazanç {formatCoins(game.totalWon)} coin</p>

        {game.status === 'loading' && <p className="fut-message">Oyun yükleniyor...</p>}
        {game.status === 'error' && <p className="fut-message">Bağlantı kurulamadı, tekrar deniyorum...</p>}
        {game.message && <p className="fut-message fut-message-alert">{game.message}</p>}
      </div>

      <CoinPurchasePanel open={coinOpen} coins={game.coins} onBack={() => setCoinOpen(false)} />

      <FutbolMenu
        open={menuOpen}
        mode={game.mode}
        sound={game.sound}
        onSound={game.toggleSound}
        onCoins={() => { setMenuOpen(false); setCoinOpen(true); }}
        onClose={() => setMenuOpen(false)}
      />

      <FutbolWinOverlay
        open={!!game.prize}
        amount={game.prize?.amount || 0}
        winner={game.prize?.winner || ''}
        onAccept={game.clearPrize}
      />
    </div>
  );
}