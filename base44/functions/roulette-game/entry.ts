import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { MAX_STAKE, sanitizeBets, settle } from '../../shared/rouletteEngine.ts';
import { START_COINS, loadWallet } from '../../shared/gameWallet.ts';
import { ensureRound, liveHistory, mirrorRoundView, roundForSpin, roundView } from '../../shared/rouletteRound.ts';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { recordLeaderWin } from '../../shared/gameLeaders.ts';
import { waitUntil } from 'base44:runtime';

// Oyun ekranının gördüğü bakiye bilgisi.
function walletView(wallet) {
  return {
    coins: wallet.coins ?? START_COINS,
    spins: wallet.spins ?? 0,
    // Bu oyunun kendi toplam kazancı: oyunlar birbirinden ayrı sayılır.
    total_won: wallet.total_won_roulette ?? 0,
  };
}

export default async function (req) {
  // Yoğunluk anındaki yedek okuma için istemci ve kullanıcı dışarıda tutulur.
  let base44 = null;
  let user = null;
  try {
    base44 = createClientFromRequest(req);
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
        total_won_roulette: (wallet.total_won_roulette ?? 0) + result.payout,
        last_spin_at: new Date().toISOString(),
      });

      // Tur, canlı sıralama ve numara geçmişi için kaydedilir.
      // Tur zaten ödendiği için kayıt hatası turu bozmaz.
      const recorded = await base44.asServiceRole.entities.RouletteSpin.create({
        round_no: round.round_no,
        user_id: user.id,
        user_name: user.username || user.full_name || 'Kullanıcı',
        user_avatar: user.avatar || '',
        number: round.number,
        stake,
        payout: result.payout,
      }).catch(() => null);
      // Supabase aynası: bakiye ve tur kaydı iki altyapıda birden güncel kalır.
      waitUntil(mirrorRecord(base44, 'GameWallet', updated));
      if (result.payout > 0) waitUntil(recordLeaderWin(base44, 'roulette', user, result.payout).catch(() => null));
      if (recorded) waitUntil(mirrorRecord(base44, 'RouletteSpin', recorded));

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
    const limited = error?.status === 429 || error?.response?.status === 429 || /rate|limit/i.test(error?.message || '');
    // Base44 kaydı yoğunlukta sınırlanırsa oyun durmaz: tur, numara geçmişi ve
    // bakiye Supabase aynasındaki son hâliyle sunulur, ekran akmaya devam eder.
    if (limited && base44 && user) {
      const mirrored = await mirrorRoundView(base44, user).catch(() => null);
      if (mirrored) return Response.json(mirrored);
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}