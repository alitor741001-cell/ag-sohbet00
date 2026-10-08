import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { BET_LEVELS, BIG_WIN_MULTIPLE, FREE_SPINS, LINES, playDede } from '../../shared/dedeEngine.ts';
import { DEFAULT_BET, FREE_GRANT, START_COINS, clampBet, loadWallet, nearestBet } from '../../shared/gameWallet.ts';

// Oyun ekranının gördüğü bakiye ve bahis bilgisi.
function walletView(wallet) {
  return {
    coins: wallet.coins ?? START_COINS,
    bet: nearestBet(wallet.bet ?? DEFAULT_BET, BET_LEVELS),
    lines: LINES,
    spins: wallet.spins ?? 0,
    free_spins: wallet.dede_free_spins ?? 0,
    total_won: wallet.total_won ?? 0,
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (error) {
      user = null;
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'state';
    const wallet = await loadWallet(base44, user);

    // Hediye: bedava tur yokken 15 ücretsiz tur verilir; üst üste biriktirilemez.
    if (action === 'free') {
      if ((wallet.dede_free_spins ?? 0) > 0) {
        return Response.json({ ...walletView(wallet), grid: null, steps: [], win: 0 });
      }
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { dede_free_spins: FREE_GRANT });
      return Response.json({ ...walletView(updated), grid: null, steps: [], win: 0 });
    }

    if (action === 'bet') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet });
      return Response.json({ ...walletView(updated), grid: null, steps: [], win: 0 });
    }

    if (action === 'spin') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const stake = bet * LINES;
      // Bedava tur hakkı varsa tur bedava oynanır.
      const isFree = (wallet.dede_free_spins ?? 0) > 0;
      const cost = isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (!isFree && coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const result = playDede(bet, isFree);
      const total = result.total;
      // Bedava tur: 4+ dede 15 tur, bedava turda 3+ dede +5 tur.
      const awarded = (result.freeTrigger ? FREE_SPINS : 0) + result.retrigger;
      const freeSpins = Math.max(0, (wallet.dede_free_spins ?? 0) - (isFree ? 1 : 0)) + awarded;
      const bigWin = stake > 0 && total >= stake * BIG_WIN_MULTIPLE;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + total,
        bet,
        dede_free_spins: freeSpins,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + total,
        last_spin_at: new Date().toISOString(),
      });

      return Response.json({
        ...walletView(updated),
        grid: result.grid,
        steps: result.steps,
        win: total,
        cost,
        scatter_count: result.scatterCount,
        free_trigger: result.freeTrigger,
        retrigger: result.retrigger,
        capped: result.capped,
        big_win: bigWin ? total : 0,
      });
    }

    return Response.json({ ...walletView(wallet), grid: null, steps: [], win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}