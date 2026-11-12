import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { recordLeaderWin } from '../../shared/gameLeaders.ts';
import { personalGameResult } from '../../shared/personalGameOdds.ts';
import { BET_LEVELS, LINES, spinSekerli } from '../../shared/sekerliEngine.ts';
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
  allowedLevels, commitPool, loadPool, nextBonusState, poolRules, poolState, ratioOf, settle, spinKind, withPoolState,
} from '../../shared/gamePool.ts';

const GAME = 'sekerli';

// Oyun ekranının gördüğü bakiye, bahis ve çevirme hakkı bilgisi.
function walletView(wallet, levels) {
  const bet = nearestBet(wallet.bet ?? DEFAULT_BET, levels);
  return {
    coins: wallet.coins ?? START_COINS,
    bet,
    lines: LINES,
    spins: wallet.spins ?? 0,
    total_won: wallet.total_won_sekerli ?? 0,
    session_spins: wallet.sekerli_session_spins ?? 0,
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
      if ((wallet.sekerli_session_spins ?? 0) > 0) {
        return Response.json({ error: 'Devam eden çevirme hakkın var.' }, { status: 400 });
      }
      const coins = wallet.coins ?? START_COINS;
      if (coins < price) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - price,
        bet,
        sekerli_session_spins: SESSION_SPINS,
        pool_state: withPoolState(wallet, GAME, { session_value: price / SESSION_SPINS, bonus_won: 0 }),
      });
      await commitPool(base44, pool, rules, { paid: price });
      return Response.json({ ...walletView(updated, levels), steps: [], final_grid: null, win: 0 });
    }

    if (action === 'bet') {
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet: pickBet() });
      return Response.json({ ...walletView(updated, levels), steps: [], final_grid: null, win: 0 });
    }

    if (action === 'spin') {
      const bet = pickBet();
      const stake = bet * LINES;
      const sessionTurns = wallet.sekerli_session_spins ?? 0;
      const state = poolState(wallet, GAME);
      const kind = spinKind(state, { sessionTurns, freeTurns: 0, stake, sessionFallback: sessionPrice(bet) / SESSION_SPINS });
      const cost = kind.isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const result = await personalGameResult(base44, user, GAME, () => spinSekerli(), (outcome) => outcome.units > 0, 1);
      const raw = result.units * bet;
      const paid = settle(pool, rules, {
        value: kind.value,
        rawMultiple: raw / stake,
        free: kind.isFree,
        bonusWon: kind.isFree ? state.bonus_won || 0 : 0,
        paid: cost,
      });
      const win = paid.payout;
      const ratio = ratioOf(win, raw);
      const sessionLeft = Math.max(0, sessionTurns - (kind.inSession ? 1 : 0));
      const nextState = nextBonusState(state, { kind, payout: win, sessionLeft, freeLeft: 0, freeBefore: 0, granted: false });

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + win,
        bet,
        sekerli_session_spins: sessionLeft,
        pool_state: withPoolState(wallet, GAME, nextState),
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + win,
        total_won_sekerli: (wallet.total_won_sekerli ?? 0) + win,
        last_spin_at: new Date().toISOString(),
      });
      await commitPool(base44, pool, rules, { paid: cost, payout: win, tier: paid.tier, spin: true });

      waitUntil(mirrorRecord(base44, 'GameWallet', updated));
      if (win > 0) waitUntil(recordLeaderWin(base44, GAME, user, win).catch(() => null));

      return Response.json({
        ...walletView(updated, levels),
        // Ekran adım kazancını satır katsayısı x bahis ile hesaplar: katsayılar ödenen tutara orantılanır.
        steps: result.steps.map((step) => ({ ...step, units: step.units * ratio })),
        final_grid: result.final_grid,
        win,
        cost,
        win_tier: paid.tier,
      });
    }

    return Response.json({ ...walletView(wallet, levels), steps: [], final_grid: null, win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}