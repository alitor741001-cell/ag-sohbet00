import { useEffect, useState } from 'react';
import { ChevronLeft, Coins, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCoins } from '@/lib/giftTone';
import BankTransferInfo from '@/components/voice/coinShop/BankTransferInfo';

const formatTl = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR')} ₺`;

/** Ödeme sayfası: havale bilgileri ve "Ödeme yaptım" ile başvuruyu admin paneli + Telegram'a düşürür. */
export default function CoinPaymentPage({ pack, onClose, onSubmitted }) {
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    base44.entities.PaymentMethod.filter({ enabled: true }, 'sort_order', 50)
      .then((items) => {
        if (cancelled) return;
        const found = (items || []).find(
          (m) => m.type === 'bank_transfer' && m.iban && m.bank_name && m.account_holder
        );
        setBank(found || null);
      })
      .catch(() => { if (!cancelled) setBank(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await base44.functions.invoke('coin-request', { action: 'create', package_id: pack.id, quantity: pack.qty || 1 });
      onSubmitted();
    } catch (err) {
      setError(err?.response?.data?.error || 'Başvuru gönderilemedi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[340] flex flex-col bg-[#05070a] text-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#E8B95A]/20 px-3 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition-transform active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-black">Ödeme Yap</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3 rounded-2xl border border-[#E8B95A]/40 bg-[#0d1424] px-3.5 py-3">
            <Coins className="h-7 w-7 shrink-0 text-[#E8B95A]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white">{formatCoins(pack.coins)} Coins</p>
              <p className="text-[11px] text-white/60">{pack.qty > 1 ? `${pack.qty} adet paket` : 'Seçtiğin paket'}</p>
            </div>
            <p className="text-lg font-black tabular-nums text-[#E8B95A]">{formatTl(pack.price)}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#E8B95A]" />
            </div>
          ) : (
            <BankTransferInfo bank={bank} pack={pack} />
          )}

          {error && (
            <p className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-center text-[11px] font-bold text-red-300">{error}</p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#E8B95A]/20 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            onClick={submit}
            disabled={busy || !bank}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E8B95A] to-[#C5963B] text-sm font-black text-black transition-transform active:scale-95 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Ödeme yaptım
          </button>
        </div>
      </div>
    </div>
  );
}