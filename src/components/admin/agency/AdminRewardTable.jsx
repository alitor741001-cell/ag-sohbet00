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
    if (event.type === 'delete') return;
    const row = event.data || {};
    if (row.id) onPatch?.(row.id, row);
  }), [onPatch]);

  // Kart bazlı işaretleme: kişinin kartta toplanan tüm kota kayıtları birlikte güncellenir.
  const toggle = async (card) => {
    const paid = card.paidCount < card.tiers;
    setBusy(card.key);
    try {
      const result = await agencyApi('admin-reward-paid', { user_id: card.user_id, paid });
      // Sunucudan dönen kayıtlar yerine yazılır: kart beklemeden "Ödendi" görünür.
      (result.ids || []).forEach((id) => onPatch?.(id, { status: paid ? 'paid' : 'pending' }));
      toast({ title: paid ? 'Ödeme yapıldı olarak işaretlendi' : 'Ödeme geri alındı' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const rewards = data.rewards || [];
  const pendingTotal = rewards.filter((row) => row.status !== 'paid').reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  // Aynı yayıncının kademe kayıtları tek kartta toplanır: kota tamamlandıkça
  // karttaki elmas ve tutar toplamı kendiliğinden büyür.
  const cards = [];
  const cardByUser = new Map();
  rewards.forEach((reward) => {
    const key = reward.user_id || reward.id;
    let card = cardByUser.get(key);
    if (!card) {
      card = { key, user_id: reward.user_id || '', user_name: reward.user_name || 'Yayıncı', agency_name: reward.agency_name || '', diamonds: 0, amount: 0, agency_amount: 0, tiers: 0, paidCount: 0, last: '' };
      cardByUser.set(key, card);
      cards.push(card);
    }
    card.diamonds += Number(reward.diamonds) || 0;
    card.amount += Number(reward.amount) || 0;
    card.agency_amount += Number(reward.agency_amount) || 0;
    card.tiers += 1;
    if (reward.status === 'paid') card.paidCount += 1;
    const stamp = reward.completed_at || reward.created_date || '';
    if (stamp && (!card.last || new Date(stamp) > new Date(card.last))) card.last = stamp;
  });

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
          {cards.map((card) => {
            const allPaid = card.paidCount === card.tiers;
            return (
              <div key={card.key} className="flex flex-wrap items-center gap-3 border-b border-white/8 p-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{card.user_name}</p>
                  <p className="truncate text-[10px] text-white/45">
                    {formatShortDiamonds(card.diamonds)} kota • {card.agency_name || 'Ajans yok'} • {dateText(card.last)}
                  </p>
                  <p className="truncate text-[10px] text-white/30">
                    {card.tiers} kota kaydı{allPaid ? ' • tamamı ödendi' : ` • ${card.tiers - card.paidCount} bekliyor`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: allPaid ? '#4ade80' : AGENCY_GOLD }}>{formatMoney(card.amount)}</p>
                  <p className="text-[10px] text-white/40">ajans: {formatMoney(card.agency_amount)}</p>
                </div>
                <button
                  onClick={() => toggle(card)}
                  disabled={busy === card.key}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold disabled:opacity-60 ${allPaid ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/70'}`}
                >
                  {busy === card.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                  {allPaid ? 'Ödendi' : 'Ödendi işaretle'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}