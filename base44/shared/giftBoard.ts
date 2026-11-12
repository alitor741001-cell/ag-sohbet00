/**
 * Oda hediye sıralaması: bugünün listesi ve tüm zamanlar.
 * Sıralama değeri koltuk sayaçlarıyla aynı birimdir (1 K = 1.000 puan).
 * Tüm zamanlar listesi sıfırlama anından (AppConfig: room_gift_reset_at) önceki
 * hediyeleri saymaz; 24 saatlik liste her akşam 24:00'da (Türkiye saatiyle) sıfırlanır.
 */

import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenUser } from './vip.ts';
import { dayStartIso } from './giftBox.ts';

const K_UNIT = 1000;
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
    current.gifts += Math.max(1, Number(record.quantity) || 1);
    if (record.sender_name) current.name = record.sender_name;
    map.set(senderId, current);
  });
  return [...map.values()].sort((a, b) => b.score - a.score);
};

/** Listenin başındaki kişilerin güncel profili (isim + fotoğraf) eklenir. */
const withProfiles = async (base44: any, entries: any[]) => {
  const top = entries.slice(0, TOP_COUNT);
  const people = top.length ? await base44.asServiceRole.entities.User.filter({ id: { $in: top.map(p => p.user_id) } }, '-created_date', TOP_COUNT) : [];
  const profiles = new Map(people.map(p => [p.id, p]));
  return Promise.all(top.map(async (entry) => {
    const profile = profiles.get(entry.user_id);
    // Gizli kullanıcı listede de maskeli profil ve takma adla görünür.
    const hidden = isHiddenUser(profile);
    return {
      ...entry,
      name: hidden ? hiddenDisplayName(profile) : (profile?.username || entry.name || 'Kullanıcı'),
      avatar: hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || ''),
      hidden,
    };
  }));
};

const sumScore = (entries: any[]) => entries.reduce((sum, entry) => sum + entry.score, 0);

/** Odanın hediye sıralaması: son 24 saat ve tüm zamanlar listeleri + toplam değerler. */
export async function giftBoard(base44: any, roomId: string) {
  const [resetAt, dayResetAt] = await Promise.all([resetAtFor(base44, RESET_KEY), resetAtFor(base44, DAY_RESET_KEY)]);
  const allRecords = [];
  const query = { room_id: roomId, ...(resetAt ? { created_date: { $gte: resetAt } } : {}) };
  for (let skip = 0; ; skip += 500) {
    const batch = await base44.asServiceRole.entities.GiftSend.filter(query, 'created_date', 500, skip);
    allRecords.push(...batch);
    if (batch.length < 500) break;
  }

  // Sıfırlama anından önceki hediyeler tamamen dışarıda kalır: toplam ve 24 saatlik birlikte sıfırlanır.
  const records = resetAt
    ? allRecords.filter((record) => {
        const created = String(record?.created_date || '').slice(0, 19);
        return !!created && created >= resetAt;
      })
    : allRecords;

  // 24 saatlik liste her akşam 24:00'da (Türkiye saatiyle) sıfırlanır: o andan sonra
  // hediye atanlar listeye girer. Elle sıfırlama anı daha yeniyse o geçerlidir.
  const dayStart = dayStartIso();
  const dayFloor = dayResetAt && dayResetAt > dayStart ? dayResetAt : dayStart;
  const recent = records.filter((record) => {
    const created = String(record?.created_date || '').slice(0, 19);
    return !!created && created >= dayFloor;
  });

  // Haftalık liste: bugün dahil son 7 gün (Türkiye saatiyle gün başından itibaren).
  const weekFloor = dayStartIso(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const weekly = records.filter((record) => {
    const created = String(record?.created_date || '').slice(0, 19);
    return !!created && created >= weekFloor;
  });

  const dayAgg = aggregate(recent);
  const weekAgg = aggregate(weekly);
  const allAgg = aggregate(records);
  const [dayEntries, weekEntries, allEntries] = await Promise.all([
    withProfiles(base44, dayAgg),
    withProfiles(base44, weekAgg),
    withProfiles(base44, allAgg),
  ]);

  return {
    day: { total: sumScore(dayAgg), entries: dayEntries },
    week: { total: sumScore(weekAgg), entries: weekEntries },
    all: { total: sumScore(allAgg), entries: allEntries },
  };
}