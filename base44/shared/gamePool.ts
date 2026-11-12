// Oyun havuzu muhasebesi: Dede, Elimin Slot, Meyve ve Şekerli Meyve.
// Her oyunun havuzu ayrı kayıttır (GamePool). Oyuncunun ödediği her coin bir kez bölünür:
//   kesinti (%5) + ödeme fonu (RTP, %94) + rezerv (kalan, %1) = ödenen coin.
// Kazançlar yalnızca ödeme fonundan (havuz bakiyesi) düşer. Bedava turlar ve satın alınmış
// 15 çevirme hakkı aynı sistemden ödenir: hakların bedeli satın alınırken bir kez havuza girer.
// Kazanma ihtimali hiçbir koşulda değiştirilmez: sonuç önce tamamen rastgele üretilir,
// ardından herkese aynı ve önceden ilan edilmiş katsayı ve sınırlar uygulanır.

export const POOL_GAMES = ['dede', 'elimin', 'fruit', 'sekerli'];

export const POOL_DEFAULTS = {
  cut_pct: 5,
  rtp_pct: 94,
  // Kazanç seviyeleri: tur kazancının toplam bahse oranı (x).
  small_max: 2,
  medium_max: 10,
  big_max: 50,
  // Bir turda en fazla ödenecek kazanç (toplam bahsin katı).
  max_win: 500,
  // Bir bedava tur / 15 çevirme hakkı serisinde en fazla ödenecek toplam (tur değerinin katı).
  free_limit: 500,
  // Toplam bahis (bahis x 20) sınırları.
  min_stake: 200,
  max_stake: 100000,
  balance: 10000000,
};

// Ölçüm (tarafsız rastgele 200-600 bin tur): ham ödeme oranı ve bedava tur sıklığı.
// rb/qb: ücretli tur başına ham geri dönüş ve verilen bedava tur sayısı;
// rf/qf: bedava tur başına aynı değerler. Motor ödemeleri değişirse yeniden ölçülmelidir.
const CALIBRATION = {
  fruit: { rb: 1.12, qb: 0.118, rf: 1.12, qf: 0.118 },
  sekerli: { rb: 0.8136, qb: 0, rf: 0.8136, qf: 0 },
  elimin: { rb: 0.478, qb: 0.0167, rf: 0.478, qf: 0.0167 },
  dede: { rb: 0.8136, qb: 0.054, rf: 2.118, qf: 0.054 },
};

const num = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

/** Havuz kaydının ayarları: eksik alanlar varsayılandan gelir. */
export function poolRules(pool) {
  const pick = (key) => num(pool?.[key], POOL_DEFAULTS[key]);
  const cut = Math.min(100, Math.max(0, pick('cut_pct')));
  const rtp = Math.min(100 - cut, Math.max(0, pick('rtp_pct')));
  const cal = CALIBRATION[pool?.game] || CALIBRATION.fruit;
  const target = rtp / 100;
  return {
    cut,
    rtp,
    reserve: Math.max(0, 100 - cut - rtp),
    small_max: pick('small_max'),
    medium_max: pick('medium_max'),
    big_max: pick('big_max'),
    max_win: pick('max_win'),
    free_limit: pick('free_limit'),
    min_stake: pick('min_stake'),
    max_stake: pick('max_stake'),
    // Ödeme katsayıları: beklenen geri dönüş tam olarak RTP olur (bedava turlar dahil).
    kBase: (target * (1 - cal.qb)) / cal.rb,
    kFree: (target * (1 - cal.qf)) / cal.rf,
  };
}

/** Bahis kademeleri, toplam bahis sınırlarına göre süzülür. */
export function allowedLevels(rules, levels, lines) {
  const list = levels.filter((level) => level * lines >= rules.min_stake && level * lines <= rules.max_stake);
  return list.length ? list : levels;
}

/** Kazanç seviyesi: tur değerine oranla. */
export function winTier(rules, payout, value) {
  if (!(payout > 0) || !(value > 0)) return '';
  const ratio = payout / value;
  if (ratio <= rules.small_max) return 'small';
  if (ratio <= rules.medium_max) return 'medium';
  if (ratio <= rules.big_max) return 'big';
  return 'huge';
}

/** Oyunun havuz kaydı: yoksa varsayılanlarla açılır. */
export async function loadPool(base44, game) {
  const db = base44.asServiceRole.entities.GamePool;
  const [found] = await db.filter({ game }, 'created_date', 1);
  if (found) return found;
  return db.create({ game, ...POOL_DEFAULTS, reserve: 0, house_total: 0, total_bet: 0, total_paid: 0, spins: 0 });
}

/**
 * Turun ödemesi: ham sonuç (toplam bahsin katı) katsayıyla çarpılır, ardından sırasıyla
 * maksimum kazanç, bedava seri limiti ve havuz bakiyesi sınırı uygulanır.
 * value: turun coin değeri (ücretli turda toplam bahis, hak turunda hakkın tur başı bedeli).
 * paid: bu işlemde oyuncudan alınan coin (havuza bölünerek girer).
 */
export function settle(pool, rules, { value, rawMultiple, free, bonusWon = 0, paid = 0 }) {
  const k = free ? rules.kFree : rules.kBase;
  let payout = Math.max(0, Math.round(rawMultiple * value * k));
  let capped = false;
  const cap = (limit) => {
    if (payout > limit) { payout = Math.max(0, Math.floor(limit)); capped = true; }
  };
  cap(rules.max_win * value);
  if (free) cap(rules.free_limit * value - bonusWon);
  const fund = Math.round((paid * rules.rtp) / 100);
  cap((pool?.balance ?? 0) + fund);
  return { payout, capped, tier: winTier(rules, payout, value) };
}

/**
 * Havuz kaydına tek atomik artış: aynı coin iki kez yazılmaz.
 * paid ödeme bir kez bölünür; payout bakiyeden bir kez düşer.
 */
export async function commitPool(base44, pool, rules, { paid = 0, payout = 0, tier = '', spin = false }) {
  const cut = Math.round((paid * rules.cut) / 100);
  const fund = Math.round((paid * rules.rtp) / 100);
  const reserve = paid - cut - fund;
  const inc: Record<string, number> = {
    balance: fund - payout,
    reserve,
    house_total: cut,
    total_bet: paid,
    total_paid: payout,
  };
  if (spin) inc.spins = 1;
  if (tier) inc[`wins_${tier}`] = 1;
  Object.keys(inc).forEach((key) => { if (!inc[key]) delete inc[key]; });
  if (!Object.keys(inc).length) return;
  await base44.asServiceRole.entities.GamePool.updateMany({ id: pool.id }, { $inc: inc });
}

/** Ham adım tutarlarını ödenen tutara orantılar: ekrandaki adımlar toplamla tutarlı kalır. */
export const ratioOf = (payout, raw) => (raw > 0 ? payout / raw : 0);

/** Adım ve kazanç tutarları ödeme oranıyla ölçeklenir (küme oyunları). */
export function scaleSteps(steps, ratio) {
  return (steps || []).map((step) => ({
    ...step,
    amount: Math.round((step.amount || 0) * ratio),
    wins: (step.wins || []).map((win) => ({ ...win, amount: Math.round((win.amount || 0) * ratio) })),
  }));
}

/** Cüzdandaki oyun durumu: hak değerleri ve bedava seri kazancı. */
export function poolState(wallet, game) {
  return { ...(wallet?.pool_state?.[game] || {}) };
}

export function withPoolState(wallet, game, state) {
  return { ...(wallet?.pool_state || {}), [game]: state };
}