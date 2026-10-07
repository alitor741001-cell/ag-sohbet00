import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { giftLevelOf, giftNextThreshold, GIFT_MAX_LEVEL } from '@/lib/userLevels';
import { K_UNIT, formatCoins } from '@/lib/giftTone';

/** K değerinin coin karşılığı: 1 K = 1.000 coin. */
const coinsForK = (kValue) => Math.max(0, Math.round((Number(kValue) || 0) * K_UNIT));

// İki satır yer değiştirme süresi: 7 saniye atış, 7 saniye alış seviyesi.
const ROTATE_MS = 7000;

/**
 * Hediye Tahtası üst şeridi: atış ve alış seviyesinin ilerlemesi bar olarak gösterilir.
 * 7 saniyede bir satır değişir; bar, odada hediye atıldıkça/alındıkça canlı ilerler (giftTick).
 */
export default function GiftLevelTicker({ giftTick = 0 }) {
  const [totals, setTotals] = useState(null);
  const [step, setStep] = useState(0);

  // Panel açıldığında ve her hediye hareketinde toplamlar tazelenir.
  useEffect(() => {
    let alive = true;
    base44.auth.me()
      .then((me) => {
        if (alive) setTotals({ sent: Number(me?.gift_sent_k) || 0, received: Number(me?.gift_received_k) || 0 });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [giftTick]);

  useEffect(() => {
    const timer = setInterval(() => setStep((value) => (value + 1) % 2), ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  if (!totals) return null;

  const sending = step === 0;
  const kTotal = sending ? totals.sent : totals.received;
  const level = giftLevelOf(kTotal);
  const next = level >= GIFT_MAX_LEVEL ? null : level + 1;
  // Seviye basamağı: mevcut seviyenin eşiği ile bir üst seviyenin eşiği arasındaki ilerleme.
  const baseK = level <= 0 ? 0 : giftNextThreshold(level - 1);
  const nextK = next === null ? kTotal : giftNextThreshold(level);
  const span = nextK - baseK;
  const percent = next === null || span <= 0 ? 100 : Math.min(100, Math.max(0, Math.round(((kTotal - baseK) / span) * 100)));
  const remainingCoins = next === null ? 0 : Math.max(0, coinsForK(nextK - kTotal));

  return (
    <div key={step} className="neon-entrance flex items-center gap-2 rounded-xl bg-white/[0.06] px-2.5 py-2">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#6af5d9] to-[#45d6c8] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-[10px] font-black tabular-nums text-white/85">
        {sending ? 'Atış' : 'Alış'} LVL {level}
      </span>
      <span className="shrink-0 text-[10px] font-semibold tabular-nums text-white/55">
        {next === null ? 'En üst seviye' : `Kalan ${formatCoins(remainingCoins)} coin`}
      </span>
    </div>
  );
}