/**
 * Oda hediye sıralaması: son 24 saat ve tüm zamanlar.
 * Sıralama değeri koltuk sayaçlarıyla aynı birimdir (1 K = 1.000 puan).
 */

const K_UNIT = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
// Oda başına okunacak en fazla hediye kaydı.
const MAX_RECORDS = 2000;
// Listede gösterilecek kişi sayısı.
const TOP_COUNT = 10;

const scoreOfK = (kValue: any) => Math.max(0, Math.round((Number(kValue) || 0) * K_UNIT));

/** Hediye kayıtlarını gönderen kişiye göre toplar, en yüksekten aşağı sıralar. */
const aggregate = (records: any[]) => {
  const map = new Map();
  records.forEach((record) => {
    const senderId = record?.sender_id;
    const score = scoreOfK(record?.k_value);
    if (!senderId || score <= 0) return;
    const current = map.get(senderId) || { user_id: senderId, name: record.sender_name || 'Kullanıcı', score: 0, gifts: 0 };
    current.score += score;
    current.gifts += 1;
    if (record.sender_name) current.name = record.sender_name;
    map.set(senderId, current);
  });
  return [...map.values()].sort((a, b) => b.score - a.score);
};

/** Listenin başındaki kişilerin güncel profili (isim + fotoğraf) eklenir. */
const withProfiles = async (base44: any, entries: any[]) => {
  return Promise.all(entries.slice(0, TOP_COUNT).map(async (entry) => {
    const profile = await base44.asServiceRole.entities.User.get(entry.user_id).catch(() => null);
    return {
      ...entry,
      name: profile?.username || profile?.full_name || entry.name || 'Kullanıcı',
      avatar: profile?.avatar || '',
    };
  }));
};

const sumScore = (entries: any[]) => entries.reduce((sum, entry) => sum + entry.score, 0);

/** Odanın hediye sıralaması: son 24 saat ve tüm zamanlar listeleri + toplam değerler. */
export async function giftBoard(base44: any, roomId: string) {
  const records = await base44.asServiceRole.entities.GiftSend
    .filter({ room_id: roomId }, '-created_date', MAX_RECORDS)
    .catch(() => []);

  const since = Date.now() - DAY_MS;
  const recent = records.filter((record) => {
    const at = new Date(record?.created_date || 0).getTime();
    return Number.isFinite(at) && at >= since;
  });

  const dayAgg = aggregate(recent);
  const allAgg = aggregate(records);
  const [dayEntries, allEntries] = await Promise.all([
    withProfiles(base44, dayAgg),
    withProfiles(base44, allAgg),
  ]);

  return {
    day: { total: sumScore(dayAgg), entries: dayEntries },
    all: { total: sumScore(allAgg), entries: allEntries },
  };
}