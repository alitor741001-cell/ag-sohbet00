import { Minus, Plus, Coins } from 'lucide-react';
import DedeMultiplierCircle from '@/components/games/dede/DedeMultiplierCircle';
import FitGameText from '@/components/games/controls/FitGameText';
import { DEDE_LINES, formatCoins } from '@/components/games/dede/dedeConfig';
import '@/styles/referenceGameDecks.css';
import compactCoins from '@/lib/compactCoins';

export default function DedeControlDeck({ game, onCoins }) {
  const busy = game.spinning || game.intro;
  const disabled = game.status !== 'ready' || game.intro;
  const active = game.sessionSpins > 0;
  const affordable = game.coins >= game.sessionPrice;
  return (
    <footer className="dede-reference-deck">
      <div className="dede-reference-win"><span>WIN</span><FitGameText as="strong">{formatCoins(game.win)}</FitGameText></div>
      <button type="button" className="dede-reference-balance" onClick={onCoins} aria-label="Coin bakiyesi, coin yükle"><Coins size={14} /> {compactCoins(game.coins)} <span>›</span></button>
      <div className="dede-reference-center">
        <button type="button" className="dede-reference-buy" disabled={busy || active || disabled} onClick={affordable ? game.buySession : onCoins} aria-label={affordable ? '15 çevirme paketi satın al' : 'Coin yükle'}>
          <span className="dede-reference-crown" aria-hidden="true">♛</span>
          <span>{active ? 'Kalan' : `${game.sessionSize || 15} Çevirme`}</span><span>{active ? 'Çevirme' : 'Satın Al'}</span>
          <FitGameText as="strong">{active ? game.sessionSpins : `${Math.round(game.sessionPrice / 1000)}K`}</FitGameText>
        </button>
        <button type="button" className="dede-reference-spin" disabled={!game.spinning && disabled} onClick={game.spinning ? game.stop : game.spin} aria-label={game.spinning ? 'Durdur' : 'Çevir'}><span>{game.spinning ? 'STOP' : 'SPIN'}</span></button>
        <div className="dede-reference-scroll">
          <span>ÇARPAN</span><DedeMultiplierCircle multiplier={game.multiplier} orbs={game.orbs} />
        </div>
      </div>
      <div className="dede-reference-toolbar">
        <button type="button" className="dede-reference-auto" disabled={disabled} onClick={game.toggleAuto} aria-pressed={game.auto}>Otomatik</button>
        <button type="button" className="dede-reference-step" disabled={busy} onClick={() => game.changeBet(-1)} aria-label="Bahsi azalt"><Minus /></button>
        <div className="dede-reference-bet"><FitGameText as="strong">{formatCoins(game.bet * DEDE_LINES)} ◉</FitGameText><span>TOPLAM BAHİS</span></div>
        <button type="button" className="dede-reference-step" disabled={busy} onClick={() => game.changeBet(1)} aria-label="Bahsi artır"><Plus /></button>
        <button type="button" className="dede-reference-max" disabled={busy} onClick={game.maxBet}>MAX</button>
      </div>
    </footer>
  );
}