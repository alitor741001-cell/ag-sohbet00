import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  drawSpin,
  nearestBet,
  BET_LEVELS,
  DEFAULT_BET,
  FREE_SPIN_COUNT,
  BUY_COST_MULTIPLE,
  MULTIPLIER_VALUES,
  SCATTER_TRIGGER,
  LINES,
} from '../../shared/luckyEngine.ts';

const START_COINS = 100000;
const ADMIN_COINS = 500000;
const LEGACY_MAX_COINS = 1000000000;

async function loadWallet(base44, user) {
  const found = await base44.asServiceRole.entities.GameWallet.filter({ user_id: user.id }, '-created_date', 1);
  const isAdmin = user.role === 'admin';
  if (found[0]) {
    if ((found[0].coins ?? 0) > LEGACY_MAX_COINS) {
      return base44.asServiceRole.entities.GameWallet.update(found[0].id, {
        coins: isAdmin ? ADMIN_COINS : START_COINS,
      });
    }
    return found[0];
  }
  return base44.asServiceRole.entities.GameWallet.create({
    user_id: user.id,
    user_name: user.full_name || '',
    coins: isAdmin ? ADMIN_COINS : START_COINS,
    bet: 100,
    rocket_bet: 500,
    rocket_bet_2: 500,
    lines: 50,
    spins: 0,
    grand: 0,
    total_won: 0,
    lucky_bet: DEFAULT_BET,
    lucky_free_spins: 0,
    lucky_mult: [],
  });
}

function stateOf(wallet) {
  const bet = nearestBet(wallet.lucky_bet ?? DEFAULT_BET);
  return {
    coins: wallet.coins ?? 0,
    bet,
    freeSpins: wallet.lucky_free_spins ?? 0,
    multipliers: wallet.lucky_mult ?? [],
    levels: BET_LEVELS,
    lines: LINES,
    freeSpinCount: FREE_SPIN_COUNT,
    scatterTrigger: SCATTER_TRIGGER,
    multiplierValues: MULTIPLIER_VALUES,
    buyCost: bet * BUY_COST_MULTIPLE,
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      if (e?.status === 401 || e?.response?.status === 401) user = null;
      else throw e;
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'state';

    if (action === 'setBet') {
      const bet = nearestBet(body.bet);
      const wallet = await loadWallet(base44, user);
      if ((wallet.lucky_bet ?? DEFAULT_BET) !== bet) {
        await base44.asServiceRole.entities.GameWallet.update(wallet.id, { lucky_bet: bet });
      }
      return Response.json({ ...stateOf(wallet), bet, buyCost: bet * BUY_COST_MULTIPLE });
    }

    if (action === 'buyFreeSpins') {
      const wallet = await loadWallet(base44, user);
      const cost = nearestBet(wallet.lucky_bet ?? DEFAULT_BET) * BUY_COST_MULTIPLE;
      const debit = await base44.asServiceRole.entities.GameWallet.updateMany(
        { id: wallet.id, coins: { $gte: cost } },
        { $inc: { coins: -cost }, $set: { lucky_free_spins: FREE_SPIN_COUNT, lucky_mult: [] } }
      );
      if (!debit.updated) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const updated = await loadWallet(base44, user);
      return Response.json({ ...stateOf(updated), bought: FREE_SPIN_COUNT, spent: cost });
    }

    if (action === 'spin') {
      const wallet = await loadWallet(base44, user);
      const bet = nearestBet(wallet.lucky_bet ?? DEFAULT_BET);
      const freeSpins = wallet.lucky_free_spins ?? 0;
      const free = freeSpins > 0;

      // Ücretsiz dönüşte bahis düşülmez; normal dönüşte atomik olarak düşülür.
      if (!free) {
        const debit = await base44.asServiceRole.entities.GameWallet.updateMany(
          { id: wallet.id, coins: { $gte: bet } },
          { $inc: { coins: -bet } }
        );
        if (!debit.updated) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      }

      const result = drawSpin({
        totalBet: bet,
        freeSpin: free,
        accumulator: wallet.lucky_mult || [],
      });

      let remaining = freeSpins - (free ? 1 : 0) + result.freeSpinsAwarded;
      if (remaining < 0) remaining = 0;
      // Ücretsiz dönüş bittiğinde biriken çarpanlar sıfırlanır.
      const multipliers = remaining > 0 ? result.multipliers : [];

      if (result.totalWin > 0) {
        await base44.asServiceRole.entities.GameWallet.updateMany(
          { id: wallet.id },
          { $inc: { coins: result.totalWin } }
        );
      }
      await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        lucky_free_spins: remaining,
        lucky_mult: multipliers,
      });

      const updated = await loadWallet(base44, user);
      return Response.json({
        ...stateOf(updated),
        grid: result.grid,
        multiValues: result.multiValues,
        wins: result.wins,
        lineWin: result.lineWin,
        scatterCount: result.scatterCount,
        freeSpinsAwarded: result.freeSpinsAwarded,
        collected: result.collected,
        multiplierPaid: result.multiplierPaid,
        totalWin: result.totalWin,
        free,
      });
    }

    // state
    const wallet = await loadWallet(base44, user);
    return Response.json(stateOf(wallet));
  } catch (error) {
    console.error('Lucky Olympus operation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}