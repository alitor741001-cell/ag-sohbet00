import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  CRASH_ROUND_COOLDOWN_MS,
  DEFAULT_CONFIG,
  GAME_SYMBOLS,
  JACKPOT_MIN_BET,
  JACKPOT_TIERS,
  LEVELS,
  betCapForLevel,
  crashPointFor,
  createGrid,
  evaluateGrid,
  levelForXp,
  levelInfo,
  multiplierAt,
  sanitizeBet,
} from '../../shared/games.ts';

const num = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallback);
const nowMs = () => Date.now();
const isoOf = (ms) => new Date(ms).toISOString();
const dayKey = () => new Date().toISOString().slice(0, 10);

async function ensureConfig(svc) {
  const rows = await svc.entities.GameConfig.filter({ key: 'main' }, '-created_date', 1);
  if (rows[0]) return rows[0];
  return await svc.entities.GameConfig.create({ ...DEFAULT_CONFIG });
}

async function ensureProfile(svc, user, config) {
  const rows = await svc.entities.GameProfile.filter({ user_id: user.id }, '-created_date', 1);
  if (rows[0]) return rows[0];
  return await svc.entities.GameProfile.create({
    user_id: user.id,
    user_name: user.full_name || 'Oyuncu',
    coins: num(config.start_coins, 1000),
    level: 1,
    xp: 0,
  });
}

const findProfile = async (svc, userId) => {
  const rows = await svc.entities.GameProfile.filter({ user_id: userId }, '-created_date', 1);
  return rows[0] || null;
};

async function updateProfile(svc, userId, patch) {
  const profile = await findProfile(svc, userId);
  if (!profile) return null;
  return await svc.entities.GameProfile.update(profile.id, patch);
}

async function creditWinnings(svc, userId, payout, xpGain) {
  const profile = await findProfile(svc, userId);
  if (!profile) return null;
  const xp = Math.max(0, num(profile.xp, 0) + Math.max(0, Math.round(xpGain)));
  return await svc.entities.GameProfile.update(profile.id, {
    coins: Math.max(0, num(profile.coins, 0) + Math.max(0, Math.round(payout))),
    total_won: num(profile.total_won, 0) + Math.max(0, Math.round(payout)),
    xp,
    level: levelForXp(xp),
  });
}

const publicRound = (round) => (round ? {
  id: round.id,
  round_number: num(round.round_number, 1),
  status: round.status || 'waiting',
  started_at: round.started_at,
  crashed_at: round.crashed_at || null,
  crash_point: Number(round.crash_point) || 0,
  players: round.players || [],
} : null);

/** Tur patladığında bekleyen oyuncuları kapatır: hedefi tutanlar otomatik çekilir, kalan kaybeder. */
async function settleRound(svc, round, secret) {
  const crashPoint = Number(secret?.crash_point) || Number(round.crash_point) || 1.01;
  const players = Array.isArray(round.players) ? round.players : [];
  const settled = [];
  for (const player of players) {
    if (player.state !== 'playing') { settled.push(player); continue; }
    const bet = num(player.bet, 0);
    const target = Number(player.target) || 0;
    if (target > 1 && target <= crashPoint) {
      const multiplier = Math.floor(target * 100) / 100;
      const payout = Math.floor(bet * multiplier);
      await creditWinnings(svc, player.user_id, payout, Math.round(bet * 0.01));
      await svc.entities.GameHistory.create({
        user_id: player.user_id,
        user_name: player.name || 'Oyuncu',
        game: 'crash',
        bet,
        payout,
        multiplier,
        detail: `Hedef ${multiplier}x — otomatik çekiliş`,
        round_id: round.id,
      });
      settled.push({ ...player, state: 'cashed', cashout_multiplier: multiplier, payout });
    } else {
      settled.push({ ...player, state: 'lost', payout: 0, cashout_multiplier: 0 });
      await svc.entities.GameHistory.create({
        user_id: player.user_id,
        user_name: player.name || 'Oyuncu',
        game: 'crash',
        bet,
        payout: 0,
        multiplier: crashPoint,
        detail: `${crashPoint}x ile patladı`,
        round_id: round.id,
      });
    }
  }
  return await svc.entities.GameRound.update(round.id, {
    status: 'crashed',
    crash_point: crashPoint,
    crashed_at: isoOf(nowMs()),
    players: settled,
  });
}

/** Aktif crash turunu döner; gerekiyorsa patlamayı işler ve yeni turu açar. */
async function ensureRound(svc, config) {
  const rows = await svc.entities.GameRound.list('-created_date', 1);
  let round = rows[0] || null;
  if (round) {
    const secrets = await svc.entities.GameRoundSecret.filter({ round_id: round.id }, '-created_date', 1);
    const secret = secrets[0] || null;
    const startMs = round.started_at ? new Date(round.started_at).getTime() : 0;
    if (round.status === 'running' && startMs && nowMs() >= startMs) {
      const current = multiplierAt(nowMs() - startMs);
      if (secret && current >= Number(secret.crash_point)) round = await settleRound(svc, round, secret);
    }
  }
  const crashedMs = round?.crashed_at ? new Date(round.crashed_at).getTime() : 0;
  const needsNewRound = !round || (round.status === 'crashed' && nowMs() - crashedMs >= CRASH_ROUND_COOLDOWN_MS);
  if (!needsNewRound) return round;

  const waitSeconds = Math.max(4, num(config.crash_wait_seconds, 8));
  const created = await svc.entities.GameRound.create({
    round_number: num(round?.round_number, 0) + 1,
    status: 'waiting',
    started_at: isoOf(nowMs() + waitSeconds * 1000),
    players: [],
  });
  await svc.entities.GameRoundSecret.create({ round_id: created.id, crash_point: crashPointFor(config) });
  return created;
}

/** Tur 'waiting' ise koşuya geçirir, koşuyorsa çarpanı/pAtlama durumunu döner. */
async function roundState(svc, round, secret) {
  if (!round) return { round: null, multiplier: 1, crashed: false };
  const startMs = round.started_at ? new Date(round.started_at).getTime() : 0;
  if (round.status === 'waiting' && startMs && nowMs() >= startMs) {
    round = await svc.entities.GameRound.update(round.id, { status: 'running' });
  }
  if (round.status === 'crashed') return { round: publicRound(round), multiplier: Number(round.crash_point) || 1, crashed: true };
  if (round.status === 'waiting') return { round: publicRound(round), multiplier: 1, crashed: false };
  const current = multiplierAt(nowMs() - startMs);
  if (secret && current >= Number(secret.crash_point)) {
    const crashed = await settleRound(svc, round, secret);
    return { round: publicRound(crashed), multiplier: Number(crashed.crash_point) || current, crashed: true };
  }
  return { round: publicRound(round), multiplier: current, crashed: false };
}

const responseFor = async (svc, user, config, profile, extra = {}) => {
  const levels = LEVELS;
  const history = await svc.entities.GameHistory.filter({ user_id: user.id }, '-created_date', 12);
  return Response.json({
    profile,
    config,
    symbols: GAME_SYMBOLS,
    levels,
    level_info: levelInfo(profile?.xp || 0),
    bet_cap: betCapForLevel(profile?.level || 1, config),
    jackpot_min_bet: JACKPOT_MIN_BET,
    history,
    ...extra,
  });
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Giriş yapmalısın' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const action = String(payload.action || 'get');
    const svc = base44.asServiceRole;

    const config = await ensureConfig(svc);
    const profile = await ensureProfile(svc, user, config);

    if (action === 'get') return await responseFor(svc, user, config, profile);

    if (action === 'spin') {
      const game = payload.game === 'jackpot' ? 'jackpot' : 'slot';
      if (game === 'slot' && !config.slot_enabled) return Response.json({ error: 'Slot oyunu şu an kapalı' }, { status: 400 });
      if (game === 'jackpot' && !config.jackpot_enabled) return Response.json({ error: 'Jackpot oyunu şu an kapalı' }, { status: 400 });

      const requestId = String(payload.request_id || '').slice(0, 64);
      const recent = Array.isArray(profile.recent_request_ids) ? profile.recent_request_ids : [];
      if (requestId && recent.includes(requestId)) {
        return Response.json({ error: 'Bu spin zaten işlendi' }, { status: 400 });
      }

      const check = sanitizeBet(payload.bet, { coins: profile.coins, level: profile.level, config });
      if (!check.ok) return Response.json({ error: check.error }, { status: 400 });
      const bet = check.bet;

      const dailyLimit = num(config.daily_limit, 0);
      const today = dayKey();
      const wageredToday = profile.daily_date === today ? num(profile.daily_wagered, 0) : 0;
      if (dailyLimit > 0 && wageredToday + bet > dailyLimit) {
        return Response.json({ error: 'Günlük oyun limitine ulaştın' }, { status: 400 });
      }

      const grid = createGrid();
      const outcome = evaluateGrid(grid, bet);

      const growth = Math.max(0, Number(config.jackpot_growth) || 0);
      const contribution = Math.floor(bet * growth);
      const poolPatch = {
        jackpot_mini: num(config.jackpot_mini, 0),
        jackpot_major: num(config.jackpot_major, 0),
        jackpot_mega: num(config.jackpot_mega, 0),
      };
      JACKPOT_TIERS.forEach((tier) => {
        poolPatch[tier.pool] = num(poolPatch[tier.pool], 0) + Math.floor(contribution * tier.share);
      });

      let jackpot = null;
      if (outcome.jackpotTier) {
        if (bet >= JACKPOT_MIN_BET) {
          const tier = JACKPOT_TIERS.find((entry) => entry.tier === outcome.jackpotTier);
          const amount = num(poolPatch[tier.pool], 0);
          if (amount > 0) {
            jackpot = { tier: tier.tier, label: tier.label, amount };
            poolPatch[tier.pool] = num(config[tier.base], amount);
          }
        } else if (outcome.jackpotTier) {
          jackpot = { tier: outcome.jackpotTier, label: 'Jackpot', amount: 0, blocked: true, min_bet: JACKPOT_MIN_BET };
        }
      }

      const updatedConfig = await svc.entities.GameConfig.update(config.id, poolPatch);
      const payout = outcome.win + (jackpot?.amount || 0);
      const xp = num(profile.xp, 0) + Math.round(bet * (Number(config.xp_per_bet) || 0.01));
      const updatedProfile = await svc.entities.GameProfile.update(profile.id, {
        coins: Math.max(0, num(profile.coins, 0) - bet + payout),
        xp,
        level: levelForXp(xp),
        total_spins: num(profile.total_spins, 0) + 1,
        total_wagered: num(profile.total_wagered, 0) + bet,
        total_won: num(profile.total_won, 0) + payout,
        daily_date: today,
        daily_wagered: wageredToday + bet,
        recent_request_ids: [requestId, ...recent].filter(Boolean).slice(0, 15),
      });

      const detail = jackpot?.amount
        ? `${jackpot.label} kazanıldı!`
        : outcome.lines.length
          ? `${outcome.lines.length} hat kazandı`
          : outcome.bonus
            ? `Bonus ${outcome.bonus.count} sembol`
            : 'Kazanç yok';
      await svc.entities.GameHistory.create({
        user_id: user.id,
        user_name: user.full_name || 'Oyuncu',
        game,
        bet,
        payout,
        multiplier: Number((payout / bet).toFixed(2)),
        detail,
        request_id: requestId,
      });

      return await responseFor(svc, user, updatedConfig, updatedProfile, {
        spin: {
          grid,
          lines: outcome.lines,
          bonus: outcome.bonus,
          jackpot,
          bet,
          payout,
          win: outcome.win,
        },
      });
    }

    if (action === 'crash-round' || action === 'crash-state') {
      if (!config.crash_enabled) return Response.json({ error: 'Crash oyunu şu an kapalı' }, { status: 400 });
      let round = payload.round_id
        ? (await svc.entities.GameRound.filter({ id: String(payload.round_id) }, '-created_date', 1))[0] || null
        : null;
      let secret = null;
      if (round) secret = (await svc.entities.GameRoundSecret.filter({ round_id: round.id }, '-created_date', 1))[0] || null;
      if (action === 'crash-round' || !round) {
        round = await ensureRound(svc, config);
        secret = (await svc.entities.GameRoundSecret.filter({ round_id: round.id }, '-created_date', 1))[0] || null;
      }
      const state = await roundState(svc, round, secret);
      const freshProfile = (await findProfile(svc, user.id)) || profile;
      return Response.json({
        round: state.round,
        multiplier: state.multiplier,
        crashed: state.crashed,
        profile: freshProfile,
        config,
      });
    }

    if (action === 'crash-bet') {
      if (!config.crash_enabled) return Response.json({ error: 'Crash oyunu şu an kapalı' }, { status: 400 });
      const round = (await svc.entities.GameRound.filter({ id: String(payload.round_id || '') }, '-created_date', 1))[0] || null;
      if (!round) return Response.json({ error: 'Tur bulunamadı, sayfayı yenile' }, { status: 400 });
      if (round.status !== 'waiting') return Response.json({ error: 'Bu turun bahis süresi geçti' }, { status: 400 });
      const roundStartMs = round.started_at ? new Date(round.started_at).getTime() : 0;
      if (!roundStartMs || nowMs() >= roundStartMs) {
        return Response.json({ error: 'Bu turun bahis süresi geçti' }, { status: 400 });
      }
      const players = Array.isArray(round.players) ? round.players : [];
      if (players.some((player) => player.user_id === user.id)) {
        return Response.json({ error: 'Bu tura zaten bahis koydun' }, { status: 400 });
      }
      const check = sanitizeBet(payload.bet, { coins: profile.coins, level: profile.level, config });
      if (!check.ok) return Response.json({ error: check.error }, { status: 400 });
      const bet = check.bet;
      const target = Math.min(1000, Math.max(0, Number(payload.target) || 0));

      const dailyLimit = num(config.daily_limit, 0);
      const today = dayKey();
      const wageredToday = profile.daily_date === today ? num(profile.daily_wagered, 0) : 0;
      if (dailyLimit > 0 && wageredToday + bet > dailyLimit) {
        return Response.json({ error: 'Günlük oyun limitine ulaştın' }, { status: 400 });
      }

      const updatedRound = await svc.entities.GameRound.update(round.id, {
        players: [
          ...players,
          { user_id: user.id, name: user.full_name || 'Oyuncu', avatar: user.avatar_url || '', bet, target, state: 'playing', payout: 0, cashout_multiplier: 0 },
        ],
      });
      const xp = num(profile.xp, 0) + Math.round(bet * (Number(config.xp_per_bet) || 0.01));
      const updatedProfile = await svc.entities.GameProfile.update(profile.id, {
        coins: Math.max(0, num(profile.coins, 0) - bet),
        xp,
        level: levelForXp(xp),
        total_spins: num(profile.total_spins, 0) + 1,
        total_wagered: num(profile.total_wagered, 0) + bet,
        daily_date: today,
        daily_wagered: wageredToday + bet,
      });
      return await responseFor(svc, user, config, updatedProfile, { round: publicRound(updatedRound), multiplier: 1, crashed: false });
    }

    if (action === 'crash-cashout') {
      const round = (await svc.entities.GameRound.filter({ id: String(payload.round_id || '') }, '-created_date', 1))[0] || null;
      if (!round) return Response.json({ error: 'Tur bulunamadı' }, { status: 400 });
      const players = Array.isArray(round.players) ? round.players : [];
      const index = players.findIndex((player) => player.user_id === user.id);
      if (index < 0) return Response.json({ error: 'Bu turda bahsin yok' }, { status: 400 });
      if (players[index].state !== 'playing') return Response.json({ error: 'Bu turda işlemin tamamlandı' }, { status: 400 });

      const secrets = await svc.entities.GameRoundSecret.filter({ round_id: round.id }, '-created_date', 1);
      const secret = secrets[0] || null;
      const startMs = round.started_at ? new Date(round.started_at).getTime() : 0;
      const crashPoint = Number(secret?.crash_point) || 1.01;
      const current = multiplierAt(nowMs() - startMs);

      if (!startMs || nowMs() < startMs || current >= crashPoint) {
        const settled = await settleRound(svc, { ...round, players }, secret);
        return await responseFor(svc, user, config, await findProfile(svc, user.id), {
          round: publicRound(settled),
          multiplier: crashPoint,
          crashed: true,
          cashout: { ok: false, reason: 'crash' },
        });
      }

      const multiplier = current;
      const bet = num(players[index].bet, 0);
      const payout = Math.floor(bet * multiplier);
      const updated = [...players];
      updated[index] = { ...updated[index], state: 'cashed', cashout_multiplier: multiplier, payout };
      const updatedRound = await svc.entities.GameRound.update(round.id, { players: updated });
      const updatedProfile = await creditWinnings(svc, user.id, payout, Math.round(bet * 0.01));
      await svc.entities.GameHistory.create({
        user_id: user.id,
        user_name: user.full_name || 'Oyuncu',
        game: 'crash',
        bet,
        payout,
        multiplier,
        detail: `${multiplier}x ile çekildi`,
        round_id: round.id,
      });
      return await responseFor(svc, user, config, updatedProfile || profile, {
        round: publicRound(updatedRound),
        multiplier,
        crashed: false,
        cashout: { ok: true, multiplier, payout },
      });
    }

    return Response.json({ error: 'Bilinmeyen işlem' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || 'Oyun servisi hatası' }, { status: 500 });
  }
}