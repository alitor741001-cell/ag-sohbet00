import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { MAX_STAKE, sanitizeBets, settle } from '../../shared/zarEngine.ts';
import { START_COINS, loadWallet } from '../../shared/gameWallet.ts';
import { ensureRound, liveHistory, mirrorRoundView, roundForBet, roundView, walletView } from '../../shared/zarRound.ts';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { recordLeaderWin } from '../../shared/gameLeaders.ts';
import { clearRoundTableBets, publishTableBets } from '../../shared/gameTable.ts';

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

    // Masaya konan jetonlar: oyuncunun masası yayınlanır, karşı taraf anında görür.
    if (action === 'table') {
      const round = await ensureRound(base44);
      await publishTableBets(base44, 'zar', round.round_no, user, body.bets);
      return Response.json({ ok: true, round_no: round.round_no });
    }

    // Bahis, zarların açıldığı an geçerli olan turun numarasına ödenir.
    if (action === 'bet') {
      const bets = sanitizeBets(body.bets);
      if (!bets.length) return Response.json({ error: 'Önce masaya bahis koy.' }, { status: 400 });
      const stake = bets.reduce((sum, bet) => sum + bet.amount, 0);
      if (stake > MAX_STAKE) return Response.json({ error: 'Bahis üst sınırı aşıldı.' }, { status: 400 });

      const wallet = await loadWallet(base44, user);
      const coins = wallet.coins ?? START_COINS;
      if (coins < stake) return Response.json({ error: 'Yetersiz coin. Coin bakiyene dokunup coin yükle.' }, { status: 400 });

      await ensureRound(base44);
      const round = await roundForBet(base44, Number(body.round_no));
      if (!round) return Response.json({ error: 'Tur kapandı, sonraki turu bekle.' }, { status: 400 });

      // Ağ tekrarında aynı tur iki kez ödenmez: ilk sonuç aynen döner.
      const played = await base44.asServiceRole.entities.ZarBet.filter(
        { round_no: round.round_no, user_id: user.id }, '-created_date', 20
      );
      if (played.length) {
        return Response.json({
          ...walletView(wallet),
          round: roundView(round),
          dice: [round.d1, round.d2, round.d3],
          sum: round.sum,
          outcome: round.outcome,
          stake: played.reduce((sum, row) => sum + (row.stake ?? 0), 0),
          payout: played.reduce((sum, row) => sum + (row.payout ?? 0), 0),
          wins: [],
        });
      }

      const result = settle(bets, round.sum);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - stake + result.payout,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + result.payout,
        total_won_zar: (wallet.total_won_zar ?? 0) + result.payout,
        last_spin_at: new Date().toISOString(),
      });

      // Bahis alanları tur sıralaması ve alan toplamları için kaydedilir.
      // Tur zaten ödendiği için kayıt hatası turu bozmaz.
      const rows = bets.map((bet) => {
        const win = result.wins.find((entry) => entry.kind === bet.kind);
        return {
          round_no: round.round_no,
          user_id: user.id,
          user_name: user.username || user.full_name || 'Kullanıcı',
          user_avatar: user.avatar || '',
          kind: bet.kind,
          stake: bet.amount,
          payout: win?.payout || 0,
          d1: round.d1,
          d2: round.d2,
          d3: round.d3,
          sum: round.sum,
          outcome: round.outcome,
        };
      });
      const created = await base44.asServiceRole.entities.ZarBet.bulkCreate(rows).catch(() => null);
      // Sonuç kesinleşti: canlı masa kapanır, jetonlar ZarBet kayıtlarından okunur.
      waitUntil(clearRoundTableBets(base44, 'zar', round.round_no).catch(() => null));
      // Bakiye ve masa bahisleri aynaya da yazılır: iki altyapı aynı oyunu taşır.
      waitUntil(mirrorRecord(base44, 'GameWallet', updated).catch(() => null));
      if (result.payout > 0) waitUntil(recordLeaderWin(base44, 'zar', user, result.payout).catch(() => null));
      if (created) waitUntil(mirrorRecord(base44, 'ZarBet', created).catch(() => null));

      return Response.json({
        ...walletView(updated),
        round: roundView(round),
        dice: [round.d1, round.d2, round.d3],
        sum: round.sum,
        outcome: round.outcome,
        stake,
        payout: result.payout,
        wins: result.wins,
      });
    }

    // state: tur, bakiye ve yayındaki zar geçmişi. Kaynak geçici olarak yanıt
    // vermezse oyun aynadaki son hâlle akar: masa boş kalmaz.
    try {
      const round = await ensureRound(base44);
      const wallet = await loadWallet(base44, user);
      return Response.json({
        ...walletView(wallet),
        now: Date.now(),
        round: roundView(round),
        history: await liveHistory(base44),
      });
    } catch (error) {
      const mirrored = await mirrorRoundView(base44, user).catch(() => null);
      if (mirrored) return Response.json(mirrored);
      throw error;
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}