/**
 * Oda hediye sıralaması: son 24 saat ve tüm zamanlar.
 * Sıralama değeri koltuk sayaçlarıyla aynı birimdir (1 K = 1.000 puan).
 * Sıfırlama anından (AppConfig: room_gift_reset_at) önceki hediyeler sayılmaz.
 */

import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenUser } from './vip.ts';

const K_UNIT = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
// Oda başına okunacak en fazla hediye kaydı.
const MAX_RECORDS = 2000;
// Listede gösterilecek kişi sayısı.
const TOP_COUNT = 10;
// Oda sıralamasının elle sıfırlama anı (AppConfig anahtarı).
const RESET_KEY = 'room_gift_reset_at';
// Yalnızca 24 saatlik toplamı sıfırlayan anahtar — tüm zamanlar listesi korunur.
const DAY_RESET_KEY = 'room_gift_day_reset_at';

/** Verilen anahtarın sıfırlama anı; kayıt yoksa boş döner. */
async function resetAtFor(base44: any, key: string) {
  const config = await base44.asServiceRole.entities.AppConfig
    .filter({ key }, '-created_date', 1)
    .catch(() => []);
  return String(config[0]?.value || '').slice(0, 19);
}

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
    // Gizli kullanıcı listede de maskeli profil ve takma adla görünür.
    const hidden = isHiddenUser(profile);
    return {
      ...entry,
      name: hidden ? hiddenDisplayName(profile) : (profile?.username || profile?.full_name || entry.name || 'Kullanıcı'),
      avatar: hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || ''),
      hidden,
    };
  }));
};

const sumScore = (entries: any[]) => entries.reduce((sum, entry) => sum + entry.score, 0);

/** Odanın hediye sıralaması: son 24 saat ve tüm zamanlar listeleri + toplam değerler. */
export async function giftBoard(base44: any, roomId: string) {
  const [allRecords, resetAt, dayResetAt] = await Promise.all([
    base44.asServiceRole.entities.GiftSend
      .filter({ room_id: roomId }, '-created_date', MAX_RECORDS)
      .catch(() => []),
    resetAtFor(base44, RESET_KEY),
    resetAtFor(base44, DAY_RESET_KEY),
  ]);

  // Sıfırlama anından önceki hediyeler tamamen dışarıda kalır: toplam ve 24 saatlik birlikte sıfırlanır.
  const records = resetAt
    ? allRecords.filter((record) => {
        const created = String(record?.created_date || '').slice(0, 19);
        return !!created && created >= resetAt;
      })
    : allRecords;

  const since = Date.now() - DAY_MS;
  // 24 saatlik kısım ayrıca kendi sıfırlama anına uyar: sıfırlandıysa tüm zamanlar etkilenmez.
  const recent = records.filter((record) => {
    const at = new Date(record?.created_date || 0).getTime();
    if (!Number.isFinite(at) || at < since) return false;
    if (!dayResetAt) return true;
    const created = String(record?.created_date || '').slice(0, 19);
    return !!created && created >= dayResetAt;
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