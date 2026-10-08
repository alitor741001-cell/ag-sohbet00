import { FUTBOL_CRESTS } from './futbolAssets';

// ALTIN GOL kartları: sekiz takım, kendi arması ve çarpanıyla.
// Çarpan aynı zamanda ödemedir: kazanan karta konan bahis x çarpan olarak döner.
export const TEAMS = [
  { id: 'kartal', name: 'İstanbul Kartalı', short: 'İSTANBUL', x: 40, size: 'big', crest: FUTBOL_CRESTS.kartal },
  { id: 'yildiz', name: 'Boğaz Yıldızı', short: 'BOĞAZ', x: 40, size: 'big', crest: FUTBOL_CRESTS.yildiz },
  { id: 'anka', name: 'Ankara Ankası', short: 'ANKARA', x: 12, size: 'mid', crest: FUTBOL_CRESTS.anka },
  { id: 'efes', name: 'İzmir Efesi', short: 'İZMİR', x: 12, size: 'mid', crest: FUTBOL_CRESTS.efes },
  { id: 'firtina', name: 'Trabzon Fırtınası', short: 'TRABZON', x: 6, size: 'small', crest: FUTBOL_CRESTS.firtina },
  { id: 'gunes', name: 'Adana Güneşi', short: 'ADANA', x: 6, size: 'small', crest: FUTBOL_CRESTS.gunes },
  { id: 'yesil', name: 'Bursa Yeşili', short: 'BURSA', x: 4, size: 'small', crest: FUTBOL_CRESTS.yesil },
  { id: 'marti', name: 'Antalya Martısı', short: 'ANTALYA', x: 4, size: 'small', crest: FUTBOL_CRESTS.marti },
];

export const TEAM_MAP = TEAMS.reduce((acc, team) => ({ ...acc, [team.id]: team }), {});

// Oyun modları: kazanan her zaman sekiz takım arasından çekilir, mod yalnızca
// seçilebilecek kartları belirler — yani risk profilini.
export const MODES = [
  { id: 'normal', label: 'Normal', hint: 'Sekiz takım da açık' },
  { id: 'gelismis', label: 'Gelişmiş', hint: 'Sadece x40 ve x12 kartları' },
  { id: 'usta', label: 'Usta', hint: 'Sadece x6 ve x4 kartları' },
];

export const MODE_MAP = MODES.reduce((acc, mode) => ({ ...acc, [mode.id]: mode }), {});

// Bahis kademeleri: referanstaki dört para butonu.
export const STAKE_LEVELS = [10, 100, 1000, 10000];

export const formatCoins = (value) =>
  new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Uzun sayıları kart üstünde kısa gösterir: 12.400 -> 12,4B. */
export const compactCoins = (value) => {
  const amount = Math.max(0, Math.round(value || 0));
  if (amount < 1000) return String(amount);
  if (amount < 1000000) return `${(amount / 1000).toFixed(amount < 10000 ? 1 : 0).replace('.', ',')}B`;
  return `${(amount / 1000000).toFixed(1).replace('.', ',')}M`;
};

export const formatClock = (ms) => {
  const total = Math.max(0, Math.ceil((ms || 0) / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};