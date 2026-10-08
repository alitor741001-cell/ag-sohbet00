import { FUTBOL_CRESTS } from './futbolAssets';

// ALTIN GOL kartları: sekiz takım, ortadaki çemberin üstünde dizilir.
// size: kartın boyu · x: ödeme çarpanı.
export const TEAMS = [
  { id: 'kartal', name: 'Beşiktaş', short: 'BJK', x: 40, size: 'big', crest: FUTBOL_CRESTS.kartal },
  { id: 'yildiz', name: 'Galatasaray', short: 'GS', x: 40, size: 'big', crest: FUTBOL_CRESTS.yildiz },
  { id: 'anka', name: 'Fenerbahçe', short: 'FB', x: 12, size: 'mid', crest: FUTBOL_CRESTS.anka },
  { id: 'efes', name: 'Trabzonspor', short: 'TS', x: 12, size: 'mid', crest: FUTBOL_CRESTS.efes },
  { id: 'firtina', name: 'Antalyaspor', short: 'ANT', x: 6, size: 'small', crest: FUTBOL_CRESTS.firtina },
  { id: 'gunes', name: 'Denizlispor', short: 'DEN', x: 6, size: 'small', crest: FUTBOL_CRESTS.gunes },
  { id: 'yesil', name: 'Bursaspor', short: 'BUR', x: 4, size: 'tiny', crest: FUTBOL_CRESTS.yesil },
  { id: 'marti', name: 'Adana Demirspor', short: 'ADS', x: 4, size: 'tiny', crest: FUTBOL_CRESTS.marti },
];

export const TEAM_MAP = TEAMS.reduce((acc, team) => ({ ...acc, [team.id]: team }), {});

// Çember dizilimi: ilk kart tepeden biraz sola kayar, sıra aşağı doğru ilerler.
// left/top: kartın merkezi (yüzde) · angle: ibrenin duracağı açı (12 yönünden saat yönü).
export const RING_SLOTS = [
  { left: 40.2, top: 13.3, angle: -15 },
  { left: 17.1, top: 31.0, angle: -60 },
  { left: 13.3, top: 59.8, angle: -105 },
  { left: 31.0, top: 82.9, angle: -150 },
  { left: 59.8, top: 86.7, angle: -195 },
  { left: 82.9, top: 69.0, angle: -240 },
  { left: 86.7, top: 40.2, angle: -285 },
  { left: 69.0, top: 17.1, angle: -330 },
];

// Kart yerleşimi sabit nesnelerle verilir: kartlar gereksiz yere yeniden çizilmez.
export const RING_STYLES = RING_SLOTS.map((slot) => ({ left: `${slot.left}%`, top: `${slot.top}%` }));

/** İbre açısı her zaman pozitif yönde ölçülür (saat yönü). */
export const needleAngle = (angle) => ((angle % 360) + 360) % 360;

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