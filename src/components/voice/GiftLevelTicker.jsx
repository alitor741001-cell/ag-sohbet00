import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { giftLevelOf, giftNextThreshold, GIFT_MAX_LEVEL } from '@/lib/userLevels';
import { K_UNIT } from '@/lib/giftTone';
import GiftLevelDisplay from '@/components/voice/GiftLevelDisplay';

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

  return <GiftLevelDisplay level={level} percent={percent} sending={sending} next={next} remainingCoins={remainingCoins} />;
}