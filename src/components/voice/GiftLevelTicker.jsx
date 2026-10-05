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
    <div
      key={step}
      className={`neon-entrance mb-3 rounded-xl border px-3 py-2 ${sending ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-orange-400/40 bg-orange-500/10'}`}
    >
      <div className="flex items-center gap-2">
        {sending ? <Gift className="h-4 w-4 shrink-0 text-emerald-300" /> : <Heart className="h-4 w-4 shrink-0 text-orange-300" />}
        <p className="min-w-0 flex-1 text-[11px] font-black leading-tight text-white">
          {sending ? 'Atış LVL' : 'Hediye Alma LVL'} <span className="tabular-nums text-amber-300">{level}</span>
          {next !== null && <> → <span className="tabular-nums text-amber-300">{next}</span></>}
        </p>
        <span className="shrink-0 text-[11px] font-bold tabular-nums text-white/60">{percent}%</span>
      </div>
      {/* Seviye çubuğu: gereken hediye tamamlandıkça canlı dolar. */}
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div
          className={`h-full rounded-full transition-all duration-500 ${sending ? 'bg-emerald-400' : 'bg-orange-400'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] font-semibold leading-tight text-white/70">
        {next === null ? 'En üst seviye' : <>Kalan <span className="tabular-nums">{formatCoins(remainingCoins)}</span> coin</>}
      </p>
    </div>
  );
}