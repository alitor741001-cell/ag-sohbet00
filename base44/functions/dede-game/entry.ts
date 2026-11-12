import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { personalGameResult } from '../../shared/personalGameOdds.ts';
import { recordLeaderWin } from '../../shared/gameLeaders.ts';
import { BET_LEVELS, LINES, SCATTER_MIN, playDede } from '../../shared/dedeEngine.ts';
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
  allowedLevels, commitPool, loadPool, poolRules, poolState, ratioOf, scaleSteps, settle, withPoolState,
} from '../../shared/gamePool.ts';

const GAME = 'dede';

// Oyun ekranının gördüğü bakiye ve bahis bilgisi.
function walletView(wallet, levels) {
  const bet = nearestBet(wallet.bet ?? DEFAULT_BET, levels);
  return {
    coins: wallet.coins ?? START_COINS,
    bet,
    lines: LINES,
    spins: wallet.spins ?? 0,
    // Satın alınan "15 çevirme hakkı" tur sayısı.
    session_spins: wallet.dede_session_spins ?? 0,
    // Biriken çarpan: 15 tur boyunca saklanır, tur bitince de çemberde görünür kalır.
    multiplier: Math.max(0, Math.round(wallet.dede_multiplier ?? 0)),
    // Bu oyunun kendi toplam kazancı: oyunlar birbirinden ayrı sayılır.
    total_won: wallet.total_won_dede ?? 0,
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
      if ((wallet.dede_session_spins ?? 0) > 0) {
        return Response.json({ error: 'Devam eden çevirme hakkın var.' }, { status: 400 });
      }
      const coins = wallet.coins ?? START_COINS;
      if (coins < price) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - price,
        bet,
        dede_session_spins: SESSION_SPINS,
        dede_multiplier: 0,
        pool_state: withPoolState(wallet, GAME, { session_value: price / SESSION_SPINS, bonus_won: 0 }),
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
      const sessionTurns = wallet.dede_session_spins ?? 0;
      const isFree = sessionTurns > 0;
      const cost = isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (!isFree && coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const state = poolState(wallet, GAME);
      // Turun coin değeri: ücretli turda toplam bahis, hak turunda hakkın tur başı bedeli.
      const value = isFree ? (state.session_value || sessionPrice(bet) / SESSION_SPINS) : stake;
      const carried = isFree ? Math.max(0, Math.round(wallet.dede_multiplier ?? 0)) : 0;
      const result = await personalGameResult(base44, user, GAME, () => playDede(bet, isFree, carried), (outcome) => outcome.total > 0, 1);
      const paid = settle(pool, rules, {
        value,
        rawMultiple: result.total / stake,
        free: isFree,
        bonusWon: isFree ? state.bonus_won || 0 : 0,
        paid: cost,
      });
      const total = paid.payout;
      const ratio = ratioOf(total, result.total);

      const sessionLeft = Math.max(0, sessionTurns - (isFree ? 1 : 0));
      const triggered = result.scatterCount >= SCATTER_MIN;
      const retrigger = triggered && isFree;
      const sessionBonus = triggered && !isFree;
      const nextSpins = retrigger ? sessionLeft + SESSION_SPINS : sessionBonus ? SESSION_SPINS : sessionLeft;
      // Skatterden gelen 15 hak, tetikleyen turun toplam bahsi değerindedir.
      const nextState = sessionBonus
        ? { session_value: stake, bonus_won: 0 }
        : nextSpins > 0 && isFree
          ? { ...state, session_value: value, bonus_won: (state.bonus_won || 0) + total }
          : {};
      const bigWin = total >= value * rules.medium_max && total > 0;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + total,
        bet,
        dede_free_spins: 0,
        dede_session_spins: nextSpins,
        dede_multiplier: sessionBonus || (isFree && sessionLeft <= 0) ? 0 : result.accumulated,
        pool_state: withPoolState(wallet, GAME, nextState),
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + total,
        total_won_dede: (wallet.total_won_dede ?? 0) + total,
        last_spin_at: new Date().toISOString(),
      });
      await commitPool(base44, pool, rules, { paid: cost, payout: total, tier: paid.tier, spin: true });

      waitUntil(mirrorRecord(base44, 'GameWallet', updated));
      if (total > 0) waitUntil(recordLeaderWin(base44, GAME, user, total).catch(() => null));

      return Response.json({
        ...walletView(updated, levels),
        grid: result.grid,
        steps: scaleSteps(result.steps, ratio),
        win: total,
        cost,
        scatter_count: result.scatterCount,
        session_bonus: sessionBonus,
        session_cost: 0,
        session_retrigger: retrigger,
        retrigger_spins: retrigger ? SESSION_SPINS : 0,
        capped: result.capped || paid.capped,
        win_tier: paid.tier,
        big_win: bigWin ? total : 0,
      });
    }

    return Response.json({ ...walletView(wallet, levels), grid: null, steps: [], win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}