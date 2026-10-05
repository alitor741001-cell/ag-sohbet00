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
 * Hediye Tahtası üst şeridi: atış (hediye gönderme) ve hediye alma seviyesinin ilerlemesi.
 * 7 saniyede bir dönüşümlü gösterilir: mevcut seviye → sonraki seviye, toplam ve gereken coin.
 */
export default function GiftLevelTicker() {
  const [totals, setTotals] = useState(null);
  const [step, setStep] = useState(0);

  // Panel her açıldığında güncel hediye K toplamları okunur.
  useEffect(() => {
    let alive = true;
    base44.auth.me()
      .then((me) => {
        if (alive) setTotals({ sent: Number(me?.gift_sent_k) || 0, received: Number(me?.gift_received_k) || 0 });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setStep((value) => (value + 1) % 2), ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  if (!totals) return null;

  const sending = step === 0;
  const kTotal = sending ? totals.sent : totals.received;
  const level = giftLevelOf(kTotal);
  const next = level >= GIFT_MAX_LEVEL ? null : level + 1;
  const totalCoins = coinsForK(kTotal);
  const requiredCoins = next === null ? 0 : coinsForK(giftNextThreshold(level));

  return (
    <div
      key={step}
      className={`neon-entrance mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 ${sending ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-orange-400/40 bg-orange-500/10'}`}
    >
      {sending ? <Gift className="h-4 w-4 shrink-0 text-emerald-300" /> : <Heart className="h-4 w-4 shrink-0 text-orange-300" />}
      <div className="min-w-0 flex-1 text-[11px] leading-tight">
        <p className="font-black text-white">
          {sending ? 'Atış LVL' : 'Hediye Alma LVL'} <span className="tabular-nums text-amber-300">{level}</span>
          {next !== null && <> → <span className="tabular-nums text-amber-300">{next}</span></>}
        </p>
        <p className="font-semibold text-white/70">
          Toplam <span className="tabular-nums">{formatCoins(totalCoins)}</span> coin ·{' '}
          {next === null ? 'en üst seviye' : <>Gereken <span className="tabular-nums">{formatCoins(requiredCoins)}</span> coin</>}
        </p>
      </div>
    </div>
  );
}