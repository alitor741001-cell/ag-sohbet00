import { useState } from 'react';
import { ArrowUpRight, Coins, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { useToast } from '@/components/ui/use-toast';

/** Gönderim tarihi ve saati: 04.10.2026 14:32 */
const formatWhen = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const amountText = (value) => `+ ${Number(value || 0).toLocaleString('tr-TR')}`;

/** Son işlemler: coin yükleme kayıtları, satır bazında geri çekme. */
export default function CoinRecentTable({ grants = [], loading, onReverted }) {
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [busyId, setBusyId] = useState(null);
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

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1E1B39] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-white">Son İşlemler</p>
        {grants.length > 5 && (
          <button type="button" onClick={() => setShowAll((value) => !value)} className="text-[11px] font-bold text-[#9C8CFF]">
            {showAll ? 'Daha Az' : 'Tümünü Gör >'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#8E43FF]" />
        </div>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-xs text-white/50">Henüz coin yüklemesi yapılmadı.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((grant) => (
            <div key={grant.id} className="rounded-xl border border-white/10 bg-[#171432] p-3">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                  {grant.user_avatar ? (
                    <Image src={grant.user_avatar} alt={grant.user_name} className="h-full w-full" fittingType="fill" draggable={false} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white/70">
                      {String(grant.user_name || '?').trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{grant.user_name || 'Kullanıcı'}</p>
                  <p className="flex items-center gap-1 truncate text-[10px] font-semibold text-emerald-400">
                    <ArrowUpRight className="h-3 w-3 shrink-0" /> Coin Yükleme
                    <span className="text-white/35">• {formatWhen(grant.created_date)}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-bold tabular-nums text-amber-300">
                    <Coins className="h-3.5 w-3.5" /> {amountText(grant.amount)}
                  </p>
                  {grant.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => revert(grant)}
                      disabled={busyId === grant.id}
                      className="mt-1 text-[11px] font-bold text-[#9C8CFF] disabled:opacity-50"
                    >
                      {busyId === grant.id ? 'Geri çekiliyor...' : 'Geri Çek'}
                    </button>
                  ) : (
                    <p className="mt-1 text-[11px] font-semibold text-white/40">Geri çekildi</p>
                  )}
                </div>
              </div>
              {grant.note && <p className="mt-2 truncate text-[11px] text-white/45">{grant.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}