import { useCallback, useEffect, useState } from 'react';
import { Check, Coins, Loader2, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const formatCoins = (value) => Math.max(0, Math.round(Number(value) || 0)).toLocaleString('tr-TR');
const formatTl = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR')} ₺`;
const formatWhen = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
};

const STATUS = {
  pending: { label: 'Onay bekliyor', tone: 'text-amber-300' },
  approved: { label: 'Onaylandı', tone: 'text-emerald-400' },
  rejected: { label: 'Reddedildi', tone: 'text-red-300' },
};

/** Coins Başvuru Listesi: kullanıcıların coin yükleme talepleri, onayla/reddet. */
export default function CoinRequestList({ onReviewed }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await base44.functions.invoke('coin-admin', { action: 'requests', limit: 40 });
      setRequests(response.data?.requests || []);
    } catch {
      // Liste alınamazsa son bilinen başvurular kalır.
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Yeni başvuru geldiği anda liste kendiliğinden güncellenir — sayfayı yenilemek gerekmez.
  useEffect(() => {
    load();
    const unsubscribe = base44.entities.CoinRequest.subscribe(() => load(true));
    const refresh = () => { if (document.visibilityState === 'visible') load(true); };
    const timer = setInterval(refresh, 20000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      unsubscribe?.();
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  const review = async (request, action) => {
    setBusyId(request.id);
    try {
      const response = await base44.functions.invoke('coin-admin', { action, request_id: request.id });
      const coins = Number(response.data?.coins) || 0;
      toast({
        title: action === 'approve' ? `${formatCoins(request.coins)} coin yüklendi` : 'Başvuru reddedildi',
        description: action === 'approve' ? `${request.user_name} • yeni bakiye ${formatCoins(coins)} coin` : `${request.user_name} hesabına coin yüklenmedi.`,
      });
      await load();
      onReviewed?.();
    } catch (error) {
      toast({ title: 'İşlem tamamlanamadı', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  // Tüm başvuruları siler: yalnız liste temizlenir, onaylanan coinler geri alınmaz.
  const clearAll = async () => {
    setClearing(true);
    try {
      const response = await base44.functions.invoke('coin-admin', { action: 'clearRequests' });
      const deleted = Number(response.data?.deleted) || requests.length;
      toast({ title: 'Başvurular silindi', description: `${deleted} başvuru listeden kaldırıldı.` });
      await load();
      onReviewed?.();
    } catch (error) {
      toast({ title: 'Silinemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#13131E] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Coins className="h-4 w-4 text-[#F5B31A]" />
        <p className="text-[11px] font-bold text-white/60">Coins Başvuru Listesi</p>
        <span className="ml-auto rounded-full bg-amber-300/15 px-2.5 py-0.5 text-[10px] font-black text-amber-300">
          {pendingCount} bekleyen
        </span>
        {requests.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={clearing}
            className="flex h-7 shrink-0 items-center gap-1 rounded-lg border border-red-500/50 px-2 text-[10px] font-bold text-red-300 transition-transform active:scale-95 disabled:opacity-50"
          >
            {clearing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Tümünü Sil
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-white/60" />
        </div>
      ) : requests.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-[#0B0B14] px-3 py-3 text-center text-[11px] text-white/45">Henüz coin başvurusu yok.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => {
            const state = STATUS[request.status] || STATUS.pending;
            const busy = busyId === request.id;
            return (
              <div key={request.id} className="rounded-lg border border-white/10 bg-[#0B0B14] p-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                    {request.user_avatar ? (
                      <Image src={request.user_avatar} alt={request.user_name} className="h-full w-full" fittingType="fill" draggable={false} />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
                        {String(request.user_name || '?').trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{request.user_name || 'Kullanıcı'}</p>
                    <p className="truncate text-[10px] text-white/45">Kimlik: {request.member_id || '—'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-[#F5B31A]">{formatCoins(request.coins)}</p>
                    <p className="text-[10px] font-semibold text-white/45">{formatTl(request.price)}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <p className={`min-w-0 flex-1 truncate text-[10px] font-bold ${state.tone}`}>
                    {state.label} • {request.package_name || 'Paket'} • {formatWhen(request.created_date)}
                  </p>
                  {request.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => review(request, 'reject')}
                        disabled={busy}
                        className="flex h-9 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 text-[11px] font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Reddet
                      </button>
                      <button
                        type="button"
                        onClick={() => review(request, 'approve')}
                        disabled={busy}
                        className="flex h-9 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-[11px] font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Onayla
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Başvuru listesini sil"
        description={`${requests.length} başvuru listeden tamamen silinecek. Onaylanmış coinler kullanıcıların hesabından düşülmez.`}
        confirmText="Tümünü Sil"
        onConfirm={clearAll}
      />
    </div>
  );
}