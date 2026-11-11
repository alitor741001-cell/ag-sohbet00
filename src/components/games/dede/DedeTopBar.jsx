import React, { useEffect, useState } from 'react';
import { ChevronLeft, Crown, HelpCircle, Sparkles } from 'lucide-react';
import '@/components/games/dede/dedeTopBar.css';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// İnce şerit, oyunun değerlerini sırayla gösterir.
const STEPS = [
  { key: 'bet', label: 'BAHİS' },
  { key: 'coins', label: 'BAKİYE' },
  { key: 'totalWon', label: 'TOPLAM KAZANÇ' },
  { key: 'win', label: 'SON KAZANÇ' },
  { key: 'multiplier', label: 'ÇARPAN' },
];
const STEP_MS = 2400;

/** Dede üst barı: altın kemerli ince şerit — çevirme hakkı, başlık ve sırayla gelen değerler. */
export default function DedeTopBar({ onBack, onHelp, spins = 0, stats, compact = false }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((index) => (index + 1) % STEPS.length), STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  const current = STEPS[step];
  const value = current.key === 'multiplier' ? `x${stats?.multiplier || 0}` : format(stats?.[current.key]);

  return (
    <header className={`dtb${compact ? ' dtb-compact' : ''}`}>
      <div className="dtb-row">
        <button type="button" onClick={onBack} aria-label="Oyun listesine dön" className="dtb-orb">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="dtb-title">
          <Sparkles className="dtb-title-star" />
          <span className="dtb-title-text">DEDE</span>
          <Sparkles className="dtb-title-star" />
        </div>
        <span className="dtb-spins">
          <Crown className="h-3 w-3 text-[#ffd76a]" />
          <span className="tabular-nums">{spins || 0}</span>
        </span>
        <button type="button" onClick={onHelp} aria-label="Nasıl oynanır" className="dtb-orb">
          <HelpCircle className="h-5 w-5" strokeWidth={2.6} />
        </button>
      </div>
      <div key={current.key} className="dtb-ribbon">
        <span className="dtb-ribbon-label">{current.label}</span>
        <span className="dtb-ribbon-value">{value}</span>
      </div>
    </header>
  );
}