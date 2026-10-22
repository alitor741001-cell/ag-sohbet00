export const VIP_LEVELS = [5, 6, 7, 8, 9, 10, 11, 12];
const ROOT = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/';
export const VIP_THEMES = [
  [5, 'Ateşin Hükümdarı', '#ff8547', '#f3ce78', 'f211b09b5', 'flame'],
  [6, 'Karanlık Muhafız', '#ec633e', '#d4a357', '8aacc8c61', 'armor'],
  [7, 'Altın Efsane', '#f6d575', '#c28a35', '62f223180', 'twin'],
  [8, 'Kristal Kraliçesi', '#efabd9', '#ae8aef', '761675b6a', 'crystal'],
  [9, 'Zümrüt Hanedanı', '#73e4b2', '#eed18b', '77794d712', 'serpent'],
  [10, 'Yakut İmparatoru', '#ff6585', '#be8c58', 'a5d71093e', 'ruby'],
  [11, 'Safir Gökyüzü', '#8fc9ff', '#bd9afa', '535e89ae4', 'sapphire'],
  [12, 'Kozmik Egemen', '#d7b0ff', '#ffe1a1', '5f317dd93', 'cosmic'],
].map(([level, name, accent, secondary, image, shape]) => ({ level, name, accent, secondary, image: ROOT + image + '_generated_image.png', shape, days: 30 }));
export const VIP_FEATURES = [
  { key: 'badge', label: 'VIP Rozeti', minLevel: 5, supported: true },
  { key: 'name', label: 'İsim Rengi', minLevel: 5, supported: true },
  { key: 'frame', label: 'Avatar Çerçevesi', minLevel: 5, supported: true },
  { key: 'mic', label: 'Ses Dalgası', minLevel: 5, supported: true },
  { key: 'bubble', label: 'Sohbet Balonu', minLevel: 5, supported: true },
  { key: 'card', label: 'Profil Kartı', minLevel: 5, supported: true },
  { key: 'banner', label: 'Giriş Efekti', minLevel: 5, supported: true },
  { key: 'name-animation', label: 'İsim Animasyonu', minLevel: 11, supported: true, cosmetic: false },
  { key: 'visitors', label: 'VIP Ziyaretçi Yetkisi', minLevel: 6, supported: false, cosmetic: false },
  { key: 'stealth-visit', label: 'Gizli Profil Ziyareti', minLevel: 10, supported: false, cosmetic: false },
  { key: 'avatar', label: 'Hareketli Avatar', minLevel: 8, supported: false },
  { key: 'stickers', label: 'VIP Çıkartmalar', minLevel: 8, supported: false },
  { key: 'room-privacy', label: 'Oda Takibini Kapat', minLevel: 9, supported: false },
  { key: 'vip-gift', label: 'VIP Üyelik Hediye Et', minLevel: 5, supported: true, cosmetic: false },
];
export async function getVipCatalog(base44) {
  const rows = await base44.asServiceRole.entities.AppConfig.filter({ key: 'vip-system-v2' }, '-created_date', 1);
  const saved = rows[0]?.value ? JSON.parse(rows[0].value) : {};
  const features = VIP_FEATURES.map((feature) => ({ ...feature, minLevel: (saved.features || []).find((row) => row.key === feature.key)?.minLevel || feature.minLevel }));
  const animationFrom = features.find((feature) => feature.key === 'name-animation').minLevel;
  return {
    levels: VIP_THEMES.map((theme) => ({ ...theme, ...(saved.levels || []).find((row) => row.level === theme.level), nameAnimated: theme.level >= animationFrom })),
    features,
  };
}
export function validateVipCatalog(input) {
  if (!input || !Array.isArray(input.levels) || input.levels.length !== 8) throw new Error('Sekiz VIP seviyesi gerekli.');
  const levels = VIP_THEMES.map((theme) => {
    const value = input.levels.find((row) => row.level === theme.level);
    if (!value || !Number.isInteger(value.days) || value.days < 1 || value.days > 365) throw new Error('Süre 1–365 gün olmalı.');
    if (!/^#[0-9a-f]{6}$/i.test(value.accent) || !/^#[0-9a-f]{6}$/i.test(value.secondary)) throw new Error('Geçersiz tema rengi.');
    const image = new URL(String(value.image));
    if (image.protocol !== 'https:' || image.href.length > 1200) throw new Error('Görsel HTTPS olmalı.');
    const name = String(value.name || '').trim().slice(0, 60);
    if (!name) throw new Error('Tema adı gerekli.');
    return { ...theme, name, days: value.days, image: image.href, accent: value.accent, secondary: value.secondary };
  });
  const features = VIP_FEATURES.map((feature) => {
    const minLevel = input.features?.find((row) => row.key === feature.key)?.minLevel || feature.minLevel;
    if (!VIP_LEVELS.includes(minLevel)) throw new Error('Ayrıcalıklar VIP 5–12 arasında olmalı.');
    return { key: feature.key, minLevel };
  });
  return { levels, features };
}