import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  multiplierAt,
  randomCrash,
  nearestRocketBet,
  shiftRocketBet,
  BETTING_MS,
  GAP_MS,
  DEFAULT_ROCKET_BET,
} from '../../shared/rocketEngine.ts';

const START_COINS = 100000;
const ADMIN_COINS = 500000;
const LEGACY_MAX_COINS = 1000000000;

// Otomatik çekilme kademeleri: 0 = kapalı.
const AUTO_LEVELS = [0, 1.1, 1.2, 1.5, 2, 3, 5, 7, 10];

const betSlot = (bet) => (bet.slot === 2 ? 2 : 1);
const betField = (slot) => (slot === 2 ? 'rocket_bet_2' : 'rocket_bet');
const autoField = (slot) => (slot === 2 ? 'rocket_auto_2' : 'rocket_auto');
const walletBet = (wallet, slot) =>
  (slot === 2 ? wallet.rocket_bet_2 : wallet.rocket_bet) ?? DEFAULT_ROCKET_BET;
const walletAuto = (wallet, slot) =>
  (slot === 2 ? wallet.rocket_auto_2 : wallet.rocket_auto) ?? 0;

function shiftAuto(current, direction) {
  const index = AUTO_LEVELS.indexOf(AUTO_LEVELS.includes(current) ? current : 0);
  const next = index + (direction > 0 ? 1 : -1);
  return AUTO_LEVELS[Math.min(AUTO_LEVELS.length - 1, Math.max(0, next))];
}

// Elle yazılan hedef: 1 veya altı, geçersiz değer otomatiği kapatır (0).
function clampAuto(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 1) return 0;
  return Math.min(100, Math.round(n * 100) / 100);
}

// Hedef değişince o tur için konulmuş aktif bahse de uygulanır.
async function syncAutoToBet(base44, round, user, slot, autoAt) {
  const bets = await base44.asServiceRole.entities.RocketBet.filter(
    { round_id: round.id, user_id: user.id, status: 'active' },
    '-created_date',
    5
  );
  const mine = bets.find((b) => betSlot(b) === slot);
  if (mine) await base44.asServiceRole.entities.RocketBet.update(mine.id, { auto_at: autoAt });
}

// Otomatik çekilme kazançlarını ilgili oyuncuların cüzdanına ekler.
async function creditWallets(base44, credits) {
  const ids = Object.keys(credits);
  for (const userId of ids) {
    const found = await base44.asServiceRole.entities.GameWallet.filter({ user_id: userId }, '-created_date', 1);
    if (!found[0]) continue;
    const amount = credits[userId];
    await base44.asServiceRole.entities.GameWallet.update(found[0].id, {
      coins: (found[0].coins ?? 0) + amount,
      total_won: (found[0].total_won ?? 0) + amount,
    });
  }
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

async function latestRound(base44) {
  const list = await base44.asServiceRole.entities.RocketRound.list('-round_no', 1);
  return list[0] || null;
}

// Tur durum makinesi: her istekte ilerletilir. Çakılma anı sunucuda belirlenir,
// crash_at yalnız çakıldıktan sonra istemciye gösterilir (hile önlemi).
async function ensureRound(base44) {
  const now = Date.now();
  let round = await latestRound(base44);

  if (!round || (round.status === 'crashed' && round.ended_at && now - new Date(round.ended_at).getTime() >= GAP_MS)) {
    const nextNo = (round?.round_no ?? 0) + 1;
    round = await base44.asServiceRole.entities.RocketRound.create({
      round_no: nextNo,
      status: 'betting',
      phase_ends_at: new Date(now + BETTING_MS).toISOString(),
      started_at: new Date(now + BETTING_MS).toISOString(),
      crash_at: randomCrash(),
    });
  }

  if (round.status === 'betting' && now >= new Date(round.phase_ends_at).getTime()) {
    round = await base44.asServiceRole.entities.RocketRound.update(round.id, { status: 'running' });
  }

  if (round.status === 'running') {
    const elapsed = now - new Date(round.started_at).getTime();
    const m = multiplierAt(elapsed);
    const active = await base44.asServiceRole.entities.RocketBet.filter(
      { round_id: round.id, status: 'active' },
      '-created_date',
      500
    );

    if (active.length) {
      // Otomatik çekilme: hedefi çakılma noktasından önceyse hedefte nakde çevrilir.
      const autoCashed = active.filter(
        (b) => (b.auto_at ?? 0) > 0 && b.auto_at <= round.crash_at && m >= b.auto_at
      );
      if (autoCashed.length) {
        await base44.asServiceRole.entities.RocketBet.bulkUpdate(
          autoCashed.map((b) => ({
            id: b.id,
            status: 'cashed',
            cashout_at: b.auto_at,
            payout: Math.round(b.bet * b.auto_at),
          }))
        );
        const credits = {};
        autoCashed.forEach((b) => {
          credits[b.user_id] = (credits[b.user_id] || 0) + Math.round(b.bet * b.auto_at);
        });
        await creditWallets(base44, credits);
      }

      if (m >= round.crash_at) {
        const cashedIds = autoCashed.map((b) => b.id);
        const losers = active.filter((b) => !cashedIds.includes(b.id));
        if (losers.length) {
          await base44.asServiceRole.entities.RocketBet.bulkUpdate(
            losers.map((b) => ({ id: b.id, status: 'lost' }))
          );
        }
      }
    }

    if (m >= round.crash_at) {
      round = await base44.asServiceRole.entities.RocketRound.update(round.id, {
        status: 'crashed',
        ended_at: new Date(now).toISOString(),
      });
    }
  }

  return round;
}

async function buildView(base44, user, round) {
  const wallet = await loadWallet(base44, user);
  const bets = await base44.asServiceRole.entities.RocketBet.filter({ round_id: round.id }, '-created_date', 200);
  const history = await base44.asServiceRole.entities.RocketRound.filter({ status: 'crashed' }, '-round_no', 12);
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

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      user = null;
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'state';

    if (action === 'changeBet') {
      const slot = body.slot === 2 ? 2 : 1;
      const wallet = await loadWallet(base44, user);
      const next = shiftRocketBet(walletBet(wallet, slot), body.direction || 1);
      await base44.asServiceRole.entities.GameWallet.update(wallet.id, { [betField(slot)]: next });
      const round = await ensureRound(base44);
      return Response.json(await buildView(base44, user, round));
    }

    // Otomatik çekilme hedefi kademeyle değiştirilir.
    if (action === 'setAuto') {
      const slot = body.slot === 2 ? 2 : 1;
      const wallet = await loadWallet(base44, user);
      const next = shiftAuto(walletAuto(wallet, slot), body.direction || 1);
      await base44.asServiceRole.entities.GameWallet.update(wallet.id, { [autoField(slot)]: next });
      const round = await ensureRound(base44);
      await syncAutoToBet(base44, round, user, slot, next);
      return Response.json(await buildView(base44, user, round));
    }

    // Elle yazılan hedef (örn. 7x): kademe dışı değerler de kaydedilir.
    if (action === 'setAutoValue') {
      const slot = body.slot === 2 ? 2 : 1;
      const value = clampAuto(body.value);
      const wallet = await loadWallet(base44, user);
      await base44.asServiceRole.entities.GameWallet.update(wallet.id, { [autoField(slot)]: value });
      const round = await ensureRound(base44);
      await syncAutoToBet(base44, round, user, slot, value);
      return Response.json(await buildView(base44, user, round));
    }

    if (action === 'bet') {
      const round = await ensureRound(base44);
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

      await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - bet,
        [betField(slot)]: bet,
      });
      await base44.asServiceRole.entities.RocketBet.create({
        round_id: round.id,
        round_no: round.round_no,
        user_id: user.id,
        user_name: user.username || user.full_name || 'Kullanıcı',
        user_avatar: user.avatar || '',
        slot,
        bet,
        auto_at: walletAuto(wallet, slot),
        status: 'active',
      });
      return Response.json(await buildView(base44, user, round));
    }

    if (action === 'cashout') {
      const slot = body.slot === 2 ? 2 : 1;
      const round = await ensureRound(base44);
      const mine = await base44.asServiceRole.entities.RocketBet.filter(
        { round_id: round.id, user_id: user.id },
        '-created_date',
        8
      );
      const myBet = mine.find((b) => betSlot(b) === slot && b.status === 'active');

      // Aktif bahis yoksa buton sessiz kalmaz: sebebi oyuncuya bildirilir.
      if (!myBet) {
        const last = mine.find((b) => betSlot(b) === slot);
        const notice =
          last?.status === 'lost'
            ? 'Çakıldı — bahis kaybedildi.'
            : last?.status === 'cashed'
              ? 'Bu bahis zaten çekildi.'
              : 'Bu alanda aktif bahsin yok.';
        const view = await buildView(base44, user, round);
        return Response.json({ ...view, notice });
      }

      const wallet = await loadWallet(base44, user);

      // Bahis aşamasında geri çek = iade.
      if (round.status === 'betting') {
        await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
          coins: (wallet.coins ?? 0) + myBet.bet,
        });
        await base44.asServiceRole.entities.RocketBet.delete(myBet.id);
        return Response.json(await buildView(base44, user, round));
      }

      // Uçuşta geri çek = çarpan anında nakde çevir. (running ise çakılmamış.)
      if (round.status === 'running') {
        const m = multiplierAt(Date.now() - new Date(round.started_at).getTime());
        const payout = Math.round(myBet.bet * m);
        await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
          coins: (wallet.coins ?? 0) + payout,
          total_won: (wallet.total_won ?? 0) + payout,
        });
        await base44.asServiceRole.entities.RocketBet.update(myBet.id, {
          status: 'cashed',
          cashout_at: m,
          payout,
        });
        return Response.json(await buildView(base44, user, round));
      }

      // Çakıldıysa bahis kaybedildi: buton yine de görünür bir yanıt verir.
      const view = await buildView(base44, user, round);
      return Response.json({ ...view, notice: 'Çakıldı — bahis kaybedildi.' });
    }

    // state
    const round = await ensureRound(base44);
    return Response.json(await buildView(base44, user, round));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}