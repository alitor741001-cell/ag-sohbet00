import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { playDede, SCATTER_MIN as DEDE_SCATTER, LINES as DEDE_LINES } from '../../shared/dedeEngine.ts';
import { playFruit, LINES as FRUIT_LINES, SCATTER_MIN as FRUIT_SCATTER, FREE_SPINS as FRUIT_FREE } from '../../shared/fruitEngine.ts';
import { spinSekerli, LINES as SEKERLI_LINES } from '../../shared/sekerliEngine.ts';
import { POOL_DEFAULTS, poolRules, settle } from '../../shared/gamePool.ts';
import { playElimin, FREE_SPINS as ELIMIN_FREE, JACKPOT_MULTIPLE, CHEST_MULTIPLE } from '../../shared/eliminEngine.ts';

// Geçici ölçüm: her oyunun ham ödeme oranı ve bedava tur verme sıklığı.
const BET = 100;

function sim(game, n) {
  let raw = 0; let grants = 0; let hits = 0;
  let fRaw = 0; let fGrants = 0; let fSpins = 0;
  if (game === 'fruit') {
    const stake = BET * FRUIT_LINES;
    for (let i = 0; i < n; i += 1) {
      const r = playFruit(BET);
      raw += r.total / stake; if (r.total > 0) hits += 1;
      if (r.initial.flat().filter((s) => s === 'banana').length >= FRUIT_SCATTER) grants += FRUIT_FREE;
    }
    return { rb: raw / n, qb: grants / n, rf: raw / n, qf: grants / n, hit: hits / n };
  }
  if (game === 'sekerli') {
    for (let i = 0; i < n; i += 1) {
      const r = spinSekerli();
      raw += r.units / SEKERLI_LINES; if (r.units > 0) hits += 1;
    }
    return { rb: raw / n, qb: 0, rf: raw / n, qf: 0, hit: hits / n };
  }
  if (game === 'elimin') {
    const stake = BET * FRUIT_LINES;
    for (let i = 0; i < n; i += 1) {
      const r = playElimin(BET);
      const value = r.total / stake + (r.jackpotTrigger ? JACKPOT_MULTIPLE : 0) + r.chestGain * CHEST_MULTIPLE;
      raw += value; if (r.total > 0 || r.jackpotTrigger) hits += 1;
      if (r.freeTrigger) grants += ELIMIN_FREE;
    }
    return { rb: raw / n, qb: grants / n, rf: raw / n, qf: grants / n, hit: hits / n };
  }
  // dede: taban turlar ve 15'lik oturumlar ayrı ölçülür.
  const stake = BET * DEDE_LINES;
  const baseN = Math.floor(n * 0.6);
  for (let i = 0; i < baseN; i += 1) {
    const r = playDede(BET, false, 0);
    raw += r.total / stake; if (r.total > 0) hits += 1;
    if (r.scatterCount >= DEDE_SCATTER) grants += 15;
  }
  let budget = n - baseN;
  while (budget > 0) {
    let left = 15; let carried = 0;
    while (left > 0 && budget > 0) {
      const r = playDede(BET, true, carried);
      fRaw += r.total / stake; fSpins += 1; budget -= 1; left -= 1;
      carried = r.accumulated;
      if (r.scatterCount >= DEDE_SCATTER) { left += 15; fGrants += 15; }
    }
  }
  return { rb: raw / baseN, qb: grants / baseN, rf: fRaw / fSpins, qf: fGrants / fSpins, hit: hits / baseN };
}

// Uçtan uca doğrulama: ücretli turlar + verilen bedava turlar, katsayı ve limitlerle.
function verify(game, n) {
  const rules = poolRules({ game, ...POOL_DEFAULTS });
  const pool = { balance: 1e15 };
  const kinds = { fruit: FRUIT_LINES, sekerli: SEKERLI_LINES, elimin: FRUIT_LINES, dede: DEDE_LINES };
  const stake = BET * kinds[game];
  let bet = 0; let paidOut = 0; let hits = 0;
  const tiers = { small: 0, medium: 0, big: 0, huge: 0 };
  const play = (free, carried) => {
    if (game === 'fruit') { const r = playFruit(BET); return { m: r.total / stake, g: r.initial.flat().filter((s) => s === 'banana').length >= FRUIT_SCATTER ? FRUIT_FREE : 0 }; }
    if (game === 'sekerli') { const r = spinSekerli(); return { m: r.units / SEKERLI_LINES, g: 0 }; }
    if (game === 'elimin') { const r = playElimin(BET); return { m: r.total / stake + (r.jackpotTrigger ? JACKPOT_MULTIPLE : 0) + r.chestGain * CHEST_MULTIPLE, g: r.freeTrigger ? ELIMIN_FREE : 0 }; }
    const r = playDede(BET, free, carried); return { m: r.total / stake, g: r.scatterCount >= DEDE_SCATTER ? 15 : 0, acc: r.accumulated };
  };
  for (let i = 0; i < n; i += 1) {
    bet += stake;
    const base = play(false, 0);
    const s = settle(pool, rules, { value: stake, rawMultiple: base.m, free: false, paid: stake });
    paidOut += s.payout; if (s.payout > 0) { hits += 1; tiers[s.tier] += 1; }
    let left = base.g; let won = 0; let carried = 0;
    while (left > 0) {
      left -= 1;
      const f = play(true, carried);
      carried = game === 'dede' ? f.acc : 0;
      const fs = settle(pool, rules, { value: stake, rawMultiple: f.m, free: true, bonusWon: won, paid: 0 });
      won += fs.payout; paidOut += fs.payout;
      left += f.g;
    }
  }
  return { rtp: paidOut / bet, hit: hits / n, tiers };
}

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const started = Date.now();
  const result = body.verify ? verify(body.game, body.n || 20000) : sim(body.game, body.n || 20000);
  return Response.json({ game: body.game, n: body.n, ms: Date.now() - started, ...result });
}