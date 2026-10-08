import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  BET_LEVELS,
  BIG_WIN_MULTIPLE,
  FREE_SPINS,
  LINES,
  SCATTER_MIN,
  evaluateFruit,
  spinFruit,
} from '../../shared/fruitEngine.ts';
import {
  DEFAULT_BET,
  START_COINS,
  clampBet,
  loadWallet,
  nearestBet,
} from '../../shared/gameWallet.ts';

// Oyun ekranının gördüğü bakiye ve bahis bilgisi.
function walletView(wallet) {
  return {
    coins: wallet.coins ?? START_COINS,
    bet: nearestBet(wallet.bet ?? DEFAULT_BET, BET_LEVELS),
    lines: LINES,
    spins: wallet.spins ?? 0,
    free_spins: wallet.free_spins ?? 0,
    total_won: wallet.total_won ?? 0,
    no_limit: false,
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

    if (action === 'bet') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet });
      return Response.json({ ...walletView(updated), grid: null, wins: [], win: 0 });
    }

    if (action === 'spin') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const stake = bet * LINES;
      // Serbest tur hakkı varsa tur bedava oynanır.
      const isFree = (wallet.free_spins ?? 0) > 0;
      const cost = isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (!isFree && coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const grid = spinFruit();
      const result = evaluateFruit(grid, bet);
      const total = result.total;
      // Ekranda 4 ve üzeri muz gelince serbest tur verilir.
      const freeTrigger = grid.flat().filter((symbol) => symbol === 'banana').length >= SCATTER_MIN;
      const freeSpins = Math.max(0, (wallet.free_spins ?? 0) - (isFree ? 1 : 0)) + (freeTrigger ? FREE_SPINS : 0);
      const bigWin = stake > 0 && total >= stake * BIG_WIN_MULTIPLE;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + total,
        bet,
        free_spins: freeSpins,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + total,
        last_spin_at: new Date().toISOString(),
      });

      return Response.json({
        ...walletView(updated),
        grid,
        wins: result.wins,
        win: total,
        cost,
        free_trigger: freeTrigger,
        big_win: bigWin ? total : 0,
      });
    }

    return Response.json({ ...walletView(wallet), grid: null, wins: [], win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}