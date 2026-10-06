import React from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { format, formatAuto } from './rocketConfig';

/**
 * Bahis modülü: üstte otomatik çekilme hedefi (chevron'larla değişir, dokununca
 * elle yazılır), ortada bahis tutarı, altta büyük mavi aksiyon butonu.
 */
export default function RocketBetPanel({
  amount,
  auto,
  locked,
  label,
  badge,
  sub,
  disabled,
  onAmount,
  onAuto,
  onAutoEdit,
  onAction,
}) {
  return (
    <div className="rk-frame flex min-w-0 flex-1 flex-col gap-1 rounded-xl p-1.5">
      <div className="flex items-center gap-1">
        <button type="button" className="rk-ctrl" onClick={() => onAuto(-1)} aria-label="Otomatik çekilme azalt">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {/* Hedef elle de yazılabilir: bahis oynandıktan sonra da değiştirilebilir. */}
        <button
          type="button"
          className={`rk-plate min-w-0 flex-1 rounded-lg py-1 text-center active:brightness-125 ${auto > 0 ? 'text-[#5fc9ff]' : 'text-white/40'}`}
          onClick={onAutoEdit}
          aria-label="Otomatik çekilme hedefini yaz"
        >
          <span className="text-[13px] font-black">{formatAuto(auto)}</span>
        </button>
        <button type="button" className="rk-ctrl" onClick={() => onAuto(1)} aria-label="Otomatik çekilme artır">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button type="button" className="rk-ctrl" disabled={locked} onClick={() => onAmount(-1)} aria-label="Bahsi azalt">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="rk-plate flex min-w-0 flex-1 items-baseline justify-center gap-1 rounded-lg py-1.5">
          <span className="truncate text-[12px] font-black text-white">{format(amount)}</span>
          <span className="shrink-0 text-[9px] font-bold text-white/55">Coinler</span>
        </div>
        <button type="button" className="rk-ctrl" disabled={locked} onClick={() => onAmount(1)} aria-label="Bahsi artır">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <button type="button" className="rk-action" disabled={disabled} onClick={onAction}>
        <span>{label}</span>
        {/* Kazanç çarpanı, yatırılan coinin yanında rozet olarak görünür. */}
        {badge && (
          <span className="rounded bg-black/25 px-1 text-[10px] font-black leading-tight">{badge}</span>
        )}
        {sub && <span className="rk-action-sub">{sub}</span>}
      </button>
    </div>
  );
}