import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { recordLeaderWin } from '../../shared/gameLeaders.ts';
import { personalGameResult } from '../../shared/personalGameOdds.ts';
import { BET_LEVELS, LINES } from '../../shared/fruitEngine.ts';
import { CHEST_MAX, CHEST_MULTIPLE, FREE_SPINS, JACKPOT_MULTIPLE, playElimin } from '../../shared/eliminEngine.ts';
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

// ELİMİNSLOT: meyve motoru + zar (jackpot), sandık (birikim) ve tavuk (bedava tur).
// Bütün ödemeler oyunun kendi havuzundan, bahisle orantılı yapılır.
const GAME = 'elimin';

// Sandık birikimi coin olarak saklanır: kazanıldığı turun değerine göre (eski kayıtlarda eski hesap).
const chestValueOf = (wallet, state, bet) => Math.round(state.chest_value ?? (wallet.elimin_chests ?? 0) * bet * 10);

function walletView(wallet, levels, rules) {
  const bet = nearestBet(wallet.bet ?? DEFAULT_BET, levels);
  const stake = bet * LINES;
  const state = poolState(wallet, GAME);
  return {
    coins: wallet.coins ?? START_COINS,
    bet,
    lines: LINES,
    spins: wallet.spins ?? 0,
    total_won: wallet.total_won_elimin ?? 0,
    chests: wallet.elimin_chests ?? 0,
    chest_value: chestValueOf(wallet, state, bet),
    // Jackpot: dört zarın bu bahiste ödeyeceği tutar (bahisle orantılı).
    jackpot: Math.round(Math.min(JACKPOT_MULTIPLE * rules.kBase, rules.max_win) * stake),
    free_spins: wallet.elimin_free_spins ?? 0,
    session_spins: wallet.elimin_session_spins ?? 0,
    session_price: sessionPrice(bet),
    session_size: SESSION_SPINS,
    bet_levels: levels,
  };
}

export default async function (req: Request) {
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
    const state = poolState(wallet, GAME);

    // 15 çevirme hakkı: bedel bir kez havuza bölünerek girer, turlar bu bedel üzerinden ödenir.
    if (action === 'session') {
      const bet = pickBet();
      const price = sessionPrice(bet);
      if ((wallet.elimin_session_spins ?? 0) > 0) {
        return Response.json({ error: 'Devam eden çevirme hakkın var.' }, { status: 400 });
      }
      const coins = wallet.coins ?? START_COINS;
      if (coins < price) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - price,
        bet,
        elimin_session_spins: SESSION_SPINS,
        pool_state: withPoolState(wallet, GAME, { ...state, session_value: price / SESSION_SPINS, bonus_won: 0 }),
      });
      await commitPool(base44, pool, rules, { paid: price });
      return Response.json({ ...walletView(updated, levels, rules), grid: null, steps: [], win: 0 });
    }

    // Sandık barı dolunca birikim havuzdan ödenir, bar sıfırlanır.
    if (action === 'chest') {
      const bet = pickBet();
      const chests = wallet.elimin_chests ?? 0;
      if (chests < CHEST_MAX) return Response.json({ error: 'Sandık barı henüz dolmadı.' }, { status: 400 });
      const amount = Math.max(0, Math.min(chestValueOf(wallet, state, bet), pool.balance ?? 0));
      const { chest_value: _spent, ...rest } = state;
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: (wallet.coins ?? START_COINS) + amount,
        bet,
        elimin_chests: 0,
        pool_state: withPoolState(wallet, GAME, { ...rest, chest_value: 0 }),
        total_won: (wallet.total_won ?? 0) + amount,
        total_won_elimin: (wallet.total_won_elimin ?? 0) + amount,
        last_spin_at: new Date().toISOString(),
      });
      await commitPool(base44, pool, rules, { payout: amount });
      waitUntil(mirrorRecord(base44, 'GameWallet', updated));
      if (amount > 0) waitUntil(recordLeaderWin(base44, GAME, user, amount).catch(() => null));
      return Response.json({ ...walletView(updated, levels, rules), grid: null, steps: [], win: 0, chest_win: amount });
    }

    if (action === 'bet') {
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet: pickBet() });
      return Response.json({ ...walletView(updated, levels, rules), grid: null, steps: [], win: 0 });
    }

    if (action === 'spin') {
      const bet = pickBet();
      const stake = bet * LINES;
      const freeTurns = wallet.elimin_free_spins ?? 0;
      const sessionTurns = wallet.elimin_session_spins ?? 0;
      const kind = spinKind(state, { sessionTurns, freeTurns, stake, sessionFallback: sessionPrice(bet) / SESSION_SPINS });
      const cost = kind.isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const result = await personalGameResult(base44, user, GAME, () => playElimin(bet),
        (outcome) => outcome.total > 0 || outcome.jackpotTrigger, 1);
      const rawMultiple = result.total / stake + (result.jackpotTrigger ? JACKPOT_MULTIPLE : 0);
      const paid = settle(pool, rules, {
        value: kind.value,
        rawMultiple,
        free: kind.isFree,
        bonusWon: kind.isFree ? state.bonus_won || 0 : 0,
        paid: cost,
      });
      const payout = paid.payout;
      // Ödeme küme kazancı ve jackpot arasında ham oranlarıyla paylaştırılır.
      const ratio = ratioOf(payout, rawMultiple * stake);
      const win = Math.round(result.total * ratio);
      const jackpotWin = payout - win;

      // Sandıklar barda birikir: kazanıldığı turun değeriyle coin olarak saklanır.
      const before = wallet.elimin_chests ?? 0;
      const chests = Math.min(CHEST_MAX, before + result.chestGain);
      const k = kind.isFree ? rules.kFree : rules.kBase;
      const chestValue = chestValueOf(wallet, state, bet) + Math.round((chests - before) * CHEST_MULTIPLE * kind.value * k);

      const sessionLeft = Math.max(0, sessionTurns - (kind.inSession ? 1 : 0));
      const freeBefore = Math.max(0, freeTurns - (kind.inFree ? 1 : 0));
      const freeLeft = freeBefore + (result.freeTrigger ? FREE_SPINS : 0);
      const nextState = {
        ...nextBonusState(state, { kind, payout, sessionLeft, freeLeft, freeBefore, granted: result.freeTrigger }),
        chest_value: chestValue,
      };
      const bigWin = win > 0 && win >= kind.value * rules.medium_max;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + payout,
        bet,
        elimin_free_spins: freeLeft,
        elimin_chests: chests,
        elimin_session_spins: sessionLeft,
        pool_state: withPoolState(wallet, GAME, nextState),
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + payout,
        total_won_elimin: (wallet.total_won_elimin ?? 0) + payout,
        last_spin_at: new Date().toISOString(),
      });
      await commitPool(base44, pool, rules, { paid: cost, payout, tier: paid.tier, spin: true });

      waitUntil(mirrorRecord(base44, 'GameWallet', updated));
      if (payout > 0) waitUntil(recordLeaderWin(base44, GAME, user, payout).catch(() => null));

      return Response.json({
        ...walletView(updated, levels, rules),
        grid: result.grid,
        steps: scaleSteps(result.steps, ratio),
        win,
        cost,
        chest_gain: result.chestGain,
        free_trigger: result.freeTrigger,
        free_gain: result.freeTrigger ? FREE_SPINS : 0,
        jackpot_trigger: result.jackpotTrigger,
        jackpot_win: jackpotWin,
        win_tier: paid.tier,
        big_win: bigWin ? win : 0,
      });
    }

    return Response.json({ ...walletView(wallet, levels, rules), grid: null, steps: [], win: 0 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}