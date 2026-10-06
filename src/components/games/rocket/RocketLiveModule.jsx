import React from 'react';
import { format, formatAuto } from './rocketConfig';

// Tasarımdaki modül yerleşimi: merkeze göre tasarım pikselleri.
const AUTO = { dx: -95, top: 1212, width: 190, height: 30 };
const AMOUNT = { dx: -85, top: 1298, width: 170, height: 50 };
const ACTION = { dx: -116, top: 1362, width: 232, height: 76 };

const AUTO_FILL = 'linear-gradient(180deg,#32517e 0%,#4e8cc0 28%,#4a92d3 40%,#2a4e84 62%,#24406e 100%)';
const ACTION_FILL = 'linear-gradient(180deg,#2f7fd8 0%,#123f8e 16%,#63bcf8 46%,#a9d9ff 78%,#eaf7ff 100%)';

/** Alt paneldeki tek bahis modülü: tasarımın üç satırı canlı değerlerle dolar. */
export default function RocketLiveModule({
  center, amount, auto, label, badge, sub, locked, disabled,
  onAuto, onAutoEdit, onAmount, onAction,
}) {
  const hot = (left, top, width, height, aria, handler, off) => (
    <button
      type="button"
      aria-label={aria}
      disabled={off}
      onClick={handler}
      className="absolute"
      style={{ left, top, width, height }}
    />
  );

  return (
    <>
      <span className="absolute rounded-lg" style={{ left: center + AUTO.dx, top: AUTO.top, width: AUTO.width, height: AUTO.height, background: AUTO_FILL }} />
      <span
        className="pointer-events-none absolute flex items-center justify-center font-black"
        style={{
          left: center + AUTO.dx, top: AUTO.top, width: AUTO.width, height: AUTO.height,
          fontSize: 21, color: auto > 0 ? '#eaf5ff' : '#a9c0da',
        }}
      >
        {formatAuto(auto)}
      </span>
      {hot(center - 170, AUTO.top - 4, 50, 38, 'Otomatik çekilme azalt', () => onAuto(-1))}
      {hot(center + 120, AUTO.top - 4, 50, 38, 'Otomatik çekilme artır', () => onAuto(1))}
      {hot(center + AUTO.dx, AUTO.top - 2, AUTO.width, AUTO.height + 4, 'Otomatik hedefi yaz', onAutoEdit)}

      <span className="absolute rounded-lg" style={{ left: center + AMOUNT.dx, top: AMOUNT.top, width: AMOUNT.width, height: AMOUNT.height, background: '#0a2568' }} />
      <span
        className="pointer-events-none absolute flex items-center justify-center gap-1"
        style={{ left: center + AMOUNT.dx, top: AMOUNT.top, width: AMOUNT.width, height: AMOUNT.height }}
      >
        <span className="font-black text-white" style={{ fontSize: 26 }}>{format(amount)}</span>
        <span className="font-bold text-[#8fb6d8]" style={{ fontSize: 15 }}>Coinler</span>
      </span>
      {hot(center - 170, AMOUNT.top, 50, AMOUNT.height, 'Bahsi azalt', () => onAmount(-1), locked)}
      {hot(center + 120, AMOUNT.top, 50, AMOUNT.height, 'Bahsi artır', () => onAmount(1), locked)}

      <span className="absolute rounded-[20px]" style={{ left: center + ACTION.dx, top: ACTION.top, width: ACTION.width, height: ACTION.height, background: ACTION_FILL }} />
      <span
        className="pointer-events-none absolute flex flex-col items-center justify-center"
        style={{ left: center + ACTION.dx, top: ACTION.top, width: ACTION.width, height: ACTION.height }}
      >
        <span className="font-black leading-none" style={{ fontSize: 30, color: '#0b2f6e' }}>
          {label}{badge ? ` ${badge}` : ''}
        </span>
        {sub && (
          <span className="mt-1 font-bold" style={{ fontSize: 15, color: 'rgba(8,30,80,0.75)' }}>{sub}</span>
        )}
      </span>
      {disabled && (
        <span className="pointer-events-none absolute rounded-[20px] bg-[#05060f]/50" style={{ left: center + ACTION.dx, top: ACTION.top, width: ACTION.width, height: ACTION.height }} />
      )}
      {hot(center + ACTION.dx, ACTION.top, ACTION.width, ACTION.height, label, onAction, disabled)}
    </>
  );
}