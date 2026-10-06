import React from 'react';
import { colorForMult, format } from './rocketConfig';

// Tasarımdaki üst şerit: bakiye, son tur çarpanları ve tur numarası canlı yazılır.
const PILL_CENTERS = [281, 364, 455, 540];
const PILL_FILL = { blue: '#0a6fd6', green: '#3a8208', yellow: '#9a7400', red: '#a3261f' };
const PILL_TEXT = { blue: '#d8ecff', green: '#d9f2a8', yellow: '#ffe9a8', red: '#ffd0cb' };
const short = (value) => (Math.round((value || 0) * 100) / 100).toFixed(2);

/** Üst şerit: logo oyun merkezine döner, sağdaki iki simge defter ve yardım açar. */
export default function RocketLiveHeader({ coins, history, roundNo, onBack, onLedger, onHelp }) {
  const rows = (history || []).slice(0, PILL_CENTERS.length);

  return (
    <>
      <div
        className="absolute flex items-center justify-end rounded-lg px-2"
        style={{ left: 94, top: 212, width: 108, height: 46, background: '#12305c' }}
      >
        <span className="font-black text-[#cfe2ff]" style={{ fontSize: 25 }}>{format(coins)}</span>
      </div>

      {PILL_CENTERS.map((center, index) => {
        const row = rows[index];
        const tone = row ? colorForMult(row.crash_at) : 'blue';
        return (
          <div
            key={center}
            className="absolute flex items-center justify-center rounded-full"
            style={{ left: center - 45, top: 223, width: 90, height: 32, background: PILL_FILL[tone] }}
          >
            <span className="font-black" style={{ fontSize: 21, color: PILL_TEXT[tone] }}>
              {row ? short(row.crash_at) : '—'}
            </span>
          </div>
        );
      })}

      <div
        className="absolute flex items-center justify-center rounded-md"
        style={{ left: 278, top: 282, width: 140, height: 28, background: '#050b1e' }}
      >
        <span className="font-black text-[#cfe0f5]" style={{ fontSize: 17 }}>
          Turlar:<span className="text-[#5fc9ff]">{roundNo || 1}</span>
        </span>
      </div>

      <button
        type="button"
        aria-label="Oyun merkezine dön"
        onClick={onBack}
        className="absolute"
        style={{ left: 240, top: 0, width: 348, height: 96 }}
      />
      <button
        type="button"
        aria-label="Oyun defterini aç"
        onClick={onLedger}
        className="absolute"
        style={{ left: 632, top: 212, width: 58, height: 48 }}
      />
      <button
        type="button"
        aria-label="Nasıl oynanır"
        onClick={onHelp}
        className="absolute"
        style={{ left: 716, top: 212, width: 58, height: 48 }}
      />
    </>
  );
}