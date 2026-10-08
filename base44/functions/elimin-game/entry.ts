import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import {
  BET_LEVELS,
  BIG_WIN_MULTIPLE,
  FREE_SPINS,
  LINES,
  REELS,
  ROWS,
  SCATTER_MIN,
  evaluateFruit,
  spinFruit,
} from '../../shared/fruitEngine.ts';
import { DEFAULT_BET, START_COINS, clampBet, loadWallet, nearestBet } from '../../shared/gameWallet.ts';

// ELİMİNSLOT: 6 sütun x 5 satır kare kart meyve slotu.
// Motor meyve oyunuyla aynıdır; bu oyunun bedava turları, jackpot barı ve
// toplam kazancı ayrı sayılır.

// --- ek nesneler ---
// Tavuk: üç tanesi üç bedava tur verir. Zar: dört tanesi jackpotu patlatır ve
// biriken jackpotun yarısını öder. Sandık: jackpot barında birikir.
const CHICKEN_MIN = 3;
const CHICKEN_FREE_SPINS = 3;
const DICE_MIN = 4;
const CHEST_MAX = 10;
// Her sandık, bahsin bu katı kadar jackpot değeri ekler.
const JACKPOT_PER_CHEST = 100;
// Hücre başına ek nesne olasılığı: turda ~1,05 sandık, ~0,75 tavuk, ~0,45 zar.
const CHEST_CHANCE = 0.035;
const CHICKEN_CHANCE = 0.025;
const DICE_CHANCE = 0.015;

// Izgara meyve motoruyla üretilir, sonra karelerin bir kısmı ek nesnelerle değişir.
function spinElimin() {
  const grid = spinFruit();
  for (let reel = 0; reel < REELS; reel += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      const roll = Math.random();
      if (roll < DICE_CHANCE) grid[reel][row] = 'dice';
      else if (roll < DICE_CHANCE + CHICKEN_CHANCE) grid[reel][row] = 'chicken';
      else if (roll < DICE_CHANCE + CHICKEN_CHANCE + CHEST_CHANCE) grid[reel][row] = 'chest';
    }
  }
  return grid;
}

const countOf = (grid: string[][], id: string) =>
  grid.flat().filter((symbol) => symbol === id).length;

// Jackpot tutarı: barda biriken sandık sayısı x bahis x kademe.
const jackpotValue = (chests: number, bet: number) => Math.max(0, chests) * bet * JACKPOT_PER_CHEST;

// Oyun ekranının gördüğü bakiye, bahis, bedava tur ve jackpot bilgisi.
function walletView(wallet: Record<string, any>) {
  const bet = nearestBet(wallet.bet ?? DEFAULT_BET, BET_LEVELS);
  const chests = wallet.elimin_chests ?? 0;
  return {
    coins: wallet.coins ?? START_COINS,
    bet,
    lines: LINES,
    spins: wallet.spins ?? 0,
    // Altın muz ve tavuktan kazanılan bedava turlar bu oyuna özeldir.
    free_spins: wallet.elimin_free_spins ?? 0,
    free_max: FREE_SPINS,
    // Bu oyunun kendi toplam kazancı: oyunlar birbirinden ayrı sayılır.
    total_won: wallet.total_won_elimin ?? 0,
    // Jackpot barda biriken sandıklarla ve bahis kademesiyle yükselir.
    chests,
    jackpot: jackpotValue(chests, bet),
  };
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (error) {
      user = null;
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'state';
    const wallet = await loadWallet(base44, user);

    if (action === 'bet') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet });
      return Response.json({ ...walletView(updated), grid: null, wins: [], win: 0 });
    }

    if (action === 'spin') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const stake = bet * LINES;
      // Bedava tur hakkı varsa tur ücret almaz.
      const freeTurns = wallet.elimin_free_spins ?? 0;
      const isFree = freeTurns > 0;
      const cost = isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (!isFree && coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const grid = spinElimin();
      const result = evaluateFruit(grid, bet);
      const total = result.total;

      // Sandıklar barda birikir, on sandıkta durur.
      const chestGain = countOf(grid, 'chest');
      const chests = Math.min(CHEST_MAX, (wallet.elimin_chests ?? 0) + chestGain);
      // Zar dörtlüsü jackpotu patlatır: biriken tutarın yarısı ödenir, bar sıfırlanır.
      const jackpot = jackpotValue(chests, bet);
      const jackpotTrigger = countOf(grid, 'dice') >= DICE_MIN;
      const jackpotWin = jackpotTrigger ? Math.floor(jackpot / 2) : 0;
      const chestsLeft = jackpotTrigger ? 0 : chests;

      // 4 ve üzeri altın muz hem bonus öder hem bedava tur verir; tavuk üçlüsü
      // ayrıca üç bedava tur ekler.
      const freeTrigger = countOf(grid, 'banana') >= SCATTER_MIN;
      const freeAward = countOf(grid, 'chicken') >= CHICKEN_MIN ? CHICKEN_FREE_SPINS : 0;
      const freeLeft = Math.max(0, freeTurns - (isFree ? 1 : 0)) + (freeTrigger ? FREE_SPINS : 0) + freeAward;

      const payout = total + jackpotWin;
      const bigWin = stake > 0 && total >= stake * BIG_WIN_MULTIPLE;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + payout,
        bet,
        elimin_free_spins: freeLeft,
        elimin_chests: chestsLeft,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + payout,
        total_won_elimin: (wallet.total_won_elimin ?? 0) + payout,
        last_spin_at: new Date().toISOString(),
      });

      // Supabase aynası: bakiye iki altyapıda birden güncel kalır.
      waitUntil(mirrorRecord(base44, 'GameWallet', updated));

      return Response.json({
        ...walletView(updated),
        grid,
        wins: result.wins,
        win: total,
        cost,
        free_trigger: freeTrigger,
        free_award: freeAward,
        chicken_trigger: freeAward > 0,
        chest_gain: chestGain,
        jackpot_trigger: jackpotTrigger,
        jackpot_win: jackpotWin,
        jackpot_paid: jackpot,
        big_win: bigWin ? total : 0,
      });
    }

    return Response.json({ ...walletView(wallet), grid: null, wins: [], win: 0 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}