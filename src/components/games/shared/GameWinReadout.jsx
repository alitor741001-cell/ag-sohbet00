import FitGameText from '@/components/games/controls/FitGameText';

const format = (amount) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(amount || 0)));

/** Eşiksiz tur kazancı: küçük ödemeler de tam coin tutarıyla gösterilir. */
export default function GameWinReadout({ amount = 0 }) {
  return (
    <div className="game-win-readout" aria-live="polite" aria-atomic="true">
      <span>WIN / KAZANÇ</span>
      <FitGameText as="strong">{format(amount)} COIN</FitGameText>
    </div>
  );
}