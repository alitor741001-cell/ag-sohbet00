import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { START_COINS, loadWallet } from '../../shared/gameWallet.ts';
import {
  MAX_ROUND_STAKE,
  MODE_TEAMS,
  STAKE_LEVELS,
  TEAM_IDS,
  ensureRound,
  historyOf,
  modeOf,
  payoutFor,
  roundView,
  todayKey,
} from '../../shared/futbolRound.ts';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { waitUntil } from 'base44:runtime';

const potOf = (pots, teamId) => (pots || []).find((pot) => pot.team_id === teamId)?.coins ?? 0;

const addPot = (pots, teamId, amount) => {
  const list = pots || [];
  if (!list.some((pot) => pot.team_id === teamId)) return [...list, { team_id: teamId, coins: Math.max(0, amount) }];
  return list.map((pot) => (pot.team_id === teamId ? { ...pot, coins: Math.max(0, (pot.coins ?? 0) + amount) } : pot));
};

// Oyun ekranının gördüğü bakiye: futbol kazancı ayrı sayılır, günlük ödül gece sıfırlanır.
function walletView(wallet) {
  const fresh = wallet.futbol_today_date === todayKey();
  return {
    coins: wallet.coins ?? START_COINS,
    total_won: wallet.total_won_futbol ?? 0,
    today: fresh ? wallet.futbol_today ?? 0 : 0,
    mode: modeOf(wallet.futbol_mode),
  };
}

/** Geçmiş turlarda bekleyen kazançlar bu kullanıcı için bir kez hesaplanır. */
async function settleMine(base44, user, record, wallet) {
  const picks = await base44.asServiceRole.entities.FootballPick
    .filter({ user_id: user.id, settled: false }, '-created_date', 50)
    .catch(() => []);
  // Açık tur beklenir: tur kapandıktan sonra ödenir.
  const due = picks.filter((pick) => pick.round_no !== record.round_no);
  if (!due.length) return { wallet, last: null };

  const winners = new Map((record.history || []).map((row) => [row.round_no, row.winner_id]));
  const byRound = new Map();
  let total = 0;
  const rows = due.map((pick) => {
    const winner = winners.get(pick.round_no) || '';
    const payout = winner && pick.team_id === winner ? payoutFor(pick.stake, winner) : 0;
    total += payout;
    const row = byRound.get(pick.round_no) || { round_no: pick.round_no, winner_id: winner, payout: 0, stake: 0 };
    row.payout += payout;
    row.stake += pick.stake || 0;
    byRound.set(pick.round_no, row);
    return { id: pick.id, payout };
  });
  const last = [...byRound.values()].sort((a, b) => b.round_no - a.round_no)[0] || null;

  const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
    coins: (wallet.coins ?? 0) + total,
    total_won: (wallet.total_won ?? 0) + total,
    total_won_futbol: (wallet.total_won_futbol ?? 0) + total,
    futbol_today: (wallet.futbol_today_date === todayKey() ? wallet.futbol_today ?? 0 : 0) + total,
    futbol_today_date: todayKey(),
  });

  // Seçimler altışarlı gruplarla işaretlenir: aynı tur iki kez ödenmez.
  for (let index = 0; index < rows.length; index += 6) {
    await Promise.allSettled(rows.slice(index, index + 6).map((row) =>
      base44.asServiceRole.entities.FootballPick.update(row.id, { settled: true, payout: row.payout })));
  }

  waitUntil(mirrorRecord(base44, 'GameWallet', updated).catch(() => null));
  return { wallet: updated, last };
}

/** Tur ekranı: kartların toplamı, kendi seçimlerim, tur geçmişi. */
async function viewForUser(base44, user, wallet, record) {
  const open = MODE_TEAMS[modeOf(wallet?.futbol_mode)];
  const mineRows = await base44.asServiceRole.entities.FootballPick
    .filter({ round_no: record.round_no, user_id: user.id }, '-created_date', 20)
    .catch(() => []);
  const mine = new Map(mineRows.map((row) => [row.team_id, row.stake]));

  return {
    round: roundView(record),
    teams: TEAM_IDS.map((id) => ({
      id,
      pot: potOf(record.pots, id),
      mine: mine.get(id) ?? 0,
      open: open.includes(id),
    })),
    picks_count: record.picks_count ?? 0,
    history: historyOf(record),
  };
}

export default async function (req) {
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

    // Tur ilerletilir (seçim kapanır, kazanan çekilir) ve bekleyen kazanç ödenir.
    const record = await ensureRound(base44);
    const settled = await settleMine(base44, user, record, await loadWallet(base44, user));
    let wallet = settled.wallet;

    if (action === 'mode') {
      wallet = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { futbol_mode: modeOf(body.mode) });
      waitUntil(mirrorRecord(base44, 'GameWallet', wallet).catch(() => null));
      return Response.json({
        ...walletView(wallet),
        now: Date.now(),
        ...(await viewForUser(base44, user, wallet, record)),
        last: settled.last,
      });
    }

    if (action === 'pick') {
      if (record.status !== 'betting') {
        return Response.json({ error: 'Seçim süresi doldu, sonraki turu bekle.' }, { status: 400 });
      }
      const teamId = String(body.team_id || '');
      if (!MODE_TEAMS[modeOf(wallet.futbol_mode)].includes(teamId)) {
        return Response.json({ error: 'Bu kart seçtiğin modda kapalı.' }, { status: 400 });
      }
      const stake = Math.round(Number(body.stake));
      if (!Number.isFinite(stake) || stake < STAKE_LEVELS[0] || stake % 10 !== 0) {
        return Response.json({ error: 'Geçersiz bahis.' }, { status: 400 });
      }

      const mineRows = await base44.asServiceRole.entities.FootballPick
        .filter({ round_no: record.round_no, user_id: user.id }, '-created_date', 20);
      const placed = mineRows.reduce((sum, row) => sum + (row.stake || 0), 0);
      if (placed + stake > MAX_ROUND_STAKE) {
        return Response.json({ error: 'Bu tur için bahis üst sınırına ulaştın.' }, { status: 400 });
      }

      const existing = mineRows.find((row) => row.team_id === teamId);

      // Bakiye tek adımda ve koşullu düşülür: eşzamanlı istekler bakiyeyi aşamaz.
      const debit = await base44.asServiceRole.entities.GameWallet.updateMany(
        { id: wallet.id, coins: { $gte: stake } },
        { $inc: { coins: -stake } }
      );
      if (!debit.updated) {
        return Response.json({ error: 'Yetersiz coin. Coin bakiyene dokunup coin yükle.' }, { status: 400 });
      }

      const pick = existing
        ? await base44.asServiceRole.entities.FootballPick.update(existing.id, {
            stake: (existing.stake || 0) + stake,
            settled: false,
          })
        : await base44.asServiceRole.entities.FootballPick.create({
            round_no: record.round_no,
            user_id: user.id,
            user_name: user.full_name || '',
            user_avatar: user.avatar || '',
            team_id: teamId,
            stake,
            payout: 0,
            settled: false,
          });

      const updated = await base44.asServiceRole.entities.GameWallet.get(wallet.id);
      const live = await base44.asServiceRole.entities.FootballLive.update(record.id, {
        pots: addPot(record.pots, teamId, stake),
        picks_count: (record.picks_count ?? 0) + 1,
      });

      waitUntil(mirrorRecord(base44, 'GameWallet', updated).catch(() => null));
      if (pick) waitUntil(mirrorRecord(base44, 'FootballPick', pick).catch(() => null));

      return Response.json({
        ...walletView(updated),
        now: Date.now(),
        ...(await viewForUser(base44, user, updated, live)),
        last: settled.last,
      });
    }

    if (action === 'clear') {
      if (record.status !== 'betting') {
        return Response.json({ error: 'Tur kapandı, seçimler temizlenemez.' }, { status: 400 });
      }
      const mineRows = await base44.asServiceRole.entities.FootballPick
        .filter({ round_no: record.round_no, user_id: user.id, settled: false }, '-created_date', 20);
      if (!mineRows.length) return Response.json({ error: 'Bu turda seçimin yok.' }, { status: 400 });

      const refund = mineRows.reduce((sum, row) => sum + (row.stake || 0), 0);
      const pots = mineRows.reduce((acc, row) => addPot(acc, row.team_id, -(row.stake || 0)), record.pots);
      await base44.asServiceRole.entities.FootballPick.deleteMany({
        round_no: record.round_no,
        user_id: user.id,
        settled: false,
      });
      // İade de atomik artırılır: eşzamanlı bahislerin düşümü ezilmez.
      await base44.asServiceRole.entities.GameWallet.updateMany({ id: wallet.id }, { $inc: { coins: refund } });
      const updated = await base44.asServiceRole.entities.GameWallet.get(wallet.id);
      const live = await base44.asServiceRole.entities.FootballLive.update(record.id, {
        pots,
        picks_count: Math.max(0, (record.picks_count ?? 0) - mineRows.length),
      });
      waitUntil(mirrorRecord(base44, 'GameWallet', updated).catch(() => null));

      return Response.json({
        ...walletView(updated),
        now: Date.now(),
        ...(await viewForUser(base44, user, updated, live)),
        last: settled.last,
      });
    }

    // state: tur, kartlar, bakiye ve tur geçmişi.
    return Response.json({
      ...walletView(wallet),
      now: Date.now(),
      ...(await viewForUser(base44, user, wallet, record)),
      last: settled.last,
    });
  } catch (error) {
    const limited = error?.status === 429 || error?.response?.status === 429 || /rate|limit/i.test(error?.message || '');
    if (limited) {
      return Response.json({ error: 'Şu an yoğunluk var, birkaç saniye sonra tekrar dene.' }, { status: 429 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}