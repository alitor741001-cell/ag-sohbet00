import { useEffect, useState } from 'react';
import { BadgeCheck, Loader2, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { AGENCY_GOLD, agencyApi, dateText, formatMoney, formatShortDiamonds } from '@/lib/agency';

/**
 * Yönetim paneli — kota kazançları: ödendi/bekliyor durumunu yönetir.
 * İşaretleme yalnızca ilgili yayıncının kaydını günceller: panelin tamamı yeniden yüklenmez.
 */
export default function AdminRewardTable({ data = {}, onPatch }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState('');

  // Kazanç kaydı değiştiğinde (bu panelden ya da başka yerden) yalnızca o satır güncellenir.
  useEffect(() => subscribeEntity('QuotaReward', (event) => {
    const row = event.data || {};
    if (row.id) onPatch?.(row.id, row);
  }), [onPatch]);

  const toggle = async (reward) => {
    const paid = reward.status !== 'paid';
    setBusy(reward.id);
    try {
      const result = await agencyApi('admin-reward-paid', { reward_id: reward.id, paid });
      // Sunucudan dönen kayıt yerine yazılır: satır beklemeden "Ödendi" görünür.
      onPatch?.(reward.id, result.reward || { status: paid ? 'paid' : 'pending' });
      toast({ title: paid ? 'Ödeme yapıldı olarak işaretlendi' : 'Ödeme geri alındı' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const rewards = data.rewards || [];
  const pendingTotal = rewards.filter((row) => row.status !== 'paid').reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#F5C542]/30 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Bekleyen ödeme</p>
          <p className="text-lg font-black" style={{ color: AGENCY_GOLD }}>{formatMoney(pendingTotal)}</p>
        </div>
        <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Toplam kayıt</p>
          <p className="text-lg font-black text-white">{rewards.length}</p>
        </div>
        <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Ödenmiş toplam</p>
          <p className="text-lg font-black text-[#4ade80]">{formatMoney(rewards.filter((row) => row.status === 'paid').reduce((sum, row) => sum + (Number(row.amount) || 0), 0))}</p>
        </div>
      </div>

      {rewards.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center">
          <Wallet className="mx-auto h-6 w-6 text-white/30" />
          <p className="mt-2 text-sm text-white/50">Kota kazancı kaydı yok.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {rewards.map((reward) => (
            <div key={reward.id} className="flex flex-wrap items-center gap-3 border-b border-white/8 p-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{reward.user_name || 'Yayıncı'}</p>
                <p className="truncate text-[10px] text-white/45">
                  {formatShortDiamonds(reward.diamonds)} kota • {reward.agency_name || 'Ajans yok'} • {dateText(reward.completed_at || reward.created_date)}
                </p>
                {reward.transaction_id && <p className="truncate text-[10px] text-white/30">#{reward.transaction_id}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-black" style={{ color: reward.status === 'paid' ? '#4ade80' : AGENCY_GOLD }}>{formatMoney(reward.amount)}</p>
                <p className="text-[10px] text-white/40">ajans: {formatMoney(reward.agency_amount || 0)}</p>
              </div>
              <button
                onClick={() => toggle(reward)}
                disabled={busy === reward.id}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold disabled:opacity-60 ${reward.status === 'paid' ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/70'}`}
              >
                {busy === reward.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                {reward.status === 'paid' ? 'Ödendi' : 'Ödendi işaretle'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}