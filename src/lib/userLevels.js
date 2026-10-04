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
const N_THRESHOLDS = [50000, 150000, 300000, 600000, 1000000, 2000000, 4000000, 7000000, 12000000, 20000000, 35000000, 60000000];
const GIFT_LADDER_RATIO = 1.3;
const GIFT_MAX_LEVEL = 60;

const stepsPassed = (value, list) => {
  const amount = Math.max(0, Number(value) || 0);
  let level = 0;
  for (const threshold of list) {
    if (amount < threshold) break;
    level += 1;
  }
  return level;
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
    n_level: stepsPassed(user?.loaded_coins, N_THRESHOLDS),
    vip_level: Math.max(0, Math.floor(Number(user?.vip_level) || 0)),
    gift_sent_level: sent,
    gift_sent_tier: tierOf(sent),
    gift_received_level: received,
    gift_received_tier: tierOf(received),
  };
}