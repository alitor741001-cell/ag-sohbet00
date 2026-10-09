// ZAR tur makinesi: tur sunucuda ilerler, atılan zarlar tur boyunca herkese
// aynı anda yayınlanır. Zarlar bahis aşamasında gizli kalır (hile önlemi).

import { outcomeOf, rollDice } from './zarEngine.ts';
import { START_COINS } from './gameWallet.ts';

// Tur düzeni: 20 saniye bahis, 9 saniye kase içinde çalkalama ve sonuç.
export const BETTING_MS = 20000;
export const SHAKE_MS = 9000;
export const ROUND_MS = BETTING_MS + SHAKE_MS;

// Yayınlanan zar geçmişi: son turların atılan zarları.
const HISTORY_LIMIT = 12;
// Sınıra çok yakın gelen bahis de turu kapatabilir: ağ ve saat payı.
const EARLY_TOLERANCE_MS = 3000;

/** Oyun ekranının gördüğü tur: zarlar yalnızca kase çalkalanırken açılır. */
export function roundView(round) {
  const revealed = round.status === 'shaking';
  return {
    round_no: round.round_no,
    status: revealed ? 'shaking' : 'betting',
    started_at: round.started_at,
    phase_ends_at: round.phase_ends_at,
    ends_at: round.ends_at,
    dice: revealed ? [round.d1, round.d2, round.d3] : null,
    sum: revealed ? round.sum : null,
    outcome: revealed ? round.outcome : null,
  };
}

export function walletView(wallet) {
  return {
    coins: wallet.coins ?? START_COINS,
    rounds: wallet.spins ?? 0,
    // Bu oyunun kendi toplam kazancı: oyunlar birbirinden ayrı sayılır.
    total_won: wallet.total_won_zar ?? 0,
  };
}

async function latestRound(base44) {
  const rows = await base44.asServiceRole.entities.ZarRound.list('-round_no', 1);
  return rows[0] || null;
}

// Yeni tur: zarlar şimdiden atılır ama bahis bitene kadar gizli kalır.
async function createRound(base44, roundNo, now) {
  const roll = rollDice();
  return base44.asServiceRole.entities.ZarRound.create({
    round_no: roundNo,
    status: 'betting',
    started_at: new Date(now).toISOString(),
    phase_ends_at: new Date(now + BETTING_MS).toISOString(),
    ends_at: new Date(now + ROUND_MS).toISOString(),
    d1: roll.dice[0],
    d2: roll.dice[1],
    d3: roll.dice[2],
    sum: roll.sum,
    outcome: roll.outcome,
  });
}

// Açılmış zarlar: bahis aşamasındaki turun zarları geçmişe hiç girmez.
async function roundHistory(base44) {
  const rows = await base44.asServiceRole.entities.ZarRound.filter(
    { status: { $ne: 'betting' } }, '-round_no', HISTORY_LIMIT
  );
  return rows.map((row) => ({ round_no: row.round_no, d1: row.d1, d2: row.d2, d3: row.d3, sum: row.sum }));
}

// Tur canlı kayda yayınlanır: odadaki herkes aynı aşamayı ve aynı zarları görür.
async function publishLive(base44, round, history) {
  const revealed = round.status === 'shaking';
  const payload = {
    key: 'live',
    round_no: round.round_no,
    status: revealed ? 'shaking' : 'betting',
    started_at: round.started_at,
    phase_ends_at: round.phase_ends_at,
    ends_at: round.ends_at,
    d1: revealed ? round.d1 : 0,
    d2: revealed ? round.d2 : 0,
    d3: revealed ? round.d3 : 0,
    sum: revealed ? round.sum : 0,
    outcome: revealed ? round.outcome : '',
  };
  if (Array.isArray(history)) payload.history = history;
  const found = await base44.asServiceRole.entities.ZarLive.filter({ key: 'live' }, '-created_date', 1);
  const written = found[0]
    ? await base44.asServiceRole.entities.ZarLive.update(found[0].id, payload)
    : await base44.asServiceRole.entities.ZarLive.create({ ...payload, history: history || [] });
  if (Array.isArray(history)) historyCache = { rows: history, at: Date.now() };
  return written;
}

// Zar geçmişi kısa süre önbellekte tutulur: oyun ekranının her yoklamasında
// canlı kayıt yeniden okunmaz, istek bütçesi oyuncunun turuna kalır.
const HISTORY_CACHE_MS = 5000;
let historyCache = { rows: null, at: 0 };

/** Yayındaki zar geçmişi: oyun ekranındaki "YENİ" paneli buradan beslenir. */
export async function liveHistory(base44) {
  if (historyCache.rows && Date.now() - historyCache.at < HISTORY_CACHE_MS) return historyCache.rows;
  const rows = await base44.asServiceRole.entities.ZarLive.filter({ key: 'live' }, '-created_date', 1);
  historyCache = { rows: rows[0]?.history || [], at: Date.now() };
  return historyCache.rows;
}

/**
 * Turu ilerletir: bahis süresi dolunca zarlar açılır, tur bitince yeni tur açılır.
 * force=true ise sınıra çok yakın bahis turu kapatır.
 */
export async function ensureRound(base44, force = false) {
  const now = Date.now();
  let round = await latestRound(base44);
  if (!round) {
    round = await createRound(base44, 1, now);
    await publishLive(base44, round, await roundHistory(base44));
    return round;
  }

  const openAt = new Date(round.phase_ends_at).getTime();
  if (round.status === 'betting' && (now >= openAt || (force && openAt - now <= EARLY_TOLERANCE_MS))) {
    const opened = await base44.asServiceRole.entities.ZarRound.updateMany(
      { id: round.id, status: 'betting' },
      { $set: { status: 'shaking' } }
    );
    round = await base44.asServiceRole.entities.ZarRound.get(round.id);
    // Turu açan tek istek yayın yapar: aynı zarlar bir kez duyurulur.
    if (opened.updated) await publishLive(base44, round, await roundHistory(base44));
  }

  if (now >= new Date(round.ends_at).getTime()) {
    // Turu kapatma hakkı tek istemciye geçer: yeni tur iki kez açılmaz.
    const claimed = await base44.asServiceRole.entities.ZarRound.updateMany(
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
export async function roundForBet(base44, roundNo) {
  if (!Number.isInteger(roundNo) || roundNo <= 0) return null;
  const rows = await base44.asServiceRole.entities.ZarRound.filter({ round_no: roundNo }, '-created_date', 1);
  let round = rows[0] || null;
  if (!round) return null;
  if (round.status === 'betting') {
    await ensureRound(base44, true);
    round = await base44.asServiceRole.entities.ZarRound.get(round.id);
  }
  return round.status === 'shaking' ? round : null;
}

export { outcomeOf };