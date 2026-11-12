// Oyun kazanan tabloları: günlük ve haftalık kazançlar kullanıcı başına toplanır.
// Dönemler sesli oda hediye sıralamasıyla aynı takvimden gelir.
import { trDayKey as dayKey, trWeekKey as weekKey } from './leaderPeriods.ts';

const LIST_SIZE = 50;

// Kazanan listesi tutulan oyunlar: toplam kazanç cüzdandaki total_won_<oyun> alanından gelir.
export const LEADER_GAMES = ['slot', 'dede', 'fruit', 'seker', 'sekerli', 'elimin', 'roulette', 'zar', 'rocket', 'futbol'];

const periods = () => [`d:${dayKey()}`, `w:${weekKey()}`];

/** Kazanan turu günlük ve haftalık tabloya ekler. person: { id, full_name, avatar }. */
export async function recordLeaderWin(base44, game, person, won) {
  if (!(won > 0) || !person?.id) return;
  const db = base44.asServiceRole.entities.GameLeader;
  await Promise.all(periods().map(async (period) => {
    const [row] = await db.filter({ game, period, user_id: person.id }, '-created_date', 1);
    const profile = { user_name: person.username || '', user_avatar: person.avatar || '' };
    if (row) await db.update(row.id, { ...profile, won: (row.won ?? 0) + won });
    else await db.create({ game, period, user_id: person.id, ...profile, won });
  }));
}

const view = (row) => ({ user_id: row.user_id, name: row.user_name || 'Kullanıcı', avatar: row.user_avatar || '', won: row.won ?? 0 });

/** Bugünün, bu haftanın ve tüm zamanların en çok kazanan 50 kişisi. */
export async function loadLeaders(base44, game) {
  const db = base44.asServiceRole.entities.GameLeader;
  const field = `total_won_${game}`;
  const [day, week] = periods();
  const [today, weekly, wallets] = await Promise.all([
    db.filter({ game, period: day }, '-won', LIST_SIZE),
    db.filter({ game, period: week }, '-won', LIST_SIZE),
    base44.asServiceRole.entities.GameWallet.filter({ [field]: { $gt: 0 } }, `-${field}`, LIST_SIZE),
  ]);
  // Günlük, haftalık ve toplam listede herkes uygulamadaki kullanıcı adıyla görünür.
  const ids = [...new Set([...today, ...weekly, ...wallets].map((row) => row.user_id).filter(Boolean))];
  const people = await base44.asServiceRole.entities.User
    .filter({ id: { $in: ids } })
    .catch(() => []);
  const byId = new Map(people.map((person) => [person.id, person]));
  const named = (row) => {
    const entry = view(row);
    const person = byId.get(row.user_id);
    return { ...entry, name: person?.username || entry.name, avatar: person?.avatar || entry.avatar };
  };
  const total = wallets.map((wallet) => {
    const person = byId.get(wallet.user_id);
    return {
      user_id: wallet.user_id,
      name: person?.username || wallet.user_name || 'Kullanıcı',
      avatar: person?.avatar || '',
      won: wallet[field] ?? 0,
    };
  });
  return { today: today.map(named), week: weekly.map(named), total };
}