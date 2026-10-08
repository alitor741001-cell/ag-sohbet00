// ROULETTE tur makinesi: tur sunucuda ilerler, kazanan numara odadaki herkese
// aynı anda yayınlanır. Numara bahis aşamasında gizli kalır (hile önlemi).

import { WHEEL_ORDER, spinWheel } from './rouletteEngine.ts';
import { START_COINS } from './gameWallet.ts';
import { mirrorPayload, mirrorRecord, walletFromMirror } from './supabaseMirror.ts';
import { waitUntil } from 'base44:runtime';

// Tur düzeni: 20 saniye bahis, 10 saniye çark ve sonuç. Tur 30 saniyede bir döner.
export const BETTING_MS = 20000;
export const REVEAL_MS = 10000;
export const ROUND_MS = BETTING_MS + REVEAL_MS;

// Yayınlanan numara geçmişi: son turların çıkan numaraları.
const HISTORY_LIMIT = 10;
// Sınıra çok yakın gelen bahis de turu kapatabilir: ağ ve saat payı.
const EARLY_TOLERANCE_MS = 3000;

/** Oyun ekranının gördüğü tur: numara yalnızca çark dönerken açılır. */
export function roundView(round) {
  const revealed = round.status === 'spinning';
  return {
    round_no: round.round_no,
    status: revealed ? 'spinning' : 'betting',
    started_at: round.started_at,
    phase_ends_at: round.phase_ends_at,
    ends_at: round.ends_at,
    number: revealed ? round.number : null,
    index: revealed ? round.index : null,
  };
}

async function latestRound(base44) {
  const rows = await base44.asServiceRole.entities.RouletteRound.list('-round_no', 1);
  return rows[0] || null;
}

// Yeni tur: kazanan numara şimdiden belirlenir ama bahis bitene kadar gizli kalır.
async function createRound(base44, roundNo, now) {
  const index = spinWheel();
  return base44.asServiceRole.entities.RouletteRound.create({
    round_no: roundNo,
    status: 'betting',
    started_at: new Date(now).toISOString(),
    phase_ends_at: new Date(now + BETTING_MS).toISOString(),
    ends_at: new Date(now + ROUND_MS).toISOString(),
    number: WHEEL_ORDER[index],
    index,
  });
}

// Açılmış numaralar: bahis aşamasındaki turun numarası geçmişe hiç girmez.
async function roundHistory(base44) {
  const rows = await base44.asServiceRole.entities.RouletteRound.filter(
    { status: { $ne: 'betting' } }, '-round_no', HISTORY_LIMIT
  );
  return rows.map((row) => ({ round_no: row.round_no, number: row.number }));
}

// Tur canlı kayda yayınlanır: odadaki herkes aynı aşamayı ve aynı numarayı görür.
async function publishLive(base44, round, history) {
  const payload = {
    key: 'live',
    round_no: round.round_no,
    status: round.status === 'spinning' ? 'spinning' : 'betting',
    started_at: round.started_at,
    phase_ends_at: round.phase_ends_at,
    ends_at: round.ends_at,
    number: round.status === 'spinning' ? round.number : 0,
    index: round.status === 'spinning' ? round.index : 0,
  };
  if (Array.isArray(history)) payload.history = history;
  const found = await base44.asServiceRole.entities.RouletteLive.filter({ key: 'live' }, '-created_date', 1);
  const written = found[0]
    ? await base44.asServiceRole.entities.RouletteLive.update(found[0].id, payload)
    : await base44.asServiceRole.entities.RouletteLive.create({ ...payload, history: history || [] });
  if (Array.isArray(history)) historyCache = { rows: history, at: Date.now() };
  // Supabase aynası: tur ve numara geçmişi iki altyapıda birden güncel kalır.
  waitUntil(mirrorRecord(base44, 'RouletteLive', written));
  waitUntil(mirrorRecord(base44, 'RouletteRound', round));
  return written;
}

// Numara geçmişi kısa süre önbellekte tutulur: oyun ekranının her yoklamasında
// canlı kayıt yeniden okunmaz, istek bütçesi oyuncunun turuna kalır.
const HISTORY_CACHE_MS = 5000;
let historyCache = { rows: null, at: 0 };

/** Yayındaki numara geçmişi: oyun ekranındaki şerit buradan beslenir. */
export async function liveHistory(base44) {
  if (historyCache.rows && Date.now() - historyCache.at < HISTORY_CACHE_MS) return historyCache.rows;
  const rows = await base44.asServiceRole.entities.RouletteLive.filter({ key: 'live' }, '-created_date', 1);
  historyCache = { rows: rows[0]?.history || [], at: Date.now() };
  return historyCache.rows;
}

/**
 * Turu ilerletir: bahis süresi dolunca çark döner ve numara yayınlanır, tur
 * bitince yeni tur açılır. force=true ise sınıra çok yakın bahis turu kapatır.
 */
export async function ensureRound(base44, force = false) {
  const now = Date.now();
  let round = await latestRound(base44);
  if (!round) {
    round = await createRound(base44, 1, now);
    await publishLive(base44, round, await roundHistory(base44));
    return round;
  }

  const spinAt = new Date(round.phase_ends_at).getTime();
  if (round.status === 'betting' && (now >= spinAt || (force && spinAt - now <= EARLY_TOLERANCE_MS))) {
    const closed = await base44.asServiceRole.entities.RouletteRound.updateMany(
      { id: round.id, status: 'betting' },
      { $set: { status: 'spinning' } }
    );
    round = await base44.asServiceRole.entities.RouletteRound.get(round.id);
    // Turu kapatan tek istek yayın yapar: aynı numara bir kez duyurulur.
    if (closed.updated) await publishLive(base44, round, await roundHistory(base44));
  }

  if (now >= new Date(round.ends_at).getTime()) {
    // Turu kapatma hakkı tek istemciye geçer: yeni tur iki kez açılmaz.
    const claimed = await base44.asServiceRole.entities.RouletteRound.updateMany(
      { id: round.id, status: { $ne: 'closed' } },
      { $set: { status: 'closed' } }
    );
    if (claimed.updated) {
      round = await createRound(base44, round.round_no + 1, now);
      await publishLive(base44, round, await roundHistory(base44));
    } else {
      round = (await latestRound(base44)) || round;
    }
  }

  return round;
}

/** Bahsin geçerli olduğu tur: bahis aşamasındaki tur kapatılır, kapanmış tur reddedilir. */
export async function roundForSpin(base44, roundNo) {
  if (!Number.isInteger(roundNo) || roundNo <= 0) return null;
  const rows = await base44.asServiceRole.entities.RouletteRound.filter({ round_no: roundNo }, '-created_date', 1);
  let round = rows[0] || null;
  if (!round) return null;
  if (round.status === 'betting') {
    await ensureRound(base44, true);
    round = await base44.asServiceRole.entities.RouletteRound.get(round.id);
  }
  return round.status === 'spinning' ? round : null;
}

/**
 * Base44 kaydı geçici olarak sınırlandığında oyun durmaz: tur, numara geçmişi ve
 * bakiye Supabase aynasındaki son hâliyle sunulur. Yalnızca okuma yolunda
 * devreye girer; bahis ve ödeme her zaman gerçek kayda işler.
 */
export async function mirrorRoundView(base44, user) {
  const live = await mirrorPayload(base44, 'roulette_live', 'select=payload&key=eq.live&limit=1');
  if (!live || typeof live.round_no !== 'number') return null;
  const wallet = await walletFromMirror(base44, user?.id);
  const revealed = live.status === 'spinning';
  return {
    coins: wallet?.coins ?? START_COINS,
    spins: wallet?.spins ?? 0,
    total_won: wallet?.total_won ?? 0,
    now: Date.now(),
    round: {
      round_no: live.round_no,
      status: revealed ? 'spinning' : 'betting',
      started_at: live.started_at,
      phase_ends_at: live.phase_ends_at,
      ends_at: live.ends_at,
      number: revealed ? live.number : null,
      index: revealed ? live.index : null,
    },
    history: Array.isArray(live.history) ? live.history : [],
    mirrored: true,
  };
}