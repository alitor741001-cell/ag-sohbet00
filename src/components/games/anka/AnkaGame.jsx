import React, { useState } from 'react';
import { ChevronLeft, HelpCircle } from 'lucide-react';
import useAnkaGame from '@/components/games/anka/useAnkaGame';
import AnkaCabinet from '@/components/games/anka/AnkaCabinet';
import AnkaDialog from '@/components/games/anka/AnkaDialog';
import GameBetBar from '@/components/games/controls/GameBetBar';
import GameSpinButton from '@/components/games/controls/GameSpinButton';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import { formatCoins, ANKA_LINES } from '@/components/games/anka/ankaConfig';
import '@/components/games/anka/anka.css';
import '@/styles/gameControls.css';
export default function AnkaGame({ onBack, onExit }) {
  const [coinsOpen, setCoinsOpen] = useState(false), [dialog, setDialog] = useState(null);
  const game = useAnkaGame(coinsOpen || !!dialog);
  const kind = game.prize ? 'prize' : dialog;
  const closeDialog = () => { if (game.prize) game.clearPrize(); else setDialog(null); };
  return <section className="anka-game font-body">
    <header className="anka-header"><button onClick={onBack || onExit} aria-label="Oyun listesine dön"><ChevronLeft /></button><span>ANKA KUŞU</span><button onClick={() => setDialog('help')} aria-label="Nasıl oynanır"><HelpCircle /></button></header>
    <main className="anka-stage"><AnkaCabinet game={game} onBonus={() => setDialog('buy')} onHelp={() => setDialog('help')} /></main>
    <div className="anka-hud">
      <button onClick={() => setCoinsOpen(true)}><small>BAKİYE +</small><strong>{formatCoins(game.coins)}</strong></button>
      <span><small>KAZANÇ</small><strong>{formatCoins(game.win)}</strong></span>
      <span><small>TOPLAM BAHİS</small><strong>{formatCoins(game.bet * ANKA_LINES)}</strong></span>
    </div>
    {game.status === 'loading' && <p className="anka-message" role="status">Oyun yükleniyor…</p>}
    {game.message && <p className="anka-message" role="alert">{game.message}</p>}
    <footer className="anka-controls"><div className="gctl-deck ref-deck">
      <GameBetBar bet={game.bet} disabled={game.busy || game.status !== 'ready' || game.free_spins > 0} onStep={game.step} onMax={game.max} format={formatCoins} />
      <GameSpinButton spinning={game.rolling} disabled={game.status !== 'ready' || !!kind || coinsOpen} spinDisabled={game.busy || !!kind || coinsOpen} auto={game.auto} onSpin={game.spin} onStop={game.stop} onAuto={game.toggleAuto} />
    </div></footer>
    <CoinPurchasePanel open={coinsOpen} coins={game.coins} onBack={() => setCoinsOpen(false)} />
    <AnkaDialog kind={kind} onClose={closeDialog} game={game} onBuy={() => { setDialog(null); game.buy(); }} />
  </section>;
}