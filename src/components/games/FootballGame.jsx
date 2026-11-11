import React, { useCallback, useEffect, useState } from 'react';
import { Trophy, Users } from 'lucide-react';
import '@/styles/futbol.css';
import '@/styles/gameControls.css';
import { Image } from '@/components/ui/image';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import GameStatCards from '@/components/games/controls/GameStatCards';
import GameWinReadout from '@/components/games/shared/GameWinReadout';
import FutbolHeader from './futbol/FutbolHeader';
import FutbolPitch from './futbol/FutbolPitch';
import FutbolStakeDock from './futbol/FutbolStakeDock';
import FutbolResults from './futbol/FutbolResults';
import FutbolMenu from './futbol/FutbolMenu';
import FutbolWinOverlay from './futbol/FutbolWinOverlay';
import useFutbolGame from './futbol/useFutbolGame';
import useTableBets from './shared/useTableBets';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { FUTBOL_BACKDROP } from './futbol/futbolAssets';
import { TEAMS, formatClock, formatCoins } from './futbol/futbolConfig';

// Seçim süresi: çemberin dolması için tur uzunluğuyla aynı olmalı (sunucu 20 saniye verir).
const BET_MS = 20000;
const DRAW_MS = 8000;

/**
 * ALTIN GOL: futbol çekilişi. Bütün oyuncular aynı turu oynar: kartlara bahis konur,
 * süre bitince kare kartların üstünde dönerek kazananı seçer ve kazanan kartın
 * bahsi çarpanıyla ödenir.
 */
export default function FootballGame({ onExit, onBack }) {
  const game = useFutbolGame();
  const [coinOpen, setCoinOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shownWinner, setShownWinner] = useState('');

  const drawing = game.round?.status === 'drawing';
  const winnerId = game.round?.winner_id || '';

  // Kare kazananın üstünde durduğunda sonuç açıklanır.
  useEffect(() => {
    if (!drawing) setShownWinner('');
  }, [drawing]);

  const handleLanded = useCallback(() => {
    setShownWinner((current) => current || winnerId);
  }, [winnerId]);

  const stats = Object.fromEntries(game.teams.map((team) => [team.id, team]));
  const totalPot = game.teams.reduce((sum, team) => sum + (team.pot || 0), 0);

  // Popülerlik: turun parasının en az beşte biri o karta konmuşsa kart ateş alır.
  const hot = new Set(
    game.teams.filter((team) => totalPot > 0 && (team.pot || 0) / totalPot >= 0.2).map((team) => team.id)
  );

  const roundNo = game.round?.round_no || 0;
  // Kartlara konan jetonlar herkese görünür: ana sayfadaki ve odadaki oyuncu aynı masayı görür.
  const { user } = useCurrentUser();
  const tableChips = useTableBets('futbol', roundNo, user?.id).chips;
  const mineOnWinner = shownWinner ? stats[shownWinner]?.mine ?? 0 : 0;
  const hasPicks = game.teams.some((team) => (team.mine || 0) > 0);
  const clock = formatClock(game.left);
  const ratio = drawing ? game.left / DRAW_MS : game.left / BET_MS;

  // Üst metrikler: roulette'teki kartların aynısı.
  const statItems = [
    { key: 'today', label: 'BUGÜNÜN ÖDÜLLERİ', value: formatCoins(game.today), icon: Trophy, win: game.today > 0 },
    { key: 'picks', label: 'TUR SEÇİMİ', value: formatCoins(game.picksCount), icon: Users },
  ];

  return (
    <div className="fut-sky">
      <div className="fut-backdrop" aria-hidden="true">
        <Image src={FUTBOL_BACKDROP} alt="" className="h-full w-full" fittingType="fill" quality={70} />
      </div>
      <span className="fut-veil" aria-hidden="true" />

      <div className="fut-scroll">
        <FutbolHeader
          roundNo={roundNo}
          sound={game.sound}
          onSound={game.toggleSound}
          onMenu={() => setMenuOpen(true)}
          onCoins={() => setCoinOpen(true)}
          onBack={onBack}
        />

        <div className="fut-stats">
          <GameStatCards items={statItems} />
        </div>

        <FutbolPitch
          teams={TEAMS}
          stats={stats}
          chips={tableChips}
          hot={hot}
          totalPot={totalPot}
          selected={game.selected}
          onSelect={game.pickTeam}
          winnerId={winnerId}
          revealed={shownWinner}
          mineOnWinner={mineOnWinner}
          count={game.picksCount}
          drawing={drawing}
          clock={clock}
          ratio={ratio}
          hasPicks={hasPicks}
          onClear={game.clearPicks}
          remaining={game.left}
          sound={game.sound}
          onLanded={handleLanded}
        />

        <FutbolResults history={game.history} />

        <GameWinReadout amount={game.payout} />
        <FutbolStakeDock
          selected={game.selected}
          disabled={drawing || game.busy || game.status !== 'ready'}
          follow={game.follow}
          onStake={game.addStake}
          onFollow={game.toggleFollow}
        />

        {game.status === 'loading' && <p className="fut-message">Oyun yükleniyor...</p>}
        {game.status === 'error' && <p className="fut-message">Bağlantı kurulamadı, tekrar deniyorum...</p>}
        {game.message && <p className="fut-message fut-message-alert">{game.message}</p>}
      </div>

      <CoinPurchasePanel open={coinOpen} coins={game.coins} onBack={() => setCoinOpen(false)} />

      <FutbolMenu
        open={menuOpen}
        sound={game.sound}
        onSound={game.toggleSound}
        onCoins={() => { setMenuOpen(false); setCoinOpen(true); }}
        onClose={() => setMenuOpen(false)}
      />

      <FutbolWinOverlay
        open={!!game.prize}
        amount={game.prize?.amount || 0}
        stake={game.prize?.stake || 0}
        winner={game.prize?.winner || ''}
        onAccept={game.clearPrize}
      />
    </div>
  );
}