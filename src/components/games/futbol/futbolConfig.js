import { FUTBOL_CRESTS } from './futbolAssets';

// ALTIN GOL kartları: sekiz takım, dizilim görseldeki kemer düzenindedir.
// row: kartın sahadaki sırası · size: kartın boyu · x: ödeme çarpanı.
export const TEAMS = [
  { id: 'kartal', name: 'Beşiktaş', short: 'BJK', x: 40, size: 'big', row: 'a', crest: FUTBOL_CRESTS.kartal },
  { id: 'yildiz', name: 'Galatasaray', short: 'GS', x: 40, size: 'big', row: 'a', crest: FUTBOL_CRESTS.yildiz },
  { id: 'anka', name: 'Fenerbahçe', short: 'FB', x: 12, size: 'mid', row: 'b', crest: FUTBOL_CRESTS.anka },
  { id: 'efes', name: 'Trabzonspor', short: 'TS', x: 12, size: 'mid', row: 'b', crest: FUTBOL_CRESTS.efes },
  { id: 'firtina', name: 'Antalyaspor', short: 'ANT', x: 6, size: 'small', row: 'c', crest: FUTBOL_CRESTS.firtina },
  { id: 'gunes', name: 'Denizlispor', short: 'DEN', x: 6, size: 'small', row: 'c', crest: FUTBOL_CRESTS.gunes },
  { id: 'yesil', name: 'Bursaspor', short: 'BUR', x: 4, size: 'tiny', row: 'd', crest: FUTBOL_CRESTS.yesil },
  { id: 'marti', name: 'Adana Demirspor', short: 'ADS', x: 4, size: 'tiny', row: 'd', crest: FUTBOL_CRESTS.marti },
];

export const TEAM_MAP = TEAMS.reduce((acc, team) => ({ ...acc, [team.id]: team }), {});

// Kemer dizilimi: en dıştaki kartlar kalenin hizasında, alttakiler ortada.
export const PITCH_ROWS = ['a', 'b', 'c', 'd'];

// Oyun modları: kazanan her zaman sekiz takım arasından çekilir, mod yalnızca
// seçilebilecek kartları belirler — yani risk profilini.
export const MODES = [
  { id: 'normal', label: 'Normal', hint: 'sekiz takım da açık' },
  { id: 'gelismis', label: 'Gelişmiş', hint: 'sadece BJK, GS, FB ve TS' },
  { id: 'usta', label: 'Usta', hint: 'sadece ANT, DEN, BUR ve ADS' },
];

export const MODE_MAP = MODES.reduce((acc, mode) => ({ ...acc, [mode.id]: mode }), {});

// Bahis kademeleri: referanstaki dört para butonu.
export const STAKE_LEVELS = [10, 100, 1000, 10000];

export const formatCoins = (value) =>
  new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Kart üstündeki sayılar kısa gösterilir: 12.400 -> 12,4B. */
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