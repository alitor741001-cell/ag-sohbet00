import React, { useEffect, useState } from 'react';
import './slotFrenzy.css';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

// Bar tek tek bu havuzları gösterir; en sonda toplam (grand) havuz görünür.
const STEPS = [
  { key: 'mini', label: 'MINI' },
  { key: 'big', label: 'BIG' },
  { key: 'mega', label: 'MEGA' },
  { key: 'xmega', label: 'XMEGA' },
  { key: 'jackpot', label: 'TOPLAM' },
];
const STEP_MS = 2400;

/** Tek havuz barı: dar plaka, havuzlar sırayla gelir, toplam havuz altın vurguyla görünür. */
export default function SlotJackpotBar({ pools, topGap = 0, compact = false }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((index) => (index + 1) % STEPS.length), STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  const current = STEPS[step];
  const grand = current.key === 'jackpot';

  return (
    <div className="relative shrink-0" style={{ paddingTop: `${topGap}px` }}>
      <div className={`sfz-jp sfz-jp-narrow mx-auto w-full ${compact ? 'is-compact max-w-[12.5rem]' : 'max-w-[15.5rem]'}`}>
        <div key={current.key} className={`sfz-jp-plate sfz-jp-step ${grand ? 'is-grand' : ''}`}>
          <span className="sfz-jp-label">{current.label}</span>
          <span className="sfz-jp-value">{format(pools?.[current.key])}</span>
        </div>
      </div>
    </div>
  );
}