/**
 * Sayı tahtası (number board) ve hediye listesi için paylaşılan kurallar.
 * Sesli oda (voice-room) ve oda katılımı (room-presence) fonksiyonları kullanır.
 */

/** Gönderilebilecek hediyeler: anahtar → görünen ad. */
export const GIFT_LABELS: Record<string, string> = {
  rose: 'Gül',
  heart: 'Kalp',
  bear: 'Ayıcık',
  ring: 'Yüzük',
  gem: 'Elmas',
  car: 'Spor Araba',
  castle: 'Şato',
  crown: 'Taç',
};

export const GIFT_VALUES: Record<string, number> = {
  rose: 1, heart: 10, bear: 20, ring: 50, gem: 100, car: 500, castle: 1000, crown: 2000,
};

/** Sayı tahtası açık mı — kapalıyken koltuk altında tablo görünmez. */
export const isNumberBoardOpen = (room: any) => room?.number_board === true;

/** Ayar: kişi koltuğundan inince sayısı sıfırlansın mı? (varsayılan: açık) */
export const resetsOnSeatLeave = (room: any) => room?.number_board_reset_seat !== false;

/** Ayar: kişi odadan çıkınca sayısı sıfırlansın mı? (varsayılan: açık) */
export const resetsOnRoomLeave = (room: any) => room?.number_board_reset_room !== false;

/** Bir kişinin sayısını listeden çıkarır (kalan kişilerin sayıları korunur). */
export function withoutScore(scores: any, userId: string) {
  return (Array.isArray(scores) ? scores : []).filter((item) => item?.user_id !== userId);
}

/**
 * Koltuktan inme anında uygulanacak sayı listesi — ayar kapalıysa değişiklik yok (null).
 * Tahta kapalıyken de sayı silinir: koltuğunda oturmayan kişinin sayısı geri gelmez.
 */
export function scoresAfterSeatLeave(room: any, userId: string) {
  if (!resetsOnSeatLeave(room)) return null;
  return withoutScore(room.number_scores, userId);
}

/**
 * Odadan ayrılma anında uygulanacak sayı listesi — ayar kapalıysa değişiklik yok (null).
 * Uyanıklık yapıp odadan çıkan kişinin sayısı da bu yolla silinir.
 */
export function scoresAfterRoomLeave(room: any, userId: string) {
  if (!resetsOnRoomLeave(room)) return null;
  return withoutScore(room.number_scores, userId);
}

/** Sayıyı adım kadar değiştirir: en az 0, yukarı doğru sınırsız. */
export function withStep(scores: any, userId: string, delta: number) {
  const list = Array.isArray(scores) ? scores : [];
  const current = Number(list.find((item) => item?.user_id === userId)?.value) || 0;
  const value = Math.max(0, current + delta);
  return [...list.filter((item) => item?.user_id !== userId), { user_id: userId, value }];
}