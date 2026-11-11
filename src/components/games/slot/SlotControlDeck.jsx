import { ChevronRight, Coins, Minus, Plus } from 'lucide-react';
import FitGameText from '@/components/games/controls/FitGameText';
import '@/styles/referenceGameDecks.css';

const format = value => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));
export default function SlotControlDeck({ coins, bet, lines, win, freeSpins, auto, spinning, ready, onStep, onMax, onAuto, onSpin, onStop, onCoins }) {
  return (
    <footer className="slot-reference-deck">
      <div className="slot-reference-metrics">
        <div className="slot-reference-lines"><span>Çizgiler</span><strong>{lines}</strong></div>
        <div className="slot-reference-total"><span>Toplam Coinler</span><FitGameText as="strong">{format(bet * lines)}</FitGameText></div>
        <div className="slot-reference-win"><span>Kazanç</span><FitGameText as="strong">{format(win)}</FitGameText></div>
        <button type="button" className="slot-reference-auto" disabled={!ready} onClick={onAuto} aria-pressed={auto}>Otomatik</button>
      </div>
      <div className="slot-reference-bottom">
        <button type="button" onClick={onCoins} className="slot-reference-balance" aria-label="Coin yükle"><Coins size={21} /><FitGameText as="strong">{format(coins)}</FitGameText><ChevronRight />{freeSpins > 0 && <small>{freeSpins} FREE</small>}</button>
        <div className="slot-reference-bet">
          <button type="button" disabled={spinning} onClick={() => onStep(-1)} aria-label="Bahsi azalt"><Minus size={18} /></button>
          <div><FitGameText as="strong">{format(bet)}</FitGameText><button type="button" disabled={!ready || spinning} onClick={onMax} className="slot-reference-max">MAX</button></div>
          <button type="button" disabled={spinning} onClick={() => onStep(1)} aria-label="Bahsi artır"><Plus size={18} /></button>
        </div>
        <button type="button" className="slot-reference-start" disabled={!spinning && !ready} onClick={spinning ? onStop : onSpin}>{spinning ? 'Dur' : 'Baş'}</button>
      </div>
    </footer>
  );
}