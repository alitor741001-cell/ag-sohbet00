import { withLimitRetry } from './retryLimit.ts';
import { mirrorRecord } from './supabaseMirror.ts';
import { waitUntil } from 'base44:runtime';

// Conditional updates make retries safe across concurrent function instances.
export async function creditRocketBet(base44, bet) {
  if (bet.status !== 'cashed' || bet.settlement_version !== 1 || bet.payout_credited) return bet;
  const wallets = await withLimitRetry(() =>
    base44.asServiceRole.entities.GameWallet.filter({ user_id: bet.user_id }, '-created_date', 1));
  const wallet = wallets[0];
  if (!wallet) throw new Error('Oyun cüzdanı bulunamadı.');
  // The receipt and increment are committed together: an interrupted response
  // can be retried without paying twice or overwriting the other slot's payout.
  await withLimitRetry(() => base44.asServiceRole.entities.GameWallet.updateMany(
    { id: wallet.id, rocket_paid_bets: { $ne: bet.id } },
    {
      $inc: {
        coins: bet.payout,
        total_won: bet.cancelled ? 0 : bet.payout,
        total_won_rocket: bet.cancelled ? 0 : bet.payout,
      },
      $addToSet: { rocket_paid_bets: bet.id },
    }
  ));
  await withLimitRetry(() => base44.asServiceRole.entities.RocketBet.update(bet.id, { payout_credited: true }));
  // Supabase aynası: nakde çevrilen bahis son haliyle arka planda yazılır.
  waitUntil(mirrorRecord(base44, 'RocketBet', { ...bet, payout_credited: true }));
  return { ...bet, payout_credited: true };
}

export async function settleRocketBet(base44, bet, multiplier, cancelled = false) {
  if (bet.status !== 'active') return creditRocketBet(base44, bet);
  const changes = {
    status: 'cashed', cashout_at: multiplier, payout: Math.round(bet.bet * multiplier),
    cancelled, settlement_version: 1, payout_credited: false,
  };
  const result = await withLimitRetry(() => base44.asServiceRole.entities.RocketBet.updateMany(
    { id: bet.id, status: 'active' }, { $set: changes }
  ));
  const settled = result.updated ? { ...bet, ...changes } : await base44.asServiceRole.entities.RocketBet.get(bet.id);
  return creditRocketBet(base44, settled);
}