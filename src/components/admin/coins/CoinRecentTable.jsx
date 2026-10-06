import { useState } from 'react';
import { ArrowUpRight, Coins, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

/** Gönderim tarihi ve saati: 04.10.2026 / 14:32 */
const formatWhen = (iso) => {
  if (!iso) return { date: '', time: '' };
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return { date: '', time: '' };
  return {
    date: value.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: value.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
  };
};

const HEAD = 'pb-2 text-[9px] font-bold uppercase tracking-wide text-white/40';

/** Son işlemler: coin yükleme kayıtları, satır bazında geri çekme. */
export default function CoinRecentTable({ grants = [], loading, onReverted }) {
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmSingle, setConfirmSingle] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const visible = showAll ? grants : grants.slice(0, 5);

  const revert = async (grant) => {
    setBusyId(grant.id);
    try {
      const response = await base44.functions.invoke('coin-admin', { action: 'revert', grant_id: grant.id });
      const reverted = Number(response.data?.reverted) || grant.amount;
      toast({ title: `${reverted.toLocaleString('tr-TR')} coin geri çekildi`, description: `${grant.user_name} hesabından düşüldü.` });
      onReverted?.();
    } catch (error) {
      toast({ title: 'Geri çekilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  // Tek kaydı listeden siler (bakiye değişmez).
  const removeOne = async () => {
    const grant = confirmSingle;
    if (!grant) return;
    setBusyId(grant.id);
    try {
      await base44.functions.invoke('coin-admin', { action: 'deleteGrant', grant_id: grant.id });
      toast({ title: 'Kayıt silindi', description: `${grant.user_name || 'Kullanıcı'} işlemi listeden kaldırıldı.` });
      onReverted?.();
    } catch (error) {
      toast({ title: 'Silinemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
      setConfirmSingle(null);
    }
  };

  // Tüm işlem kayıtlarını siler: yalnız liste temizlenir, coinler geri alınmaz.
  const clearAll = async () => {
    setClearing(true);
    try {
      const response = await base44.functions.invoke('coin-admin', { action: 'clearGrants' });
      const deleted = Number(response.data?.deleted) || grants.length;
      toast({ title: 'Son işlemler silindi', description: `${deleted} kayıt kaldırıldı.` });
      onReverted?.();
    } catch (error) {
      toast({ title: 'Silinemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#13131E] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-white">Son İşlemler</p>
        <div className="flex shrink-0 items-center gap-2">
          {grants.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={clearing}
              className="flex h-7 items-center gap-1 rounded-lg border border-red-500/50 px-2 text-[10px] font-bold text-red-300 transition-transform active:scale-95 disabled:opacity-50"
            >
              {clearing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Tümünü Sil
            </button>
          )}
          {grants.length > 5 && (
            <button type="button" onClick={() => setShowAll((value) => !value)} className="text-[11px] font-bold text-[#A855F7]">
              {showAll ? 'Daha Az' : 'Tümünü Gör >'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#A855F7]" />
        </div>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-xs text-white/50">Henüz coin yüklemesi yapılmadı.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className={HEAD}>Kullanıcı</th>
                <th className={HEAD}>İşlem Türü</th>
                <th className={HEAD}>Miktar</th>
                <th className={HEAD}>Tarih</th>
                <th className={`${HEAD} text-right`}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((grant) => {
                const when = formatWhen(grant.created_date);
                return (
                  <tr key={grant.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                          {grant.user_avatar ? (
                            <Image src={grant.user_avatar} alt={grant.user_name} className="h-full w-full" fittingType="fill" draggable={false} />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white/70">
                              {String(grant.user_name || '?').trim().charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span className="max-w-[74px] truncate text-[11px] font-bold text-white">{grant.user_name || 'Kullanıcı'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-2">
                      <span className="flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-emerald-400">
                        <ArrowUpRight className="h-3 w-3 shrink-0" /> Coin Yükleme
                      </span>
                    </td>
                    <td className="py-2.5 pr-2">
                      <span className="flex items-center gap-1 whitespace-nowrap text-[11px] font-bold tabular-nums text-[#F5B31A]">
                        <Coins className="h-3.5 w-3.5 shrink-0" /> + {Number(grant.amount || 0).toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2">
                      <p className="whitespace-nowrap text-[10px] text-white/60">{when.date}</p>
                      <p className="text-[10px] font-semibold text-white/40">{when.time}</p>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {grant.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => revert(grant)}
                            disabled={busyId === grant.id}
                            className="whitespace-nowrap rounded-md border border-red-500/60 px-2 py-1 text-[10px] font-bold text-red-400 transition-transform active:scale-95 disabled:opacity-50"
                          >
                            {busyId === grant.id ? 'İşleniyor' : 'Geri Çek'}
                          </button>
                        ) : (
                          <span className="whitespace-nowrap text-[10px] font-semibold text-white/35">Geri çekildi</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setConfirmSingle(grant)}
                          disabled={busyId === grant.id}
                          aria-label="Kaydı sil"
                          className="rounded-md border border-white/15 bg-white/5 p-1.5 text-white/55 transition-transform active:scale-95 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmSingle}
        onOpenChange={(next) => { if (!next) setConfirmSingle(null); }}
        title="Kaydı sil"
        description={`${confirmSingle?.user_name || 'Kullanıcı'} için ${Number(confirmSingle?.amount || 0).toLocaleString('tr-TR')} coin yükleme kaydı listeden silinecek. Kullanıcının bakiyesi etkilenmez.`}
        confirmText="Sil"
        onConfirm={removeOne}
      />

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Son işlemleri sil"
        description={`${grants.length} kayıt tamamen silinecek. Kullanıcıların coin bakiyeleri etkilenmez.`}
        confirmText="Tümünü Sil"
        onConfirm={clearAll}
      />
    </div>
  );
}