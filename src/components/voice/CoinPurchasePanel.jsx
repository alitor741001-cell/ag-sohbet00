import { useEffect, useState } from 'react';
import { ChevronLeft, Coins, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCoins } from '@/lib/giftTone';

const formatTl = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR')} ₺`;

/** Coins Yükle: paket seçimi — seçilen paket admin onayına düşer, onayda coin yüklenir. */
export default function CoinPurchasePanel({ coins, onBack }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    base44.functions.invoke('coin-request', { action: 'packages' })
      .then((response) => { if (!cancelled) setPackages(response.data?.packages || []); })
      .catch(() => { if (!cancelled) setError('Paketler yüklenemedi.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await base44.functions.invoke('coin-request', { action: 'create', package_id: selected.id });
      setNotice(`${selected.name} paketi için başvurun alındı — onaylandığında ${formatCoins(selected.coins)} coin hesabına yüklenecek.`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Başvuru gönderilemedi.');
    } finally {
      setBusy(false);
      setSelected(null);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-black text-white">Coins Yükle</p>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-black tabular-nums text-amber-300">
          <Coins className="h-4 w-4" /> {coins === null || coins === undefined ? '—' : formatCoins(coins)}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
        </div>
      ) : packages.length === 0 ? (
        <p className="rounded-xl bg-white/5 px-3 py-3 text-center text-xs text-white/50">Şu anda yüklenebilir paket yok.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {packages.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => { setNotice(''); setError(''); setSelected(pack); }}
              disabled={busy}
              className="rounded-2xl border border-amber-300/25 bg-white/5 px-3 py-3 text-left transition-transform active:scale-95 disabled:opacity-50"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-300/80">{pack.name}</p>
              <p className="mt-1 flex items-center gap-1 text-base font-black tabular-nums text-white">
                <Coins className="h-4 w-4 text-amber-300" /> {formatCoins(pack.coins)}
              </p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-400">{formatTl(pack.price)}</p>
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-[10px] leading-tight text-white/45">
        Paketi seçtiğinde başvurun yöneticilere düşer; onaylandığında coinler hesabına yüklenir.
      </p>

      {error && <p className="mt-2 rounded-xl bg-red-500/15 px-3 py-2 text-center text-[11px] font-bold text-red-300">{error}</p>}
      {notice && <p className="mt-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-center text-[11px] font-bold text-emerald-300">{notice}</p>}

      <ConfirmDialog
        open={!!selected}
        onOpenChange={(next) => { if (!next) setSelected(null); }}
        title="Coins yükleme başvurusu"
        description={selected ? `${selected.name} paketi için başvuru oluşturulacak: ${formatCoins(selected.coins)} coin — ${formatTl(selected.price)}. Coinler yönetici onayından sonra hesabına yüklenir.` : ''}
        confirmText="Başvur"
        onConfirm={submit}
      />
    </div>
  );
}