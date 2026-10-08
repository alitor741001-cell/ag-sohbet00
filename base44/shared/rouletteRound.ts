// ROULETTE tur makinesi: tur sunucuda ilerler, kazanan numara odadaki herkese
// aynı anda yayınlanır. Numara bahis aşamasında gizli kalır (hile önlemi).

import { WHEEL_ORDER, spinWheel } from './rouletteEngine.ts';

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
  return found[0]
    ? base44.asServiceRole.entities.RouletteLive.update(found[0].id, payload)
    : base44.asServiceRole.entities.RouletteLive.create({ ...payload, history: history || [] });
}

/** Yayındaki numara geçmişi: oyun ekranındaki şerit buradan beslenir. */
export async function liveHistory(base44) {
  const rows = await base44.asServiceRole.entities.RouletteLive.filter({ key: 'live' }, '-created_date', 1);
  return rows[0]?.history || [];
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