import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { BET_LEVELS, BIG_WIN_MULTIPLE, LINES, playDede } from '../../shared/dedeEngine.ts';
import {
  DEFAULT_BET,
  SESSION_SPINS,
  START_COINS,
  clampBet,
  loadWallet,
  nearestBet,
  sessionPrice,
} from '../../shared/gameWallet.ts';

// Oyun ekranının gördüğü bakiye ve bahis bilgisi.
function walletView(wallet) {
  return {
    coins: wallet.coins ?? START_COINS,
    bet: nearestBet(wallet.bet ?? DEFAULT_BET, BET_LEVELS),
    lines: LINES,
    spins: wallet.spins ?? 0,
    free_spins: wallet.dede_free_spins ?? 0,
    total_won: wallet.total_won ?? 0,
    // Sol taraftaki "15 çevirme hakkı" kutusunun güncel coin bedeli.
    session_price: sessionPrice(nearestBet(wallet.bet ?? DEFAULT_BET, BET_LEVELS)),
    session_spins: SESSION_SPINS,
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

    // 15 çevirme hakkı: bedel bahis kademesine göre düşülür, turlar serbest çevrilir.
    if (action === 'session') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const price = sessionPrice(bet);
      if ((wallet.dede_free_spins ?? 0) > 0) {
        return Response.json({ error: 'Devam eden çevirme hakkın var.' }, { status: 400 });
      }
      const coins = wallet.coins ?? START_COINS;
      if (coins < price) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - price,
        bet,
        dede_free_spins: SESSION_SPINS,
      });
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
      // Serbest tur yalnızca satın alınan çevirme hakkından gelir; tur hediye edilmez.
      const freeSpins = Math.max(0, (wallet.dede_free_spins ?? 0) - (isFree ? 1 : 0));
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
        capped: result.capped,
        big_win: bigWin ? total : 0,
      });
    }

    return Response.json({ ...walletView(wallet), grid: null, steps: [], win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}