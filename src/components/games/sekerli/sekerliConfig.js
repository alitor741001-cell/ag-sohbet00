// ŞEKERLİ MEYVE: şeker temalı demo slotu — semboller, ödeme tablosu, satırlar ve kademeler.
// Tamamı özgün: sembol isimleri, şekilleri ve renkleri bu oyuna ait.

export const REELS = 5;
export const ROWS = 4;
export const LINES = 20;
// Demo kredi: gerçek para yok, yalnızca oyun içi kredi.
export const START_CREDITS = 10000;
export const REFILL_CREDITS = 10000;
// Bahis kademeleri satır başına verilir; tur bedeli = bahis x 20 satır.
export const BET_LEVELS = [1, 2, 5, 10, 25, 50, 100];

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

// Çekiliş ağırlıkları: düşük semboller sık, özel semboller seyrek gelir.
// Yıldız bonusu seyrektir: bedava çevrim turu yaklaşık her 30 turda bir tetiklenir.
const WEIGHTS = { pink: 22, blue: 20, yellow: 17, green: 14, heart: 11, lolli: 8, rainbow: 5, star: 3 };
const BAG = SYMBOL_IDS.flatMap((id) => Array.from({ length: WEIGHTS[id] || 1 }, () => id));

export const randomSymbol = () => BAG[Math.floor(Math.random() * BAG.length)];

// Ödeme tablosu: satır başına bahis katsayısı (soldan sağa 3/4/5 aynı sembol).
// Değerler demo turunun uzun süre oynanabilmesi için dengelendi (toplam geri ödeme ~%96).
export const PAYTABLE = {
  pink: { 3: 2, 4: 6, 5: 18 },
  blue: { 3: 2, 4: 8, 5: 22 },
  yellow: { 3: 3, 4: 9, 5: 27 },
  green: { 3: 3, 4: 12, 5: 38 },
  heart: { 3: 4, 4: 22, 5: 75 },
  lolli: { 3: 8, 4: 38, 5: 150 },
  [WILD]: { 3: 8, 4: 38, 5: 150 },
};

// Yıldız bonus: toplam bahis üzerinden öder ve bedava çevrim verir.
export const SCATTER_PAY = { 3: 2, 4: 10, 5: 50 };
export const SCATTER_FREE = { 3: 10, 4: 15, 5: 20 };

// 20 ödeme satırı: her satır 5 sütunun satır indekslerini taşır.
export const PAYLINES = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0],
  [3, 2, 1, 2, 3],
  [1, 0, 1, 2, 1],
  [2, 3, 2, 1, 2],
  [0, 0, 1, 2, 3],
  [3, 3, 2, 1, 0],
  [1, 2, 2, 2, 1],
  [2, 1, 1, 1, 2],
  [0, 1, 1, 1, 0],
  [3, 2, 2, 2, 3],
  [1, 1, 2, 1, 1],
  [2, 2, 1, 2, 2],
  [0, 2, 1, 2, 0],
  [3, 1, 2, 1, 3],
  [1, 3, 2, 3, 1],
  [2, 0, 2, 0, 2],
];

// Takla zinciri çarpanı: her yeni kazanç dalgasında bir kademe yükselir.
export const CASCADE_MULT = [1, 1, 2, 3, 5];

// Büyük kazanç eşikleri: tur kazancının toplam bahse oranı.
// Eşikler ölçümle seçildi: büyük kazanç ~%1, mega ~%0,1, efsane çok daha seyrek çıkar.
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