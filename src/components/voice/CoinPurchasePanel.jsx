import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Coins, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCoins } from '@/lib/giftTone';
import CoinShopHero from '@/components/voice/coinShop/CoinShopHero';
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
    <div
      className="fixed inset-0 z-[320] flex flex-col text-white"
      style={{ background: 'radial-gradient(120% 62% at 50% -12%, #16304f 0%, #0a1424 46%, #05080e 100%)' }}
    >
      {/* Üstten süzülen altın ışık: mağaza holünün ambiyansı. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{ background: 'radial-gradient(62% 100% at 50% 0%, rgba(232,185,90,0.18), rgba(232,185,90,0) 72%)' }}
      />

      <header
        className="relative flex shrink-0 items-center gap-2 border-b px-3 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]"
        style={{
          borderColor: 'rgba(232,185,90,0.28)',
          background: 'linear-gradient(180deg, rgba(9,17,29,0.96), rgba(9,17,29,0.7))',
          backdropFilter: 'blur(10px)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#f4e1a1] transition-transform active:scale-95"
          style={{ background: 'rgba(232,185,90,0.12)', border: '1px solid rgba(232,185,90,0.4)' }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[15px] font-black leading-tight"
            style={{
              backgroundImage: 'linear-gradient(180deg, #fff6dc 0%, #e8b95a 62%, #b98d34 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Alışveriş Merkezi
          </p>
          <p className="truncate text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Coins Yükle</p>
        </div>
        <span
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black tabular-nums text-[#2b1602]"
          style={{
            background: 'linear-gradient(180deg, #ffeaa6 0%, #e8b95a 56%, #c99020 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85), 0 0 18px -4px rgba(232,185,90,0.8)',
          }}
        >
          <Coins className="h-4 w-4" /> {coins === null || coins === undefined ? '—' : formatCoins(coins)}
        </span>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-4xl">
          <CoinShopHero />
          <CoinPendingNotice request={pending} />

          {error && <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-center text-[11px] font-bold text-red-300">{error}</p>}

          {/* Paket rafı başlığı: iki yandan altın çizgi ve kıvılcımlarla mühürlenir. */}
          <div className="mt-5 flex items-center gap-2 px-1">
            <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(232,185,90,0), rgba(232,185,90,0.7))' }} />
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#E8B95A]" />
            <p className="shrink-0 text-[12px] font-black uppercase tracking-[0.18em] text-[#f4e1a1]">Coin Paketleri</p>
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#E8B95A]" />
            <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(232,185,90,0.7), rgba(232,185,90,0))' }} />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#E8B95A]" />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
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