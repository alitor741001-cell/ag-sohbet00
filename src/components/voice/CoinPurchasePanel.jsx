import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Coins, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCoins } from '@/lib/giftTone';
import CoinShopHero from '@/components/voice/coinShop/CoinShopHero';
import CoinShopInfoBox from '@/components/voice/coinShop/CoinShopInfoBox';
import CoinPackageCard from '@/components/voice/coinShop/CoinPackageCard';
import CoinShopFooter from '@/components/voice/coinShop/CoinShopFooter';
import CoinPendingNotice from '@/components/voice/coinShop/CoinPendingNotice';
import CoinPaymentPage from '@/components/voice/coinShop/CoinPaymentPage';

// Kart başına seçilebilecek en fazla adet.
const MAX_QUANTITY = 20;

/** Adet seçimini toplam coin ve tutara çevirir: ödeme sayfası tek paket gibi gösterir. */
const withQuantity = (pack, quantity) => quantity > 1
  ? { ...pack, qty: quantity, coins: pack.coins * quantity, price: pack.price * quantity }
  : { ...pack, qty: 1 };

/** Coins Yükle: tam ekran coin mağazası — kart seçilince ödeme sayfası açılır, başvuru admin onayına düşer. */
export default function CoinPurchasePanel({ open, coins, onBack }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [payFor, setPayFor] = useState(null);
  // Paket kimliğine göre adet: sepet gibi çoklu alım.
  const [qty, setQty] = useState({});
  const [error, setError] = useState('');

  const loadPending = useCallback(async () => {
    const response = await base44.functions.invoke('coin-request', { action: 'mine' }).catch(() => null);
    setPending(response?.data?.pending || null);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    setPayFor(null);
    setQty({});
    base44.functions.invoke('coin-request', { action: 'packages' })
      .then((response) => { if (!cancelled) setPackages(response.data?.packages || []); })
      .catch(() => { if (!cancelled) setError('Paketler yüklenemedi.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    loadPending();
    return () => { cancelled = true; };
  }, [open, loadPending]);

  // "Ödeme yaptım" sonrası: ödeme sayfası kapanır, bekleyen başvuru bilgisi görünür.
  const handleSubmitted = async () => {
    setPayFor(null);
    await loadPending();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[320] flex flex-col bg-[#05070a] text-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#E8B95A]/20 px-3 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition-transform active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-black">Coins Yükle</p>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#E8B95A]/15 px-3 py-1.5 text-xs font-black tabular-nums text-[#E8B95A]">
          <Coins className="h-4 w-4" /> {coins === null || coins === undefined ? '—' : formatCoins(coins)}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-4xl">
          <CoinShopHero />
          <CoinShopInfoBox />
          <CoinPendingNotice request={pending} />

          {error && <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-center text-[11px] font-bold text-red-300">{error}</p>}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#E8B95A]" />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {packages.map((pack) => (
                <CoinPackageCard
                  key={pack.id}
                  pack={pack}
                  qty={qty[pack.id] || 1}
                  onQty={(value) => setQty((prev) => ({ ...prev, [pack.id]: Math.min(MAX_QUANTITY, Math.max(1, value)) }))}
                  onBuy={() => setPayFor(withQuantity(pack, qty[pack.id] || 1))}
                />
              ))}
            </div>
          )}

          <CoinShopFooter />
        </div>
      </div>

      {payFor && (
        <CoinPaymentPage pack={payFor} onClose={() => setPayFor(null)} onSubmitted={handleSubmitted} />
      )}
    </div>
  );
}