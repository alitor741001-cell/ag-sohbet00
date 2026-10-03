import React from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, Ticket } from 'lucide-react';
import { format, formatAuto } from './rocketConfig';

/**
 * Görseldeki bahis paneli: otomatik çekilme satırı, bahis satırı ve tek aksiyon
 * butonu. Sol alan mavi, sağ alan altın temalıdır.
 */
export default function RocketBetPanel({
  tone,
  amount,
  auto,
  locked,
  label,
  sub,
  disabled,
  onAmount,
  onAuto,
  onAutoEdit,
  onAction,
}) {
  const gold = tone === 'gold';

  return (
    <div className={`rk-panel flex-1 ${gold ? 'rk-panel-gold' : 'rk-panel-blue'}`}>
      <div className="flex items-center gap-1">
        <button type="button" className="rk-ctrl" onClick={() => onAuto(-1)} aria-label="Otomatik çekilme azalt">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {/* Hedef elle de yazılabilir: bahis oynandıktan sonra da değiştirilebilir. */}
        <button
          type="button"
          className="min-w-0 flex-1 rounded-lg py-0.5 text-center active:brightness-125"
          onClick={onAutoEdit}
          aria-label="Otomatik çekilme hedefini yaz"
        >
          <p className="rk-label">OTOMATİK ÇEKİLME</p>
          <p className={`rk-value underline decoration-dotted underline-offset-2 ${auto > 0 ? (gold ? 'text-[#ffd35c]' : 'text-[#7fe4ff]') : 'text-white/40'}`}>
            {formatAuto(auto)}
          </p>
        </button>
        <button type="button" className="rk-ctrl" onClick={() => onAuto(1)} aria-label="Otomatik çekilme artır">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button type="button" className="rk-ctrl" disabled={locked} onClick={() => onAmount(-1)} aria-label="Bahsi azalt">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <Ticket className="h-3.5 w-3.5 shrink-0 text-[#ffb800]" />
          <span className="rk-value truncate text-white">{format(amount)}</span>
        </div>
        <button type="button" className="rk-ctrl" disabled={locked} onClick={() => onAmount(1)} aria-label="Bahsi artır">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        type="button"
        className={`rk-action ${gold ? 'rk-action-gold' : 'rk-action-blue'}`}
        disabled={disabled}
        onClick={onAction}
      >
        <span>{label}</span>
        {sub && <span className="rk-action-sub">{sub}</span>}
      </button>
    </div>
  );
}