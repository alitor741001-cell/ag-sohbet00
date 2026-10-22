import React, { useState } from 'react';
import { Minus, Plus, Ticket } from 'lucide-react';
import { format, formatAuto } from '../rocket/rocketConfig';
import { OTOBUS_AUTO_PRESETS, OTOBUS_BET_PRESETS } from './otobusConfig';
import '@/components/games/otobus/OtobusBetPanel.css';

/** Tek bahis modülü: solda bahis/otomatik sekmeleri, sağda tek aksiyon düğmesi. */
export default function OtobusBetPanel({
  amount,
  auto,
  locked,
  action,
  onAction,
  onAmount,
  onAuto,
  onPreset,
  onAutoPreset,
}) {
  const [tab, setTab] = useState('bet');

  return (
    <div className="ob-module ob-premium-module">
      <div className="ob-module-main">
        <div className="ob-tabs">
          <button type="button" onClick={() => setTab('bet')} className={`ob-tab ${tab === 'bet' ? 'ob-tab-on' : ''}`}>
            BAHİS YAP
          </button>
          <button type="button" onClick={() => setTab('auto')} className={`ob-tab ${tab === 'auto' ? 'ob-tab-on' : ''}`}>
            Otomatik
          </button>
        </div>

        {tab === 'bet' ? (
          <>
            <div className="ob-wager">
              <button type="button" onClick={() => onAmount(-1)} disabled={locked} aria-label="Bahsi azalt" className="ob-step">
                <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
              <span className="ob-wager-value">
                <Ticket className="ob-ticket shrink-0" strokeWidth={1.8} />
                {format(amount)}
              </span>
              <button type="button" onClick={() => onAmount(1)} disabled={locked} aria-label="Bahsi artır" className="ob-step">
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
            </div>
            <div className="ob-presets">
              {OTOBUS_BET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onPreset(preset)}
                  disabled={locked}
                  className={`ob-preset ${amount === preset ? 'ob-preset-on' : ''}`}
                >
                  {format(preset)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="ob-wager">
              <button type="button" onClick={() => onAuto(-1)} aria-label="Otomatik çekilme azalt" className="ob-step">
                <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
              <span className={`ob-wager-value ${auto > 0 ? 'ob-wager-auto' : ''}`}>{formatAuto(auto)}</span>
              <button type="button" onClick={() => onAuto(1)} aria-label="Otomatik çekilme artır" className="ob-step">
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
            </div>
            <div className="ob-presets">
              {OTOBUS_AUTO_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onAutoPreset(preset)}
                  className={`ob-preset ${auto === preset ? 'ob-preset-on' : ''}`}
                >
                  {preset > 0 ? `${preset}x` : 'KAPALI'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tek aksiyon düğmesi: onaylanan kırmızı antrasit görünüm. */}
      <button
        type="button"
        onClick={onAction}
        disabled={action.disabled}
        className={`ob-act ob-act-${action.tone} ${action.live ? 'ob-act-live' : ''}`}
      >
        <span className="ob-act-label">{action.label}</span>
        {action.badge ? <span className="ob-act-badge">{action.badge}</span> : null}
        {action.sub ? <span className="ob-act-sub">{action.sub}</span> : null}
      </button>
    </div>
  );
}