import { ChevronRight, Crown } from 'lucide-react';
import compactCoins from '@/lib/compactCoins';
import FitGameText from '@/components/games/controls/FitGameText';
import './goldCoinBar.css';

/** Dede'nin sol üstündeki coin barı: altın taçlı jeton, koyu altın çerçeveli hap, altın ok. */
export default function GoldCoinBar({ coins, onCoins }) {
  return (
    <button type="button" onClick={onCoins} aria-label="Coin Yükle" className="gold-coin-bar">
      <span className="gold-coin-bar-coin" aria-hidden="true"><Crown strokeWidth={2.4} /></span>
      <span className="gold-coin-bar-count tabular-nums">
        <FitGameText>{coins == null ? '—' : compactCoins(coins)}</FitGameText>
      </span>
      <ChevronRight className="gold-coin-bar-arrow" strokeWidth={3.4} aria-hidden="true" />
    </button>
  );
}