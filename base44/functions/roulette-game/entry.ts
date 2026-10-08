import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { MAX_STAKE, sanitizeBets, settle } from '../../shared/rouletteEngine.ts';
import { START_COINS, loadWallet } from '../../shared/gameWallet.ts';
import { ensureRound, liveHistory, roundForSpin, roundView } from '../../shared/rouletteRound.ts';

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
    const action = body.action || 'state';

    // Hafif tik: yalnızca turu ilerletir, cüzdana dokunmaz.
    if (action === 'tick') {
      const round = await ensureRound(base44);
      return Response.json({ now: Date.now(), round: roundView(round) });
    }

    // Bahis, çarkın döndüğü an geçerli olan turun numarasına ödenir.
    if (action === 'spin') {
      const bets = sanitizeBets(body.bets);
      if (!bets.length) return Response.json({ error: 'Önce masaya bahis koy.' }, { status: 400 });
      const stake = bets.reduce((sum, bet) => sum + bet.amount, 0);
      if (stake > MAX_STAKE) return Response.json({ error: 'Bahis üst sınırı aşıldı.' }, { status: 400 });

      const wallet = await loadWallet(base44, user);
      const coins = wallet.coins ?? START_COINS;
      if (coins < stake) return Response.json({ error: 'Yetersiz coin. Coin bakiyene dokunup coin yükle.' }, { status: 400 });

      await ensureRound(base44);
      const round = await roundForSpin(base44, Number(body.round_no));
      if (!round) return Response.json({ error: 'Tur kapandı, sonraki turu bekle.' }, { status: 400 });

      // Ağ tekrarında aynı tur iki kez ödenmez: ilk sonuç aynen döner.
      const played = await base44.asServiceRole.entities.RouletteSpin.filter(
        { round_no: round.round_no, user_id: user.id }, '-created_date', 1
      );
      if (played[0]) {
        return Response.json({
          ...walletView(wallet),
          round: roundView(round),
          number: round.number,
          index: round.index,
          stake: played[0].stake,
          payout: played[0].payout,
          wins: [],
        });
      }

      const result = settle(bets, round.number);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - stake + result.payout,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + result.payout,
        last_spin_at: new Date().toISOString(),
      });

      // Tur, canlı sıralama ve numara geçmişi için kaydedilir.
      // Tur zaten ödendiği için kayıt hatası turu bozmaz.
      await base44.asServiceRole.entities.RouletteSpin.create({
        round_no: round.round_no,
        user_id: user.id,
        user_name: user.username || user.full_name || 'Kullanıcı',
        user_avatar: user.avatar || '',
        number: round.number,
        stake,
        payout: result.payout,
      }).catch(() => {});

      return Response.json({
        ...walletView(updated),
        round: roundView(round),
        number: round.number,
        index: round.index,
        stake,
        payout: result.payout,
        wins: result.wins,
      });
    }

    // state: tur, bakiye ve yayındaki numara geçmişi.
    const round = await ensureRound(base44);
    const wallet = await loadWallet(base44, user);
    return Response.json({
      ...walletView(wallet),
      now: Date.now(),
      round: roundView(round),
      history: await liveHistory(base44),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}