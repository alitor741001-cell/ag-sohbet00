import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { MAX_STAKE, WHEEL_ORDER, sanitizeBets, settle, spinWheel } from '../../shared/rouletteEngine.ts';
import { START_COINS, loadWallet } from '../../shared/gameWallet.ts';

// Oyun ekranının gördüğü bakiye bilgisi.
function walletView(wallet) {
  return {
    coins: wallet.coins ?? START_COINS,
    spins: wallet.spins ?? 0,
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
    const wallet = await loadWallet(base44, user);

    if ((body.action || 'state') === 'spin') {
      const bets = sanitizeBets(body.bets);
      if (!bets.length) return Response.json({ error: 'Önce masaya bahis koy.' }, { status: 400 });
      const stake = bets.reduce((sum, bet) => sum + bet.amount, 0);
      if (stake > MAX_STAKE) return Response.json({ error: 'Bahis üst sınırı aşıldı.' }, { status: 400 });
      const coins = wallet.coins ?? START_COINS;
      if (coins < stake) return Response.json({ error: 'Yetersiz coin. Coin bakiyene dokunup coin yükle.' }, { status: 400 });

      // Çark sunucuda döner: sonuç ve ödeme burada kesinleşir.
      const index = spinWheel();
      const number = WHEEL_ORDER[index];
      const result = settle(bets, number);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - stake + result.payout,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + result.payout,
        last_spin_at: new Date().toISOString(),
      });

      return Response.json({
        ...walletView(updated),
        number,
        index,
        stake,
        payout: result.payout,
        wins: result.wins,
      });
    }

    return Response.json({ ...walletView(wallet), number: null, index: null, stake: 0, payout: 0, wins: [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}