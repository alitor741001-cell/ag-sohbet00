import SlotControlDeck from '@/components/games/slot/SlotControlDeck';
import GameSessionSquare from '@/components/games/controls/GameSessionSquare';

/** Aynı slot konsolu, her oyunun mevcut çevirme ve paket işlemleriyle. */
export default function MatchingSlotDeck({ game, theme, lines, win, spinning, busy = spinning, onCoins, coinBar }) {
  return (
    <div className="matched-slot-console" data-console-theme={theme}>
      <SlotControlDeck theme={theme} coins={game.coins} bet={game.bet} lines={lines}
        leftAccessory={<GameSessionSquare game={game} busy={busy} onCoins={onCoins} />}
        win={win} auto={game.auto} spinning={spinning} betDisabled={busy}
        ready={game.status === 'ready'} onStep={game.changeBet} onMax={game.maxBet}
        onAuto={game.toggleAuto} onSpin={game.spin} onStop={game.stop} onCoins={onCoins} coinBar={coinBar} />
    </div>
  );
}