// Masaya konan canlı jetonlar: her oyuncunun masası tek kayıtta tutulur ve
// bütün oyuncular aynı jetonları görür (rulet, zar ve altın gol ortak kullanır).

// Bir oyuncunun masasında gösterilecek en fazla alan: kalabalık masada kayıt taşmaz.
export const TABLE_BET_BLOCKS = 16;

/** Bahis listesini sadeleştirir: aynı alan tek satırda toplanır, geçersiz satır atılır. */
export function sanitizeTableBets(bets) {
  const list = Array.isArray(bets) ? bets : [];
  const merged = new Map();
  list.forEach((bet) => {
    const block = String(bet?.block || '').slice(0, 24);
    const amount = Math.round(Number(bet?.amount));
    if (!block || !Number.isFinite(amount) || amount <= 0) return;
    merged.set(block, (merged.get(block) || 0) + amount);
  });
  return [...merged.entries()].slice(0, TABLE_BET_BLOCKS).map(([block, amount]) => ({ block, amount }));
}

/** Oyuncunun masasını yazar: kendi kaydı güncellenir, önceki turların kayıtları silinir. */
export async function publishTableBets(base44, game, roundNo, user, bets) {
  const rows = sanitizeTableBets(bets);
  const existing = await base44.asServiceRole.entities.GameTableBet
    .filter({ game, user_id: user.id }, '-created_date', 5)
    .catch(() => []);
  const current = existing[0];
  const data = {
    game,
    round_no: roundNo,
    user_id: user.id,
    user_name: user.username || user.full_name || 'Kullanıcı',
    user_avatar: user.avatar || '',
    bets: rows,
    total: rows.reduce((sum, row) => sum + row.amount, 0),
  };
  const saved = current
    ? await base44.asServiceRole.entities.GameTableBet.update(current.id, data).catch(() => null)
    : await base44.asServiceRole.entities.GameTableBet.create(data).catch(() => null);
  // Aynı oyuncunun eski turları masada görünmez: o kayıtlar temizlenir.
  const stale = existing.filter((row) => row.round_no !== roundNo).map((row) => row.id);
  if (stale.length) {
    await base44.asServiceRole.entities.GameTableBet.deleteMany({ id: { $in: stale } }).catch(() => null);
  }
  return saved;
}

/** Oyuncunun masasını boşaltır (seçimlerini geri çektiğinde). */
export async function clearUserTableBets(base44, game, userId) {
  await base44.asServiceRole.entities.GameTableBet.deleteMany({ game, user_id: userId }).catch(() => null);
}

/** Turun bütün masa kayıtlarını siler: sonuç kesinleştiğinde canlı masa kapanır. */
export async function clearRoundTableBets(base44, game, roundNo) {
  await base44.asServiceRole.entities.GameTableBet.deleteMany({ game, round_no: roundNo }).catch(() => null);
}