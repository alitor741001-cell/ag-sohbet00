import React from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, Ticket } from 'lucide-react';
import { format, formatAuto } from './rocketConfig';
import RocketPushButton from './RocketPushButton';

// Butonun rengi durumdan gelir: çekiliş yeşil, iptal/kayıp kırmızı, bekleyen haller sönük.
function pushTone(label, disabled, tone) {
  if (label === 'ÇEK' || label === 'ÇEKİLDİ') return 'green';
  if (label === 'İPTAL' || label === 'KAYBETTİ') return 'red';
  if (disabled) return 'mute';
  return tone === 'gold' ? 'gold' : 'cyan';
}

/**
 * Bahis podu: otomatik çekilme satırı, bahis satırı ve tek aksiyon butonu.
 * Sol pod camgöbeği, sağ pod altın temalıdır.
 */
export default function RocketBetPanel({
  tone,
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
  const gold = tone === 'gold';

  return (
    <div className={`rk-pod ${gold ? 'rk-pod-gold' : 'rk-pod-blue'}`}>
      <span aria-hidden="true" className="rk-pod-led" />

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
          <p
            className={`rk-value-strong underline decoration-dotted underline-offset-2 ${
              auto > 0 ? (gold ? 'rk-gold' : 'rk-cyan') : 'rk-off'
            }`}
          >
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
          <span className="rk-value-strong truncate text-white">{format(amount)}</span>
        </div>
        <button type="button" className="rk-ctrl" disabled={locked} onClick={() => onAmount(1)} aria-label="Bahsi artır">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Konsol düğmesi: çekilişte yeşil ve nabızlı. */}
      <RocketPushButton
        tone={pushTone(label, disabled, tone)}
        label={label}
        badge={badge}
        sub={sub}
        disabled={disabled}
        pulse={label === 'ÇEK'}
        onClick={onAction}
      />
    </div>
  );
}