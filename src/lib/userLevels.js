/**
 * Rozet görünümü: N seviyesi, VIP ve hediye seviyeleri.
 * Seviye renkleri: yeşil → koyu yeşil → mor → mavi → altın → kırmızı.
 * Görseldeki gibi: hediye gönderme rozeti yeşil (yıldız), hediye alış rozeti turuncu (kalp).
 */

export const TIER_COLORS = {
  green: '#7df5c5',
  dark: '#2f9e6b',
  purple: '#a855f7',
  blue: '#3b82f6',
  gold: '#facc15',
  red: '#ef4444',
};

/** Hediye alış rozetinin başlangıç rengi görseldeki turuncu; üst seviyelerde ortak palet kullanılır. */
export const RECEIVED_BASE_COLOR = '#e58e46';

export const receivedColor = (tier) => (tier === 'green' ? RECEIVED_BASE_COLOR : TIER_COLORS[tier] || RECEIVED_BASE_COLOR);
export const sentColor = (tier) => TIER_COLORS[tier] || TIER_COLORS.green;

/** VIP rozeti: 5–7 altın, 8–9 kırmızı, 10–12 özel (mor-altın). */
export function vipStyle(level) {
  const value = Math.max(0, Math.floor(Number(level) || 0));
  if (value >= 10) {
    return { border: '#f1c40f', background: 'linear-gradient(135deg, #3b0764, #111827)', color: '#fde047' };
  }
  if (value >= 8) {
    return { border: '#ef4444', background: '#2a0f12', color: '#f87171' };
  }
  return { border: '#d4af37', background: '#333333', color: '#d4af37' };
}

/** VIP 8 ve üzeri isimler kırmızı yazılır. */
export const isRedNameVip = (level) => Math.floor(Number(level) || 0) >= 8;

/** N seviyesi rozeti: koyu yeşil zemin, gümüş kenar. */
export const N_BADGE_STYLE = { background: '#4b664d', border: '#cfd8dc', color: '#ffffff' };

export const giftLevelLabel = (level) => String(Math.max(0, Math.floor(Number(level) || 0)));

/** Merdivenler backend'deki base44/shared/userLevels.ts ile aynıdır. */
const N_COINS_PER_LEVEL = 1000000;
const N_MAX = 12;
const GIFT_LADDER_RATIO = 1.3;
const GIFT_MAX_LEVEL = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Süreli VIP: bitiş tarihi geçmişse rozet düşer (bitiş tarihi yazılmamışsa süresiz). */
export const vipActive = (user) => {
  const expiry = Date.parse(String(user?.vip_expires_at || ''));
  return Number.isNaN(expiry) ? true : expiry > Date.now();
};

/** Kalan VIP günü: süresiz VIP'de null döner. */
export const vipDaysLeft = (user) => {
  const expiry = Date.parse(String(user?.vip_expires_at || ''));
  if (Number.isNaN(expiry)) return null;
  return Math.max(0, Math.ceil((expiry - Date.now()) / DAY_MS));
};

/** N seviyesi: her 1.000.000 yüklenen coin +1 seviye. */
export const nLevelOf = (loadedCoins) => Math.min(N_MAX, Math.floor(Math.max(0, Number(loadedCoins) || 0) / N_COINS_PER_LEVEL));

/** Geçerli VIP seviyesi: süresi dolan VIP rozet sayılmaz. */
export const vipLevelOf = (user) => {
  const level = Math.max(0, Math.floor(Number(user?.vip_level) || 0));
  return vipActive(user) ? level : 0;
};

export const tierOf = (level) => (level >= 60 ? 'red' : level >= 50 ? 'gold' : level >= 40 ? 'blue' : level >= 30 ? 'purple' : level >= 20 ? 'dark' : 'green');

/** Hediye seviyesi backend ile aynı merdivenden hesaplanır (1 K → 1. seviye, %30 artış). */
const giftLevelOf = (kTotal) => {
  const k = Math.max(0, Number(kTotal) || 0);
  if (k < 1) return 0;
  return Math.min(GIFT_MAX_LEVEL, Math.floor(Math.log(k) / Math.log(GIFT_LADDER_RATIO)) + 1);
};

/** Kullanıcı kaydından rozet değerleri (N, VIP, hediye gönderme/alış). */
export function badgesFromUser(user) {
  const sent = giftLevelOf(user?.gift_sent_k);
  const received = giftLevelOf(user?.gift_received_k);
  return {
    n_level: nLevelOf(user?.loaded_coins),
    vip_level: vipLevelOf(user),
    vip_days_left: vipDaysLeft(user) || 0,
    gift_sent_level: sent,
    gift_sent_tier: tierOf(sent),
    gift_received_level: received,
    gift_received_tier: tierOf(received),
  };
}