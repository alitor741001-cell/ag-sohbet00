import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { personalGameResult } from '../../shared/personalGameOdds.ts';
import { BET_LEVELS, BIG_WIN_MULTIPLE, LINES, SCATTER_MIN, playDede } from '../../shared/dedeEngine.ts';
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
    // Satın alınan "15 çevirme hakkı" tur sayısı.
    session_spins: wallet.dede_session_spins ?? 0,
    // Biriken çarpan: 15 tur boyunca saklanır, tur bitince de çemberde görünür kalır.
    multiplier: Math.max(0, Math.round(wallet.dede_multiplier ?? 0)),
    // Bu oyunun kendi toplam kazancı: oyunlar birbirinden ayrı sayılır.
    total_won: wallet.total_won_dede ?? 0,
    // Sol taraftaki "çevirme hakkı" kutusunun güncel coin bedeli ve tur sayısı.
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
      if ((wallet.dede_session_spins ?? 0) > 0) {
        return Response.json({ error: 'Devam eden çevirme hakkın var.' }, { status: 400 });
      }
      const coins = wallet.coins ?? START_COINS;
      if (coins < price) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - price,
        bet,
        dede_session_spins: SESSION_SPINS,
        // Yeni 15 tur sıfırdan başlar: biriken çarpan temizlenir.
        dede_multiplier: 0,
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
      // Satın alınan çevirme hakkı tur ücreti almaz.
      const sessionTurns = wallet.dede_session_spins ?? 0;
      const isFree = sessionTurns > 0;
      const cost = isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (!isFree && coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      // Birikmiş çarpan yalnızca 15 çevirme hakkı boyunca devrolur.
      const carried = isFree ? Math.max(0, Math.round(wallet.dede_multiplier ?? 0)) : 0;
      const result = await personalGameResult(base44, user, 'dede', () => playDede(bet, isFree, carried), outcome => outcome.total > 0);
      const total = result.total;
      // 4+ dede yalnızca bonus öder; bedava tur sistemi oyundan kaldırıldı.
      const sessionLeft = Math.max(0, sessionTurns - (isFree ? 1 : 0));
      const triggered = result.scatterCount >= SCATTER_MIN;
      const balance = coins - cost + total;
      // Çevirme hakkı sürerken gelen 4+ skatter: 15 hak bedelsiz eklenir, coin düşmez.
      const retrigger = triggered && isFree;
      // Tek tek çevirmede 4, 5 ya da 6 skatter gelince 15 çevirme hakkı bedelsiz verilir.
      const sessionBonus = triggered && !isFree;
      const bigWin = stake > 0 && total >= stake * BIG_WIN_MULTIPLE;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: balance,
        bet,
        // Kalan bedava turlar sıfırlanır: oyun artık bedava tur vermiyor.
        dede_free_spins: 0,
        dede_session_spins: retrigger
          ? sessionLeft + SESSION_SPINS
          : sessionBonus ? SESSION_SPINS : sessionLeft,
        // Biriken çarpan 15 tur boyunca saklanır; yeni turda birikmiş değerle birleşir.
        dede_multiplier: sessionBonus || (isFree && sessionLeft <= 0) ? 0 : result.accumulated,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + total,
        total_won_dede: (wallet.total_won_dede ?? 0) + total,
        last_spin_at: new Date().toISOString(),
      });

      // Supabase aynası: bakiye iki altyapıda birden güncel kalır.
      waitUntil(mirrorRecord(base44, 'GameWallet', updated));

      return Response.json({
        ...walletView(updated),
        grid: result.grid,
        steps: result.steps,
        win: total,
        cost,
        scatter_count: result.scatterCount,
        // Skatter çevirme hakkını başlattıysa ekran kutlamayı gösterir.
        session_bonus: sessionBonus,
        // Skatter çevirme hakkı bedelsiz verilir: düşülen coin yoktur.
        session_cost: 0,
        // Çevirme hakkı sürerken gelen skatter: ek turlar bedelsiz eklenir.
        session_retrigger: retrigger,
        retrigger_spins: retrigger ? SESSION_SPINS : 0,
        capped: result.capped,
        big_win: bigWin ? total : 0,
      });
    }

    return Response.json({ ...walletView(wallet), grid: null, steps: [], win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}