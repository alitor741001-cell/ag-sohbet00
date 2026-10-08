// ALTIN GOL — futbol çekilişi tur motoru.
// Bütün oyuncular aynı canlı turu oynar: herkes aynı kartlara bahis koyar, tek bir
// kazanan çekilir. Kazanan, kartların çarpanlarına göre ağırlıklı seçilir ve ağırlık
// "0.95 / çarpan" olduğu için her seçimin beklenen getirisi aynıdır: kasa payı sabit.

export const BET_MS = 20000;   // seçim süresi
export const DRAW_MS = 8000;   // çekiliş animasyonu (ibre süresi)
export const RESULT_MS = 3000; // kazanan ekranda kalır, sonra yeni tur açılır
const ROUND_BASE = 886000;     // tur numarası referanstaki gibi büyük başlar
const HISTORY_KEEP = 40;
export const HISTORY_SHOW = 12;

// Bahis kademeleri ve tur başına üst sınır.
export const STAKE_LEVELS = [10, 100, 1000, 10000];
export const MAX_ROUND_STAKE = 100000;

// Kartların çarpanları: sekiz takım, toplam ağırlık 0.95 x 1.05.
export const TEAM_X: Record<string, number> = {
  kartal: 40,
  yildiz: 40,
  anka: 12,
  efes: 12,
  firtina: 6,
  gunes: 6,
  yesil: 4,
  marti: 4,
};

export const TEAM_IDS = Object.keys(TEAM_X);

// Mod yalnızca seçilebilecek kartları belirler; kazanan her zaman sekiz takım
// arasından çekilir. Böylece her modda beklenen getiri aynı kalır, risk profili değişir.
export const MODE_TEAMS: Record<string, string[]> = {
  normal: TEAM_IDS,
  gelismis: ['kartal', 'yildiz', 'anka', 'efes'],
  usta: ['firtina', 'gunes', 'yesil', 'marti'],
};

export const modeOf = (value?: string) => (value && MODE_TEAMS[value] ? value : 'normal');

export const todayKey = () => new Date().toISOString().slice(0, 10);

const WEIGHT_TOTAL = TEAM_IDS.reduce((sum, id) => sum + 0.95 / TEAM_X[id], 0);

/** Ağırlıklı çekiliş: yüksek çarpan daha seyrek, düşük çarpan daha sık gelir. */
export function drawWinner(): string {
  let roll = Math.random() * WEIGHT_TOTAL;
  for (const id of TEAM_IDS) {
    roll -= 0.95 / TEAM_X[id];
    if (roll <= 0) return id;
  }
  return TEAM_IDS[TEAM_IDS.length - 1];
}

export const payoutFor = (stake: number, teamId: string) =>
  Math.round(stake * (TEAM_X[teamId] ?? 0));

const potOf = (pots: any[], teamId: string) =>
  (pots || []).find((pot) => pot.team_id === teamId)?.coins ?? 0;

export { potOf };

/** Turun oyuncuya görünen hâli: kazanan, çekiliş anına kadar gizli kalır. */
export function roundView(record: any) {
  const betting = record.status === 'betting';
  return {
    round_no: record.round_no,
    status: record.status,
    phase_ends_at: record.phase_ends_at,
    winner_id: betting ? '' : record.winner_id || '',
  };
}

/** Son turların kazananları: en yeni tur başta. */
export const historyOf = (record: any) =>
  (record.history || []).slice(-HISTORY_SHOW).reverse();

/** Turu ilerletir: seçim süresi dolunca kazananı çeker, çekiliş bitince yeni tur açar. */
export async function ensureRound(base44: any) {
  const found = await base44.asServiceRole.entities.FootballLive.filter(
    { key: 'live' }, '-created_date', 1
  );
  const record = found[0];
  if (!record) {
    return base44.asServiceRole.entities.FootballLive.create({
      key: 'live',
      round_no: ROUND_BASE + 1,
      status: 'betting',
      started_at: new Date().toISOString(),
      phase_ends_at: new Date(Date.now() + BET_MS).toISOString(),
      winner_id: '',
      settled_round: 0,
      picks_count: 0,
      pots: [],
      history: [],
    });
  }

  const due = record.phase_ends_at ? new Date(record.phase_ends_at).getTime() : 0;
  if (due > Date.now()) return record;

  // Seçim süresi doldu: kazanan çekilir, sonuç animasyonu başlar.
  if (record.status === 'betting') {
    return base44.asServiceRole.entities.FootballLive.update(record.id, {
      status: 'drawing',
      winner_id: drawWinner(),
      phase_ends_at: new Date(Date.now() + DRAW_MS).toISOString(),
    });
  }

  // Çekiliş bitti: kazanan birkaç saniye daha ekranda kalır.
  if (due + RESULT_MS > Date.now()) return record;

  // Süre doldu: tur geçmişe işlenir ve yeni tur açılır.
  const history = [
    ...(record.history || []),
    { round_no: record.round_no, winner_id: record.winner_id },
  ].slice(-HISTORY_KEEP);

  return base44.asServiceRole.entities.FootballLive.update(record.id, {
    status: 'betting',
    round_no: record.round_no + 1,
    winner_id: '',
    settled_round: record.round_no,
    picks_count: 0,
    pots: [],
    history,
    started_at: new Date().toISOString(),
    phase_ends_at: new Date(Date.now() + BET_MS).toISOString(),
  });
}