import { syncQuotaRewards, ensureQuotaTiers, periodKey } from './agency.ts';
import { quotaAgency } from './agencyOwnership.ts';

/** Kişisel kota, kayıt geçmişi ve sunucuda hesaplanan kazanç toplamları. */
export async function personalQuota(base44, account, cursor = null, knownTiers = null) {
  const { tiers: syncedTiers } = await syncQuotaRewards(base44, account.id);
  const query = { user_id: account.id, kind: { $ne: 'assistant' } };
  const [fresh, agency, page, totals, monthly] = await Promise.all([
    base44.asServiceRole.entities.User.get(account.id),
    quotaAgency(base44, account),
    base44.asServiceRole.entities.QuotaReward.filter(query, { sort: '-created_date', limit: 50, ...(cursor ? { cursor } : {}) }),
    base44.asServiceRole.entities.QuotaReward.aggregate({ query, groupBy: 'status', sum: ['amount'] }),
    base44.asServiceRole.entities.QuotaReward.aggregate({ query: { ...query, period: periodKey() }, sum: ['amount'], max: ['diamonds'] }),
  ]);
  const tiers = knownTiers || syncedTiers || await ensureQuotaTiers(base44);
  const period = periodKey();
  const month = fresh.diamond_month_period === period ? Number(fresh.diamond_month) || 0 : 0;
  const active = tiers.filter(tier => tier.active !== false);
  const sum = rows => Math.round(rows.reduce((total, row) => total + (Number(row.sum_amount) || 0), 0) * 100) / 100;
  const groups = totals.rows || [];
  return {
    profile: { name: fresh.username || fresh.full_name || 'Kullanıcı', avatar: fresh.avatar || '', member_id: fresh.member_id || '-', agency_role: fresh.agency_role || '', broadcaster_status: fresh.broadcaster_status || '' },
    agency: agency ? { name: agency.name, agency_id: agency.agency_id, logo: agency.logo || '', description: agency.description || '', rules: agency.rules || '', owner_name: agency.owner_name || '', member_count: agency.member_count || 0, commission_per_200k: Number(agency.commission_per_200k) || 3 } : null,
    diamonds: { month, total: Math.round((Number(fresh.gift_received_k) || 0) * 1000) },
    tiers: active, next_tier: active.find(tier => Number(tier.diamonds) > month) || null, period,
    rewards: page.items.map(row => ({ id: row.id, tier_id: row.tier_id, diamonds: Number(row.diamonds) || 0, amount: Number(row.amount) || 0, agency_amount: Number(row.agency_amount) || 0, status: row.status || 'pending', period: row.period || '', transaction_id: row.transaction_id || '', completed_at: row.completed_at || row.created_date })),
    has_more: page.has_more, next_cursor: page.next_cursor, monthly: monthly.rows?.[0] || { count: 0, sum_amount: 0, max_diamonds: 0 },
    totals: { pending: sum(groups.filter(row => row.status !== 'paid')), paid: sum(groups.filter(row => row.status === 'paid')), total: sum(groups), count: groups.reduce((n, row) => n + row.count, 0) },
  };
}