import React from 'react';
import { Coins } from 'lucide-react';
import { BANNER_BOX, BET_ROW, BUY_BOX, SPIN_BOX, boxStyle } from './luckyLayout';
import { formatCoins } from './luckyConfig';

/** Görselin kontrol paneli: ekranda yalnız görsel kalır, düğmeler dokunma alanıdır. */
export default function LuckyPanel({
  bet,
  coins,
  buyCost,
  spinning,
  busy,
  banner,
  onSpin,
  onBuy,
  onShiftBet,
  onMax,
  onToggleAuto,
}) {
  const poor = coins < buyCost;
  return (
    <>
      {/* Durum şeridi: görseldeki mesaj satırının üzerine canlı durum yazar. */}
      <div
        className="absolute flex items-center justify-center rounded-md bg-black/70 px-2"
        style={boxStyle(BANNER_BOX)}
      >
        <span className="truncate text-[min(3.2vw,0.75rem)] font-black tracking-wide text-slot-gold">{banner}</span>
      </div>

      {/* Görseldeki "Ücretsiz Döndürme Satın Al" ve SPIN düğmeleri. */}
      <button
        type="button"
        onClick={onBuy}
        disabled={spinning || busy || poor}
        aria-label="Ücretsiz döndürme satın al"
        className="absolute"
        style={boxStyle(BUY_BOX)}
      />
      <button
        type="button"
        onClick={onSpin}
        disabled={spinning || busy}
        aria-label="Döndür"
        className="absolute"
        style={boxStyle(SPIN_BOX)}
      />

      {/* Bahis satırı: görseldeki düğmeler dokunulur, bahis tutarı canlı gösterilir. */}
      <div className="absolute flex items-center gap-1.5" style={boxStyle(BET_ROW)}>
        <button
          type="button"
          onClick={onToggleAuto}
          aria-label="Otomatik döndürme"
          className="h-full w-[18%]"
        />
        <button
          type="button"
          onClick={() => onShiftBet(-1)}
          disabled={spinning}
          aria-label="Bahsi azalt"
          className="h-full w-[9%]"
        />

        <div className="slot-panel-3d flex h-full min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-slot-gold/40 px-2">
          <Coins className="h-[1.2em] w-[1.2em] shrink-0 text-slot-blue" />
          <span className="slot-digits truncate text-[min(3.4vw,0.85rem)] font-black text-white">{formatCoins(bet)}</span>
          <span className="shrink-0 text-[min(2.4vw,0.5rem)] font-black text-slot-gold">TOTAL BET</span>
        </div>

        <button
          type="button"
          onClick={() => onShiftBet(1)}
          disabled={spinning}
          aria-label="Bahsi artır"
          className="h-full w-[9%]"
        />
        <button
          type="button"
          onClick={onMax}
          disabled={spinning}
          aria-label="Maksimum bahis"
          className="h-full w-[14%]"
        />
      </div>
    </>
  );
}