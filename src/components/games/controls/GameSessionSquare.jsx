import FitGameText from '@/components/games/controls/FitGameText';
import '@/components/games/controls/gameSessionSquare.css';

/** Dede tarzı paket kutusu; mevcut satın alma ve kalan tur davranışı korunur. */
export default function GameSessionSquare({ game, busy, onCoins }) {
  const active = (game.sessionSpins ?? 0) > 0;
  const affordable = (game.coins ?? 0) >= (game.sessionPrice ?? 0);
  return (
    <button type="button" className="game-session-square" disabled={busy || active}
      onClick={affordable ? game.buySession : onCoins}
      aria-label={active ? `${game.sessionSpins} çevirme kaldı` : affordable ? `${game.sessionSize || 15} çevirme paketi satın al` : 'Coin yükle'}>
      <span className="game-session-crown" aria-hidden="true">♛</span>
      <span>{active ? 'Kalan' : `${game.sessionSize || 15} Çevirme`}</span>
      <span>{active ? 'Çevirme' : 'Satın Al'}</span>
      <FitGameText as="strong">{active ? game.sessionSpins : `${Math.round((game.sessionPrice || 0) / 1000)}K`}</FitGameText>
    </button>
  );
}