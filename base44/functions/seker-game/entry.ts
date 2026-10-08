import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import {
  BET_LEVELS,
  BIG_WIN_MULTIPLE,
  FREE_SPINS,
  LINES,
  SCATTER_ID,
  SCATTER_MIN,
  evaluateSeker,
  spinSeker,
} from '../../shared/sekerEngine.ts';
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
    // Bedava turlar (altın şeker hediyesi) ve satın alınan çevirme hakkı ayrı sayılır.
    free_spins: wallet.seker_free_spins ?? 0,
    session_spins: wallet.seker_session_spins ?? 0,
    // Bu oyunun kendi toplam kazancı: oyunlar birbirinden ayrı sayılır.
    total_won: wallet.total_won_seker ?? 0,
    no_limit: false,
    // "Çevirme hakkı" kutusunun güncel coin bedeli ve tur sayısı.
    session_price: sessionPrice(nearestBet(wallet.bet ?? DEFAULT_BET, BET_LEVELS)),
    session_size: SESSION_SPINS,
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
      if ((wallet.seker_session_spins ?? 0) > 0) {
        return Response.json({ error: 'Devam eden çevirme hakkın var.' }, { status: 400 });
      }
      const coins = wallet.coins ?? START_COINS;
      if (coins < price) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - price,
        bet,
        seker_session_spins: SESSION_SPINS,
      });
      return Response.json({ ...walletView(updated), grid: null, wins: [], win: 0 });
    }

    if (action === 'bet') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet });
      return Response.json({ ...walletView(updated), grid: null, wins: [], win: 0 });
    }

    if (action === 'spin') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const stake = bet * LINES;
      // Serbest tur hakkı varsa tur bedava oynanır.
      const freeTurns = wallet.seker_free_spins ?? 0;
      const sessionTurns = wallet.seker_session_spins ?? 0;
      const isFree = freeTurns > 0 || sessionTurns > 0;
      const cost = isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (!isFree && coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const grid = spinSeker();
      const result = evaluateSeker(grid, bet);
      const total = result.total;
      // 4 ve üzeri altın şeker hem bonus öder hem bedava tur verir.
      const freeTrigger = grid.flat().filter((symbol) => symbol === SCATTER_ID).length >= SCATTER_MIN;
      // Önce satın alınan tur tükenir, bedava turlar sonraya kalır.
      const sessionLeft = Math.max(0, sessionTurns - (sessionTurns > 0 ? 1 : 0));
      const freeLeft = Math.max(0, freeTurns - (sessionTurns > 0 ? 0 : isFree ? 1 : 0)) + (freeTrigger ? FREE_SPINS : 0);
      const bigWin = stake > 0 && total >= stake * BIG_WIN_MULTIPLE;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + total,
        bet,
        seker_free_spins: freeLeft,
        seker_session_spins: sessionLeft,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + total,
        total_won_seker: (wallet.total_won_seker ?? 0) + total,
        last_spin_at: new Date().toISOString(),
      });

      // Supabase aynası: bakiye iki altyapıda birden güncel kalır.
      waitUntil(mirrorRecord(base44, 'GameWallet', updated));

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