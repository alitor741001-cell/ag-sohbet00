import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
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

// Oyun ekranının gördüğü bakiye, bahis ve çevirme hakkı bilgisi.
function walletView(wallet) {
  return {
    coins: wallet.coins ?? START_COINS,
    bet: nearestBet(wallet.bet ?? DEFAULT_BET, BET_LEVELS),
    lines: LINES,
    spins: wallet.spins ?? 0,
    // Bu oyunun kendi toplam kazancı: oyunlar birbirinden ayrı sayılır.
    total_won: wallet.total_won_sekerli ?? 0,
    // Satın alınan "15 çevirme hakkı" turu.
    session_spins: wallet.sekerli_session_spins ?? 0,
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

    // 15 çevirme hakkı: bedel bahis kademesine göre baştan düşülür, turlar ücret almaz.
    if (action === 'session') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
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
      });
      return Response.json({ ...walletView(updated), steps: [], final_grid: null, win: 0 });
    }

    if (action === 'bet') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet });
      return Response.json({ ...walletView(updated), steps: [], final_grid: null, win: 0 });
    }

    if (action === 'spin') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const stake = bet * LINES;
      // Çevirme hakkı sürerken tur bedava oynanır; normal turda bahis bakiyeden düşülür.
      const sessionTurns = wallet.sekerli_session_spins ?? 0;
      const inSession = sessionTurns > 0;
      const cost = inSession ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const result = await personalGameResult(base44, user, 'sekerli', () => spinSekerli(), outcome => outcome.units > 0);
      const win = Math.round(result.units * bet);
      const sessionLeft = Math.max(0, sessionTurns - (inSession ? 1 : 0));

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + win,
        bet,
        sekerli_session_spins: sessionLeft,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + win,
        total_won_sekerli: (wallet.total_won_sekerli ?? 0) + win,
        last_spin_at: new Date().toISOString(),
      });

      // Supabase aynası: bakiye iki altyapıda birden güncel kalır.
      waitUntil(mirrorRecord(base44, 'GameWallet', updated));

      return Response.json({
        ...walletView(updated),
        steps: result.steps,
        final_grid: result.final_grid,
        win,
        cost,
      });
    }

    return Response.json({ ...walletView(wallet), steps: [], final_grid: null, win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}