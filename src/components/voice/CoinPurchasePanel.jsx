import { useEffect, useState } from 'react';
import { ChevronLeft, Coins, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCoins } from '@/lib/giftTone';
import CoinShopHero from '@/components/voice/coinShop/CoinShopHero';
import CoinShopInfoBox from '@/components/voice/coinShop/CoinShopInfoBox';
import CoinPackageCard from '@/components/voice/coinShop/CoinPackageCard';
import CoinShopFooter from '@/components/voice/coinShop/CoinShopFooter';

const formatTl = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR')} ₺`;

/** Coins Yükle: tam ekran coin mağazası — paket seçilir, satın alma talebi admin onayına düşer. */
export default function CoinPurchasePanel({ open, coins, onBack }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    base44.functions.invoke('coin-request', { action: 'packages' })
      .then((response) => { if (!cancelled) { setPackages(response.data?.packages || []); setError(''); } })
      .catch(() => { if (!cancelled) setError('Paketler yüklenemedi.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (open) { setNotice(''); setError(''); setSelected(null); }
  }, [open]);

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await base44.functions.invoke('coin-request', { action: 'create', package_id: selected.id });
      setNotice(`Satın alma talebin alındı — yönetici onayından sonra ${formatCoins(selected.coins)} coin hesabına yüklenecek.`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Talep gönderilemedi.');
    } finally {
      setBusy(false);
      setSelected(null);
    }
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

          {notice && <p className="mt-3 rounded-xl bg-emerald-500/15 px-3 py-2 text-center text-[11px] font-bold text-emerald-300">{notice}</p>}
          {error && <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-center text-[11px] font-bold text-red-300">{error}</p>}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#E8B95A]" />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {packages.map((pack) => (
                <CoinPackageCard key={pack.id} pack={pack} busy={busy} onBuy={setSelected} />
              ))}
            </div>
          )}

          <CoinShopFooter />
        </div>
      </div>

      <ConfirmDialog
        open={!!selected}
        onOpenChange={(next) => { if (!next) setSelected(null); }}
        title="Satın alma onayı"
        description={selected ? `${formatCoins(selected.coins)} Coins paketini ${formatTl(selected.price)} karşılığında satın almak istiyor musun? Coinler yönetici onayından sonra hesabına yüklenecek.` : ''}
        confirmText="Satın Al"
        onConfirm={buy}
      />
    </div>
  );
}