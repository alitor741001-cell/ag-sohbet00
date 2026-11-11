import SlotControlDeck from '@/components/games/slot/SlotControlDeck';
import GameActionRow from '@/components/games/controls/GameActionRow';

/** Aynı slot konsolu, her oyunun mevcut çevirme ve paket işlemleriyle. */
export default function MatchingSlotDeck({ game, theme, lines, win, spinning, busy = spinning, onCoins }) {
  return (
    <div className="matched-slot-console" data-console-theme={theme}>
      <GameActionRow coins={game.coins} sessionPrice={game.sessionPrice}
        sessionSpins={game.sessionSpins} sessionSize={game.sessionSize}
        busy={busy} onSession={game.buySession} onCoins={onCoins} />
      <SlotControlDeck theme={theme} coins={game.coins} bet={game.bet} lines={lines}
        win={win} auto={game.auto} spinning={spinning} betDisabled={busy}
        ready={game.status === 'ready'} onStep={game.changeBet} onMax={game.maxBet}
        onAuto={game.toggleAuto} onSpin={game.spin} onStop={game.stop} onCoins={onCoins} />
    </div>
  );
}