import React from 'react';
import { format, formatMult } from './rocketConfig';
import { ROCKET_LAYOUT } from './rocketLayout';

/**
 * Alt panel: görseldeki iki bahis panelinin butonları kullanılır.
 * Ek buton çizilmez; değerler görselin kendi rakam alanlarının üzerine yazılır,
 * buton yazısı yalnız durum değiştiğinde (çekil / iptal) üstüne eklenir.
 */
export default function RocketControls({ game }) {
  const { round, myBets, bet1, bet2, auto1, auto2, liveMult, placeBet, cashout, changeBet, changeAuto, status } = game;
  const phase = round?.status;
  const busy = status !== 'ready';

  const slots = [
    { index: 1, box: ROCKET_LAYOUT.slots[0], amount: bet1, auto: auto1, mine: myBets?.[1] },
    { index: 2, box: ROCKET_LAYOUT.slots[1], amount: bet2, auto: auto2, mine: myBets?.[2] },
  ];

  return (
    <>
      {slots.map(({ index, box, amount, auto, mine }) => {
        const canPlace = phase === 'betting' && !mine && !busy;
        const canPull = !!mine && !busy;
        const payout = Math.round((mine?.bet || amount) * (phase === 'running' ? liveMult : 1));

        let label = null;
        if (mine && phase === 'running') label = { text: `ÇEKİL ${format(payout)}`, cls: 'bg-emerald-500/90 text-white' };
        else if (mine && phase === 'betting') label = { text: 'İPTAL / GERİ AL', cls: 'bg-black/75 text-amber-200' };
        else if (phase === 'running') label = { text: 'TUR SÜRÜYOR', cls: 'bg-black/70 text-white/60' };

        return (
          <React.Fragment key={index}>
            <div
              className="absolute flex items-center justify-center rounded bg-black/70 font-mono text-[11px] font-black text-amber-200"
              style={box.autoValue}
            >
              {auto > 0 ? formatMult(auto) : 'KAPALI'}
            </div>
            <div
              className="absolute flex items-center justify-center rounded bg-black/70 font-mono text-[12px] font-black text-white"
              style={box.betValue}
            >
              {format(amount)}
            </div>

            <button
              type="button"
              onClick={() => changeAuto(index, -1)}
              disabled={!!mine || busy}
              aria-label={`${index}. alan otomatik çekilme azalt`}
              className="absolute rounded active:bg-white/15"
              style={box.autoMinus}
            />
            <button
              type="button"
              onClick={() => changeAuto(index, 1)}
              disabled={!!mine || busy}
              aria-label={`${index}. alan otomatik çekilme artır`}
              className="absolute rounded active:bg-white/15"
              style={box.autoPlus}
            />
            <button
              type="button"
              onClick={() => changeBet(index, -1)}
              disabled={!!mine || busy}
              aria-label={`${index}. alan bahis azalt`}
              className="absolute rounded active:bg-white/15"
              style={box.betMinus}
            />
            <button
              type="button"
              onClick={() => changeBet(index, 1)}
              disabled={!!mine || busy}
              aria-label={`${index}. alan bahis artır`}
              className="absolute rounded active:bg-white/15"
              style={box.betPlus}
            />
            <button
              type="button"
              onClick={() => (mine ? cashout(index) : placeBet(index))}
              disabled={busy || (!canPlace && !canPull)}
              aria-label={mine ? `${index}. alan bahisi geri çek` : `${index}. alan bahis yap`}
              className="absolute flex items-center justify-center rounded-lg active:bg-white/15"
              style={box.button}
            >
              {label && (
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-black tracking-wide ${label.cls}`}>
                  {label.text}
                </span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </>
  );
}