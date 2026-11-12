import { isAgOfficial } from './agOfficial.ts';

// Baseline probability of a positive payout, before the role adjustment.
// Cluster games: multinomial calculation of initial-board winning events.
// Line games: 1,500,000 baseline boards calibrated against existing paylines.
// Keep these synchronized when symbols, weights or winning rules change.
const baseline = {
  fruit: 0.5103098422184145,
  seker: 0.5926397251891854,
  dede: 0.4141762593915147,
  elimin: 0.33700344380570924,
  slot: 0.38460733333333336,
  slotJackpot: 0.3887393333333333,
  sekerli: 0.5526173333333333,
};
// Choose hit/miss first, then sample a complete natural outcome conditionally.
// This scales probability, not win/loss odds or the amount paid per winning hit.
// Line-game rates have the statistical precision of their baseline calibration.
export async function personalGameResult(base44, user, game, draw, isWin) {
  if (!(game in baseline)) throw new Error('Geçersiz oyun oranı');
  const multiplier = await isAgOfficial(base44, user) ? 1.5 : 0.6;
  const target = Math.min(1, baseline[game] * multiplier);
  const hit = Math.random() < target;
  for (let attempt = 0; attempt < 256; attempt += 1) {
    const result = draw();
    if (Boolean(isWin(result)) === hit) return result;
  }
  throw new Error('Tur oluşturulamadı; bakiye değiştirilmedi. Tekrar deneyin.');
}