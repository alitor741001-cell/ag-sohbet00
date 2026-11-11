// Oyun kazanan tabloları: günlük ve haftalık kazançlar kullanıcı başına toplanır.
const TZ = 'Europe/Istanbul';

const dayKey = (date = new Date()) => date.toLocaleDateString('sv-SE', { timeZone: TZ });

// Haftanın pazartesi günü: haftalık tablo her pazartesi sıfırlanır.
function weekKey(date = new Date()) {
  const local = new Date(`${dayKey(date)}T00:00:00Z`);
  const shift = (local.getUTCDay() + 6) % 7;
  local.setUTCDate(local.getUTCDate() - shift);
  return local.toISOString().slice(0, 10);
}

const periods = () => [`d:${dayKey()}`, `w:${weekKey()}`];

/** Kazanan turu günlük ve haftalık tabloya ekler. */
export async function recordLeaderWin(base44, game, user, won) {
  if (!(won > 0)) return;
  const db = base44.asServiceRole.entities.GameLeader;
  await Promise.all(periods().map(async (period) => {
    const [row] = await db.filter({ game, period, user_id: user.id }, '-created_date', 1);
    const profile = { user_name: user.full_name || user.username || '', user_avatar: user.avatar || '' };
    if (row) await db.update(row.id, { ...profile, won: (row.won ?? 0) + won });
    else await db.create({ game, period, user_id: user.id, ...profile, won });
  }));
}

const view = (row) => row ? { user_id: row.user_id, name: row.user_name || 'Kullanıcı', avatar: row.user_avatar || '', won: row.won ?? 0 } : null;

/** Bugünün, bu haftanın ve tüm zamanların en çok kazananı. */
export async function loadLeaders(base44, game, totalField) {
  const db = base44.asServiceRole.entities.GameLeader;
  const [day, week] = periods();
  const [today] = await db.filter({ game, period: day }, '-won', 1);
  const [weekly] = await db.filter({ game, period: week }, '-won', 1);
  const [wallet] = await base44.asServiceRole.entities.GameWallet.filter({ [totalField]: { $gt: 0 } }, `-${totalField}`, 1);
  let total = null;
  if (wallet) {
    const person = await base44.asServiceRole.entities.User.get(wallet.user_id).catch(() => null);
    total = {
      user_id: wallet.user_id,
      name: person?.full_name || person?.username || wallet.user_name || 'Kullanıcı',
      avatar: person?.avatar || '',
      won: wallet[totalField] ?? 0,
    };
  }
  return { today: view(today), week: view(weekly), total };
}