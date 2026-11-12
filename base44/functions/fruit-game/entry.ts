import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { recordLeaderWin } from '../../shared/gameLeaders.ts';
import { personalGameResult } from '../../shared/personalGameOdds.ts';
import { BET_LEVELS, FREE_SPINS, LINES, SCATTER_MIN, playFruit } from '../../shared/fruitEngine.ts';
import {
  DEFAULT_BET,
  SESSION_SPINS,
  START_COINS,
  clampBet,
  loadWallet,
  nearestBet,
  sessionPrice,
} from '../../shared/gameWallet.ts';
import {
  allowedLevels, commitPool, loadPool, nextBonusState, poolRules, poolState, ratioOf, scaleSteps, settle, spinKind, withPoolState,
} from '../../shared/gamePool.ts';

const GAME = 'fruit';

// Oyun ekranının gördüğü bakiye ve bahis bilgisi.
function walletView(wallet, levels) {
  const bet = nearestBet(wallet.bet ?? DEFAULT_BET, levels);
  return {
    coins: wallet.coins ?? START_COINS,
    bet,
    lines: LINES,
    spins: wallet.spins ?? 0,
    // Bedava turlar (skatter hediyesi) ve satın alınan çevirme hakkı ayrı sayılır.
    free_spins: wallet.free_spins ?? 0,
    session_spins: wallet.session_spins ?? 0,
    total_won: wallet.total_won_fruit ?? 0,
    no_limit: false,
    session_price: sessionPrice(bet),
    session_size: SESSION_SPINS,
    bet_levels: levels,
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'state';
    const [wallet, pool] = await Promise.all([loadWallet(base44, user), loadPool(base44, GAME)]);
    const rules = poolRules(pool);
    const levels = allowedLevels(rules, BET_LEVELS, LINES);
    const pickBet = () => clampBet(body.bet, levels, nearestBet(wallet.bet ?? DEFAULT_BET, levels));

    // 15 çevirme hakkı: bedel bir kez havuza bölünerek girer, turlar bu bedel üzerinden ödenir.
    if (action === 'session') {
      const bet = pickBet();
      const price = sessionPrice(bet);
      if ((wallet.session_spins ?? 0) > 0) {
        return Response.json({ error: 'Devam eden çevirme hakkın var.' }, { status: 400 });
      }
      const coins = wallet.coins ?? START_COINS;
      if (coins < price) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const state = poolState(wallet, GAME);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - price,
        bet,
        session_spins: SESSION_SPINS,
        pool_state: withPoolState(wallet, GAME, { ...state, session_value: price / SESSION_SPINS, bonus_won: 0 }),
      });
      await commitPool(base44, pool, rules, { paid: price });
      return Response.json({ ...walletView(updated, levels), grid: null, steps: [], win: 0 });
    }

    if (action === 'bet') {
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet: pickBet() });
      return Response.json({ ...walletView(updated, levels), grid: null, steps: [], win: 0 });
    }

    if (action === 'spin') {
      const bet = pickBet();
      const stake = bet * LINES;
      const freeTurns = wallet.free_spins ?? 0;
      const sessionTurns = wallet.session_spins ?? 0;
      const state = poolState(wallet, GAME);
      const kind = spinKind(state, { sessionTurns, freeTurns, stake, sessionFallback: sessionPrice(bet) / SESSION_SPINS });
      const cost = kind.isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (!kind.isFree && coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const result = await personalGameResult(base44, user, GAME, () => playFruit(bet), (outcome) => outcome.total > 0, 1);
      const paid = settle(pool, rules, {
        value: kind.value,
        rawMultiple: result.total / stake,
        free: kind.isFree,
        bonusWon: kind.isFree ? state.bonus_won || 0 : 0,
        paid: cost,
      });
      const total = paid.payout;
      // 4 ve üzeri muz hem bonus öder hem bedava tur verir; ilk ızgarada sayılır.
      const freeTrigger = result.initial.flat().filter((symbol) => symbol === 'banana').length >= SCATTER_MIN;
      const sessionLeft = Math.max(0, sessionTurns - (kind.inSession ? 1 : 0));
      const freeBefore = Math.max(0, freeTurns - (kind.inFree ? 1 : 0));
      const freeLeft = freeBefore + (freeTrigger ? FREE_SPINS : 0);
      const nextState = nextBonusState(state, { kind, payout: total, sessionLeft, freeLeft, freeBefore, granted: freeTrigger });
      const bigWin = total > 0 && total >= kind.value * rules.medium_max;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + total,
        bet,
        free_spins: freeLeft,
        session_spins: sessionLeft,
        pool_state: withPoolState(wallet, GAME, nextState),
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + total,
        total_won_fruit: (wallet.total_won_fruit ?? 0) + total,
        last_spin_at: new Date().toISOString(),
      });
      await commitPool(base44, pool, rules, { paid: cost, payout: total, tier: paid.tier, spin: true });

      waitUntil(mirrorRecord(base44, 'GameWallet', updated));
      if (total > 0) waitUntil(recordLeaderWin(base44, GAME, user, total).catch(() => null));

      return Response.json({
        ...walletView(updated, levels),
        grid: result.grid,
        steps: scaleSteps(result.steps, ratioOf(total, result.total)),
        win: total,
        cost,
        free_trigger: freeTrigger,
        win_tier: paid.tier,
        big_win: bigWin ? total : 0,
      });
    }

    return Response.json({ ...walletView(wallet, levels), grid: null, steps: [], win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}