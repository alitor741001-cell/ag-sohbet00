// ŞEKERLİ MEYVE: şeker temalı 5x4 takla zinciri slotu.
// Sonuç sunucuda üretilir; buradaki tanımlar yalnızca ekranın gördüğü sembollerdir.

export const REELS = 5;
export const ROWS = 4;
// Toplam bahis = bahis x 20 satır (uygulamadaki diğer oyunlarla aynı kademe).
export const LINES = 20;
// Bahis kademeleri: sunucudaki kademelerle birebir.
export const BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];

export const WILD = 'rainbow';
export const SCATTER = 'star';

export const SYMBOLS = {
  pink: { name: 'Pembe Şeker', shape: 'bonbon', color: '#ff4fa3', light: '#ffd3ea', dark: '#9c0057' },
  blue: { name: 'Mavi Şeker', shape: 'cube', color: '#2f8bff', light: '#d3e7ff', dark: '#0a3d92' },
  green: { name: 'Yeşil Jelibon', shape: 'jelly', color: '#2fd24f', light: '#d6ffdd', dark: '#0b7423' },
  yellow: { name: 'Sarı Şeker', shape: 'lozenge', color: '#ffd21f', light: '#fff7c6', dark: '#a97500' },
  heart: { name: 'Kalp Şeker', shape: 'heart', color: '#ff3b4e', light: '#ffccd1', dark: '#960017' },
  lolli: { name: 'Bonus Şeker', shape: 'lolli', color: '#b45cff', light: '#efddff', dark: '#54178f' },
  [WILD]: { name: 'Gökkuşağı Şeker', shape: 'rainbow', color: '#ff7ad9', light: '#ffffff', dark: '#6d24ba', wild: true },
  [SCATTER]: { name: 'Yıldız Bonus', shape: 'star', color: '#ffb01f', light: '#fff4c9', dark: '#a85f00', scatter: true },
};

export const SYMBOL_IDS = Object.keys(SYMBOLS);

// Büyük kazanç eşikleri: tur kazancının toplam bahse oranı.
// Eşikler ölçümle seçildi: büyük kazanç ~%2, mega ~%0,3, efsane çok daha seyrek çıkar.
export const WIN_TIERS = [
  { id: 'efsane', min: 32, label: 'EFSANE KAZANÇ', tone: '#ff5ac8' },
  { id: 'mega', min: 16, label: 'MEGA KAZANÇ', tone: '#ff8a1f' },
  { id: 'buyuk', min: 7, label: 'BÜYÜK KAZANÇ', tone: '#ffd21f' },
];

export const tierFor = (win, totalBet) =>
  (totalBet > 0 ? WIN_TIERS.find((tier) => win >= tier.min * totalBet) || null : null);

export const formatCredits = (value) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value || 0)));

export const formatMult = (value) => {
  const rounded = Math.round((value || 0) * 10) / 10;
  return `${rounded.toLocaleString('tr-TR')}x`;
};