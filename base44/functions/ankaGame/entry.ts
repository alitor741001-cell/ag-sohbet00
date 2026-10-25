import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ANKA_BETS, ANKA_LINES, ANKA_PRIZES, playAnka } from '../../shared/ankaEngine.ts';
import { loadWallet, nearestBet, sessionPrice } from '../../shared/gameWallet.ts';
import { giftLock } from '../../shared/supabaseMirror.ts';

function view(wallet, state) {
  const bet = nearestBet(state.bet || 100, ANKA_BETS);
  return { coins: wallet.coins, bet, stake: bet * ANKA_LINES, free_spins: state.free_spins || 0,
    spins: state.spins || 0, total_won: state.total_won || 0, bonus_win: state.bonus_win || 0,
    session_price: sessionPrice(bet), grid: state.grid || null,
    jackpots: Object.fromEntries(Object.entries(ANKA_PRIZES).map(([key, factor]) => [key, factor * bet * ANKA_LINES])) };
}
export default async function(req) {
  let client, token, locked = false;
  try {
    client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return Response.json({ error: 'Oturum açmalısın.' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'state';
    if (!['state', 'bet', 'spin', 'session', 'rules'].includes(action)) return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
    if (action === 'rules') return Response.json({ reels: [3, 5, 3], ways: 45, lines: ANKA_LINES, bets: ANKA_BETS, bonus_spins: 15, egg_free_spins: 8, jackpot_multipliers: ANKA_PRIZES });
    if (action !== 'state' && (typeof body.request_id !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(body.request_id))) return Response.json({ error: 'İşlem kimliği gerekli.' }, { status: 400 });
    token = crypto.randomUUID();
    locked = await giftLock(client, [`wallet:${user.id}`], token);
    if (!locked) return Response.json({ error: 'Devam eden işlem var, tekrar dene.' }, { status: 429 });
    const wallet = await loadWallet(client, user);
    const state = wallet.anka_state || {};
    if (action === 'state') return Response.json(view(wallet, state));
    if (state.request_id === body.request_id) return Response.json(state.last_result);
    const bet = body.bet === undefined ? nearestBet(state.bet || 100, ANKA_BETS) : Number(body.bet);
    if (!ANKA_BETS.includes(bet)) return Response.json({ error: 'Geçersiz bahis.' }, { status: 400 });
    if ((state.free_spins || 0) > 0 && bet !== (state.bet || 100)) return Response.json({ error: 'Bonus bitene kadar bahis değişmez.' }, { status: 400 });
    const stake = bet * ANKA_LINES;
    let cost = 0, result = {}, next = { ...state, bet };
    if (action === 'session') {
      if ((state.free_spins || 0) > 0) return Response.json({ error: 'Önce devam eden bonusu bitir.' }, { status: 400 });
      cost = sessionPrice(bet);
      next = { ...next, free_spins: 15, bonus_win: 0 };
    }
    if (action === 'spin') {
      const free = (state.free_spins || 0) > 0;
      cost = free ? 0 : stake;
      result = playAnka(stake);
      next = { ...next, grid: result.grid, spins: (state.spins || 0) + 1,
        free_spins: Math.max(0, (state.free_spins || 0) - (free ? 1 : 0)) + result.free_spins_awarded,
        total_won: (state.total_won || 0) + result.win,
        bonus_win: free ? (state.bonus_win || 0) + result.win : 0 };
      if (free && next.free_spins === 0) result.bonus_result = next.bonus_win;
    }
    if (wallet.coins < cost) return Response.json({ error: 'Yetersiz coin. Bakiyene dokunarak coin yükleyebilirsin.' }, { status: 400 });
    const coins = wallet.coins - cost + (result.win || 0);
    const output = { ...view({ ...wallet, coins }, next), ...result, cost };
    next.request_id = body.request_id;
    next.last_result = output;
    await client.asServiceRole.entities.GameWallet.update(wallet.id, {
      coins, anka_state: next,
      ...(action === 'spin' ? { spins: (wallet.spins || 0) + 1, total_won: (wallet.total_won || 0) + result.win, last_spin_at: new Date().toISOString() } : {}),
    });
    return Response.json(output);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    if (locked) await giftLock(client, [], token, true);
  }
}