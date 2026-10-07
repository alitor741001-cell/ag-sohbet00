import { useEffect, useState } from 'react';
import { Gift, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { giftLevelOf, giftNextThreshold, GIFT_MAX_LEVEL } from '@/lib/userLevels';
import { K_UNIT, formatCoins } from '@/lib/giftTone';

/** K değerinin coin karşılığı: 1 K = 1.000 coin. */
const coinsForK = (kValue) => Math.max(0, Math.round((Number(kValue) || 0) * K_UNIT));

// İki satır yer değiştirme süresi: 7 saniye atış, 7 saniye hediye alma.
const ROTATE_MS = 7000;

/**
 * Hediye Tahtası üst şeridi: atış ve hediye alma seviyesinin ilerlemesi bar olarak gösterilir.
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
    <div key={step} className="neon-entrance rounded-xl bg-white/[0.06] px-2.5 py-1.5">
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-md bg-[#45d6c8] px-1 text-[10px] font-black tabular-nums text-[#0d2b28]">
          {level}
        </span>
        {/* Seviye çubuğu: gereken hediye tamamlandıkça canlı dolar. */}
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6af5d9] to-[#45d6c8] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-md bg-white/15 px-1 text-[10px] font-black tabular-nums text-white/80">
          {next ?? level}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-white/60">
        {sending ? <Gift className="h-3 w-3 shrink-0 text-amber-300" /> : <Heart className="h-3 w-3 shrink-0 text-orange-300" />}
        <span className="shrink-0 font-black text-white/80">{sending ? 'Atış LVL' : 'Hediye Alma LVL'}</span>
        <span className="truncate">
          {next === null ? 'En üst seviye' : `Kalan ${formatCoins(remainingCoins)} coin`}
        </span>
      </p>
    </div>
  );
}