import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { creditRocketBet, settleRocketBet } from '../../shared/rocketSettlement.ts';
import { withLimitRetry } from '../../shared/retryLimit.ts';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { waitUntil } from 'base44:runtime';
import {
  multiplierAt,
  randomCrash,
  nearestRocketBet,
  shiftRocketBet,
  BETTING_MS,
  GAP_MS,
  DEFAULT_ROCKET_BET,
  MAX_ROCKET_AUTO,
} from '../../shared/rocketEngine.ts';

const START_COINS = 100000;
const ADMIN_COINS = 500000;
const LEGACY_MAX_COINS = 1000000000;
// Public history is identical for all players; never cache wallets or payouts.
let historyCache = { key: '', rows: [] };

// Otomatik çekilme kademeleri: 0 = kapalı.
const AUTO_LEVELS = [
  0, 1.1, 1.2, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 10, 12, 15,
  20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 400, 500,
];

const betSlot = (bet) => (bet.slot === 2 ? 2 : 1);
const betField = (slot) => (slot === 2 ? 'rocket_bet_2' : 'rocket_bet');
const autoField = (slot) => (slot === 2 ? 'rocket_auto_2' : 'rocket_auto');
const walletBet = (wallet, slot) =>
  (slot === 2 ? wallet.rocket_bet_2 : wallet.rocket_bet) ?? DEFAULT_ROCKET_BET;
const walletAuto = (wallet, slot) =>
  (slot === 2 ? wallet.rocket_auto_2 : wallet.rocket_auto) ?? 0;
const liveKey = (variant) => `${variant}-live`;

function shiftAuto(current, direction) {
  const index = AUTO_LEVELS.indexOf(AUTO_LEVELS.includes(current) ? current : 0);
  const next = index + (direction > 0 ? 1 : -1);
  return AUTO_LEVELS[Math.min(AUTO_LEVELS.length - 1, Math.max(0, next))];
}

// Elle yazılan hedef: 1 veya altı, geçersiz değer otomatiği kapatır (0).
function clampAuto(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 1) return 0;
  return Math.min(MAX_ROCKET_AUTO, Math.round(n * 100) / 100);
}


// Hedef değişince o tur için konulmuş aktif bahise de uygulanır.
async function syncAutoToBet(base44, round, user, slot, autoAt) {
  const bets = await base44.asServiceRole.entities.RocketBet.filter(
    { round_id: round.id, user_id: user.id, status: 'active' },
    '-created_date',
    5
  );
  const mine = bets.find((b) => betSlot(b) === slot);
  if (!mine) return null;
  const result = await base44.asServiceRole.entities.RocketBet.updateMany(
    { id: mine.id, status: 'active' }, { $set: { auto_at: autoAt } }
  );
  return result.updated ? { ...mine, auto_at: autoAt } : null;
}

async function loadWallet(base44, user) {
  const found = await base44.asServiceRole.entities.GameWallet.filter({ user_id: user.id }, '-created_date', 1);
  const isAdmin = user.role === 'admin';
  if (found[0]) {
    if ((found[0].coins ?? 0) > LEGACY_MAX_COINS) {
      return base44.asServiceRole.entities.GameWallet.update(found[0].id, {
        coins: isAdmin ? ADMIN_COINS : START_COINS,
      });
    }
    return found[0];
  }
  return base44.asServiceRole.entities.GameWallet.create({
    user_id: user.id,
    user_name: user.full_name || '',
    coins: isAdmin ? ADMIN_COINS : START_COINS,
    bet: 100,
    rocket_bet: DEFAULT_ROCKET_BET,
    rocket_bet_2: DEFAULT_ROCKET_BET,
    lines: 50,
    spins: 0,
    grand: 0,
    total_won: 0,
  });
}

async function latestRound(base44, variant) {
  const list = await base44.asServiceRole.entities.RocketRound.filter({ variant }, '-round_no', 1);
  return list[0] || null;
}

// Tur bilgisi kısa süre önbellekte tutulur: uçuş tik'i çoğu çağrıda veritabanına
// dokunmaz, yalnızca çakılma anını bekler. Önbellek varyanta göre ayrılır.
const ROUND_CACHE_MS = 2000;
let roundCache = {};

async function cachedRound(base44, variant) {
  const entry = roundCache[variant];
  if (entry?.round && Date.now() - entry.at < ROUND_CACHE_MS) return entry.round;
  const round = await latestRound(base44, variant);
  roundCache[variant] = { round, at: Date.now() };
  return round;
}

function rememberRound(variant, round) {
  roundCache[variant] = { round, at: Date.now() };
}

// Çakılma: hedefine ulaşan otomatik bahisler önce nakde çevrilir, kalan aktifler
// kaybeder ve sonuç anında yayınlanır. Hem durum yoklaması hem uçuş tik'i kullanır.
async function crashRound(base44, round, now) {
  const m = multiplierAt(now - new Date(round.started_at).getTime());
  const autos = await base44.asServiceRole.entities.RocketBet.filter(
    { round_id: round.id, status: 'active', auto_at: { $gt: 0, $lte: m } },
    '-created_date',
    200
  );
  for (const bet of autos) {
    if (bet.auto_at <= round.crash_at) await settleRocketBet(base44, bet, bet.auto_at);
  }
  // Tur koşullu kapatılır: aynı anda gelen ikinci istek turu yeniden çakmaz.
  const closed = await base44.asServiceRole.entities.RocketRound.updateMany(
    { id: round.id, status: 'running' },
    { $set: { status: 'crashed', ended_at: new Date(now).toISOString() } }
  );
  if (!closed.updated) {
    const current = await base44.asServiceRole.entities.RocketRound.get(round.id);
    rememberRound(round.variant, current);
    return current;
  }
  await base44.asServiceRole.entities.RocketBet.updateMany(
    { round_id: round.id, status: 'active' },
    { $set: { status: 'lost' } }
  );
  const crashed = { ...round, status: 'crashed', ended_at: new Date(now).toISOString() };
  // Çakılma anı ve geçmiş tek yazımla yayınlanır: roket her ekranda birlikte patlar.
  const recent = await base44.asServiceRole.entities.RocketRound.filter({ variant: round.variant, status: 'crashed' }, '-round_no', 12);
  await publishLive(base44, crashed, recent.map((row) => ({ round_no: row.round_no, crash_at: row.crash_at })));
  // Supabase aynası: turun bahisleri son halleriyle arka planda yazılır.
  waitUntil(base44.asServiceRole.entities.RocketBet.filter({ round_id: round.id }, '-created_date', 200)
    .then((rows) => mirrorRecord(base44, 'RocketBet', rows))
    .catch(() => null));
  rememberRound(round.variant, crashed);
  return crashed;
}

// Tur durumu canlı kayda yayınlanır: oyuncular yoklama beklemeden turu, çakılma
// anını ve yeni turu aynı anda görür. Çakılma noktası yalnızca çakıldıktan sonra
// yazılır — tur sürerken istemciye görünmez. Her varyantın kendi canlı kaydı vardır.
async function publishLive(base44, round, history) {
  try {
    const key = liveKey(round.variant);
    const found = await base44.asServiceRole.entities.RocketLive.filter({ key }, '-created_date', 1);
    const payload = {
      key,
      variant: round.variant,
      round_no: round.round_no,
      status: round.status,
      phase_ends_at: round.phase_ends_at,
      started_at: round.started_at,
      ended_at: round.ended_at || '',
      crash_at: round.status === 'crashed' ? round.crash_at : 0,
    };
    if (Array.isArray(history)) payload.history = history;
    const written = found[0]
      ? await base44.asServiceRole.entities.RocketLive.update(found[0].id, payload)
      : await base44.asServiceRole.entities.RocketLive.create({ ...payload, history: history || [] });
    // Supabase aynası yanıt sonrası yazılır: oyun akışı bekletilmez.
    waitUntil(mirrorRecord(base44, 'RocketRound', round));
    waitUntil(mirrorRecord(base44, 'RocketLive', written));
  } catch (error) {
    // Canlı yayın yazılamazsa oyun seyrek yoklamayla akmaya devam eder.
    console.error('Rocket live publish failed:', error.message);
  }
}

// Tur durum makinesi: her istekte ilerletilir. Çakılma anı sunucuda belirlenir,
// crash_at yalnız çakıldıktan sonra istemciye gösterilir (hile önlemi).
// Her varyant kendi turlarını çalıştırır: roket ve otobüs birbirinden bağımsızdır.
async function ensureRound(base44, variant) {
  const now = Date.now();
  let round = await latestRound(base44, variant);

  if (!round || (round.status === 'crashed' && round.ended_at && now - new Date(round.ended_at).getTime() >= GAP_MS)) {
    const nextNo = (round?.round_no ?? 0) + 1;
    round = await base44.asServiceRole.entities.RocketRound.create({
      round_no: nextNo,
      variant,
      status: 'betting',
      phase_ends_at: new Date(now + BETTING_MS).toISOString(),
      started_at: new Date(now + BETTING_MS).toISOString(),
      crash_at: randomCrash(),
    });
    // Yeni tur anında yayınlanır: koltuktaki herkes turu aynı anda görür.
    await publishLive(base44, round);
  }

  if (round.status === 'betting' && now >= new Date(round.phase_ends_at).getTime()) {
    round = await base44.asServiceRole.entities.RocketRound.update(round.id, { status: 'running' });
    await publishLive(base44, round);
  }

  if (round.status === 'running') {
    const elapsed = now - new Date(round.started_at).getTime();
    const m = multiplierAt(elapsed);

    // Otomatik hedefi olan bahisler yalnızca gerektiği an sorgulanır: her istekte
    // yüzlerce bahis satırı çekilmez, sunucu yoğunluğu oluşmaz.
    if (m >= 1.1) {
      // Yalnızca hedefine ulaşan bahisler çekilir: tur boyunca yüzlerce satır
      // taranmaz, her yoklamada gereksiz yük oluşmaz.
      const autos = await base44.asServiceRole.entities.RocketBet.filter(
        { round_id: round.id, status: 'active', auto_at: { $gt: 0, $lte: m } },
        '-created_date',
        200
      );
      for (const bet of autos) {
        if (bet.auto_at <= round.crash_at && m >= bet.auto_at) {
          await settleRocketBet(base44, bet, bet.auto_at);
        }
      }
    }

    if (m >= round.crash_at) {
      round = await crashRound(base44, round, now);
    }
  }

  return round;
}

async function buildView(base44, user, round) {
  const bets = await base44.asServiceRole.entities.RocketBet.filter(
    { round_id: round.id, cancelled: { $ne: true } }, '-created_date', 200
  );
  for (const bet of bets) {
    if (bet.user_id === user.id) await creditRocketBet(base44, bet);
  }
  const key = `${round.variant}:${round.round_no}:${round.status}`;
  if (historyCache.key !== key) {
    const rows = await base44.asServiceRole.entities.RocketRound.filter({ variant: round.variant, status: 'crashed' }, '-round_no', 12);
    historyCache = { key, rows };
  }
  const history = historyCache.rows;
  const wallet = await loadWallet(base44, user);
  return {
    now: Date.now(),
    round: {
      round_no: round.round_no,
      status: round.status,
      phase_ends_at: round.phase_ends_at,
      started_at: round.started_at,
      crash_at: round.status === 'crashed' ? round.crash_at : undefined,
    },
    bets: bets.map((b) => ({
      id: b.id,
      user_id: b.user_id,
      user_name: b.user_name,
      user_avatar: b.user_avatar,
      slot: betSlot(b),
      auto_at: b.auto_at ?? 0,
      bet: b.bet,
      status: b.status,
      cashout_at: b.cashout_at,
      payout: b.payout,
    })),
    history: history.map((h) => ({ round_no: h.round_no, crash_at: h.crash_at })),
    coins: wallet.coins ?? 0,
    bet1: wallet.rocket_bet ?? DEFAULT_ROCKET_BET,
    bet2: wallet.rocket_bet_2 ?? DEFAULT_ROCKET_BET,
    auto1: wallet.rocket_auto ?? 0,
    auto2: wallet.rocket_auto_2 ?? 0,
    me: user.id,
  };
}

// Bahis çekme (cashout) ve bahis aşamasında iptal: tek yerde toplanır ki yoğunluk
// anında bütün istek güvenle tekrar denenebilsin (çekilme kararı sunucuda verilir).
async function handleCashout(base44, user, body, receivedAt, variant) {
  const slot = body.slot === 2 ? 2 : 1;
  // Cashout does not advance/pay every player's round or reload history.
  const roundNo = Number(body.round_no);
  const rounds = Number.isInteger(roundNo) && roundNo > 0
    ? await base44.asServiceRole.entities.RocketRound.filter({ variant, round_no: roundNo }, '-created_date', 1)
    : [await latestRound(base44, variant)];
  const round = rounds[0];
  if (!round) return Response.json({ error: 'Oyun turu bulunamadı.' }, { status: 400 });
  const mine = await base44.asServiceRole.entities.RocketBet.filter(
    { round_id: round.id, user_id: user.id, slot }, '-created_date', 1
  );
  let bet = mine[0];
  let notice = '';
  if (bet?.status === 'active') {
    const elapsed = receivedAt - new Date(round.started_at).getTime();
    const m = multiplierAt(elapsed);
    const target = bet.auto_at ?? 0;
    if (body.automatic === true) {
      if (target > 1 && target <= round.crash_at && m >= target) {
        bet = await settleRocketBet(base44, bet, target);
      } else if (m >= round.crash_at) {
        await base44.asServiceRole.entities.RocketBet.updateMany({ id: bet.id, status: 'active' }, { $set: { status: 'lost' } });
        bet = await base44.asServiceRole.entities.RocketBet.get(bet.id);
      }
    } else if (elapsed < 0 && round.status === 'betting') {
      bet = await settleRocketBet(base44, bet, 1, true);
    } else if (target > 1 && target <= round.crash_at && m >= target) {
      bet = await settleRocketBet(base44, bet, target);
    } else if (m < round.crash_at) {
      bet = await settleRocketBet(base44, bet, m);
    } else {
      await base44.asServiceRole.entities.RocketBet.updateMany({ id: bet.id, status: 'active' }, { $set: { status: 'lost' } });
      bet = await base44.asServiceRole.entities.RocketBet.get(bet.id);
    }
  } else if (bet?.status === 'cashed') {
    bet = await creditRocketBet(base44, bet);
  }
  if (bet?.status === 'lost') notice = 'Çakıldı — bahis kaybedildi.';
  const wallet = await loadWallet(base44, user);
  return Response.json({ patch: true, now: Date.now(), round_no: round.round_no, slot, bet: bet || null, coins: wallet.coins, notice });
}

export default async function (req) {
  const receivedAt = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      if (e?.status === 401 || e?.response?.status === 401) user = null;
      else throw e;
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'state';
    // Roket ve otobüs bağımsız çalışır: her varyantın kendi turları ve bahisleri vardır.
    const variant = body.variant === 'otobus' ? 'otobus' : 'rocket';

    if (action === 'changeBet') {
      const slot = body.slot === 2 ? 2 : 1;
      const wallet = await loadWallet(base44, user);
      const next = shiftRocketBet(walletBet(wallet, slot), body.direction || 1);
      await base44.asServiceRole.entities.GameWallet.update(wallet.id, { [betField(slot)]: next });
      waitUntil(mirrorRecord(base44, 'GameWallet', { ...wallet, [betField(slot)]: next }));
      return Response.json({ settings: true, values: { [slot === 2 ? 'bet2' : 'bet1']: next } });
    }

    // Settings only update this player's target, never settle the entire room.
    if (action === 'setAuto' || action === 'setAutoValue') {
      const slot = body.slot === 2 ? 2 : 1;
      const wallet = await loadWallet(base44, user);
      const value = action === 'setAuto' ? shiftAuto(walletAuto(wallet, slot), body.direction || 1) : clampAuto(body.value);
      if (walletAuto(wallet, slot) !== value) {
        await base44.asServiceRole.entities.GameWallet.update(wallet.id, { [autoField(slot)]: value });
        waitUntil(mirrorRecord(base44, 'GameWallet', { ...wallet, [autoField(slot)]: value }));
      }
      const number = Number(body.round_no);
      const rows = Number.isInteger(number) && number > 0
        ? await base44.asServiceRole.entities.RocketRound.filter({ variant, round_no: number }, '-created_date', 1)
        : [await latestRound(base44, variant)];
      const round = rows[0];
      const bet = round ? await syncAutoToBet(base44, round, user, slot, value) : null;
      return Response.json({ settings: true, round_no: round?.round_no, bet, values: { [slot === 2 ? 'auto2' : 'auto1']: value } });
    }

    if (action === 'bet') {
      const round = await ensureRound(base44, variant);
      if (round.status !== 'betting') {
        return Response.json({ error: 'Bahis aşaması kapalı.' }, { status: 400 });
      }
      const slot = body.slot === 2 ? 2 : 1;
      const existing = await base44.asServiceRole.entities.RocketBet.filter(
        { round_id: round.id, user_id: user.id, status: 'active' },
        '-created_date',
        5
      );
      if (existing.some((b) => betSlot(b) === slot)) {
        return Response.json({ error: 'Bu alanda zaten bahsin var.' }, { status: 400 });
      }

      const wallet = await loadWallet(base44, user);
      const bet = nearestRocketBet(body.amount ?? walletBet(wallet, slot));
      const coins = wallet.coins ?? 0;
      if (coins < bet) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const debit = await base44.asServiceRole.entities.GameWallet.updateMany(
        { id: wallet.id, coins: { $gte: bet } },
        { $inc: { coins: -bet }, $set: { [betField(slot)]: bet, [autoField(slot)]: clampAuto(body.auto ?? walletAuto(wallet, slot)) } }
      );
      if (!debit.updated) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const placed = await base44.asServiceRole.entities.RocketBet.create({
        round_id: round.id,
        round_no: round.round_no,
        variant,
        user_id: user.id,
        user_name: user.username || user.full_name || 'Kullanıcı',
        user_avatar: user.avatar || '',
        slot,
        bet,
        // Oyuncunun ekranda gördüğü otomatik hedef bahisle birlikte yazılır.
        auto_at: clampAuto(body.auto ?? walletAuto(wallet, slot)),
        status: 'active',
      });
      const updatedWallet = await loadWallet(base44, user);
      // Supabase aynası: bahis ve cüzdan yanıt sonrası yazılır.
      waitUntil(mirrorRecord(base44, 'RocketBet', placed));
      waitUntil(mirrorRecord(base44, 'GameWallet', updatedWallet));
      return Response.json({ patch: true, now: Date.now(), round_no: round.round_no, slot, bet: placed, coins: updatedWallet.coins });
    }

    // Bahis çekme ve bahis aşamasında iptal: yoğunluk hatasında kısa molalarla
    // tekrar denenir, oyuncunun basışı limit yüzünden karşılıksız kalmaz.
    if (action === 'cashout') {
      return await withLimitRetry(() => handleCashout(base44, user, body, receivedAt, variant), 4);
    }

    // Oyun defteri: oyuncunun kendi bahis dökümü, yatırılan ve kazanılan toplam.
    if (action === 'ledger') {
      const bets = await base44.asServiceRole.entities.RocketBet.filter(
        { user_id: user.id, variant, cancelled: { $ne: true } },
        '-created_date',
        200
      );
      const rounds = await base44.asServiceRole.entities.RocketRound.filter({ variant }, '-round_no', 80);
      const crashByNo = {};
      rounds.forEach((r) => {
        crashByNo[r.round_no] = r.crash_at;
      });
      const entries = bets.map((b) => ({
        round_no: b.round_no,
        slot: betSlot(b),
        bet: b.bet ?? 0,
        status: b.status,
        cashout_at: b.cashout_at ?? 0,
        payout: b.payout ?? 0,
        crash_at: crashByNo[b.round_no] ?? 0,
      }));
      return Response.json({
        entries,
        total_bet: entries.reduce((sum, e) => sum + e.bet, 0),
        total_won: entries.reduce((sum, e) => sum + e.payout, 0),
      });
    }

    // Recover older interrupted payouts on opening/reconnecting, not on every clock poll.
    if (body.recover === true) {
      const pending = await base44.asServiceRole.entities.RocketBet.filter(
        { user_id: user.id, variant, status: 'cashed', settlement_version: 1, payout_credited: false }, '-created_date', 20
      );
      for (const bet of pending) await creditRocketBet(base44, bet);
    }
    // Uçuş tik'i: tur çakılma anında çakılır ve sonuç aynı saniyede yayınlanır.
    // Tur önbellekte tutulduğu için çağrıların çoğu veritabanına dokunmaz.
    if (action === 'tick') {
      const now = Date.now();
      let current = await cachedRound(base44, variant);
      if (!current) {
        current = await ensureRound(base44, variant);
      } else if (current.status === 'betting' && now >= new Date(current.phase_ends_at).getTime()) {
        current = await base44.asServiceRole.entities.RocketRound.update(current.id, { status: 'running' });
        await publishLive(base44, current);
        rememberRound(variant, current);
      }
      if (current.status === 'running' && multiplierAt(now - new Date(current.started_at).getTime()) >= current.crash_at) {
        current = await crashRound(base44, current, now);
      }
      return Response.json({
        now,
        round: {
          round_no: current.round_no,
          status: current.status,
          phase_ends_at: current.phase_ends_at,
          started_at: current.started_at,
          crash_at: current.status === 'crashed' ? current.crash_at : undefined,
        },
      });
    }

    // state
    const round = await ensureRound(base44, variant);
    return Response.json(await buildView(base44, user, round));
  } catch (error) {
    console.error('Rocket operation failed:', error.message);
    const limited = error?.status === 429 || error?.response?.status === 429 || /rate|limit/i.test(error.message || '');
    return Response.json({ error: error.message }, {
      status: limited ? 429 : 500,
      headers: limited ? { 'Retry-After': '15' } : {},
    });
  }
}