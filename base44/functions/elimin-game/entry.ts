import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import {
  BET_LEVELS,
  BIG_WIN_MULTIPLE,
  LINES,
  REELS,
  ROWS,
  evaluateFruit,
  spinFruit,
} from '../../shared/fruitEngine.ts';
import {
  DEFAULT_BET,
  SESSION_SPINS,
  START_COINS,
  clampBet,
  loadWallet,
  nearestBet,
  sessionPrice,
} from '../../shared/gameWallet.ts';

// ELİMİNSLOT: 6 sütun x 5 satır kare kart meyve slotu.
// Motor meyve oyunuyla aynıdır; bu oyunun jackpot barı ve toplam kazancı
// ayrı sayılır.

// --- ek nesneler ---
// Zar: dört tanesi jackpot havuzunu patlatır ve havuzun yarısını öder.
// Sandık: jackpot barında birikir, bar dolunca kendi birikimini öder.
// Tavuk: üç tanesi üç bedava tur verir.
const DICE_MIN = 4;
const CHEST_MAX = 10;
const CHICKEN_MIN = 3;
const FREE_SPINS = 3;
// Barda biriken her sandık, bahsin bu katı kadar değer taşır.
const JACKPOT_PER_CHEST = 20;
// Jackpot havuzu kaybedilen turlarla birikir, kazanan turlarda azalır; bu tabanın altına düşmez.
const JACKPOT_BASE = 200000;
// Kazanç seyrek gelsin: küme 10'da başlar, kademe sınırları 12 ve 15.
const ELIMIN_CLUSTER_MIN = 10;
const ELIMIN_CLUSTER_TIERS = [10, 12, 15];
// Hücre başına ek nesne olasılığı: turda ~0,12 sandık, ~0,30 tavuk, ~0,24 zar.
const CHEST_CHANCE = 0.004;
const CHICKEN_CHANCE = 0.01;
const DICE_CHANCE = 0.008;

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

// Sandık birikimi: barda kaç sandık varsa bahsin o kadar katı.
const chestValue = (chests: number, bet: number) => Math.max(0, chests) * bet * JACKPOT_PER_CHEST;

// Jackpot havuzu: sandıktan ayrıdır; kaybedilen turlar biriktirir, kazanan turlar azaltır.
const jackpotOf = (wallet: Record<string, any>) => Math.max(JACKPOT_BASE, wallet.elimin_jackpot ?? JACKPOT_BASE);

// Oyun ekranının gördüğü bakiye, bahis, bedava tur ve jackpot bilgisi.
function walletView(wallet: Record<string, any>) {
  const bet = nearestBet(wallet.bet ?? DEFAULT_BET, BET_LEVELS);
  const chests = wallet.elimin_chests ?? 0;
  return {
    coins: wallet.coins ?? START_COINS,
    bet,
    lines: LINES,
    spins: wallet.spins ?? 0,
    // Bu oyunun kendi toplam kazancı: oyunlar birbirinden ayrı sayılır.
    total_won: wallet.total_won_elimin ?? 0,
    // Sandık barı ve bar dolunca ödenecek birikim.
    chests,
    chest_value: chestValue(chests, bet),
    // Jackpot havuzu sandıktan ayrıdır: kaybedilenler birikir, kazançlar düşürür.
    jackpot: jackpotOf(wallet),
    // Üç tavuktan gelen bedava turlar.
    free_spins: wallet.elimin_free_spins ?? 0,
    // Satın alınan "15 çevirme hakkı" turu.
    session_spins: wallet.elimin_session_spins ?? 0,
    session_price: sessionPrice(bet),
    session_size: SESSION_SPINS,
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

    // 15 çevirme hakkı: bedel bahis kademesine göre baştan düşülür, turlar ücret almaz.
    if (action === 'session') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const price = sessionPrice(bet);
      if ((wallet.elimin_session_spins ?? 0) > 0) {
        return Response.json({ error: 'Devam eden çevirme hakkın var.' }, { status: 400 });
      }
      const coins = wallet.coins ?? START_COINS;
      if (coins < price) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - price,
        bet,
        elimin_session_spins: SESSION_SPINS,
      });
      return Response.json({ ...walletView(updated), grid: null, wins: [], win: 0 });
    }

    // Sandık barı dolunca sandığa basılır: barda biriken tutar bakiyeye eklenir, bar sıfırlanır.
    if (action === 'chest') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const chests = wallet.elimin_chests ?? 0;
      if (chests < CHEST_MAX) return Response.json({ error: 'Sandık barı henüz dolmadı.' }, { status: 400 });
      const amount = chestValue(chests, bet);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: (wallet.coins ?? START_COINS) + amount,
        bet,
        elimin_chests: 0,
        total_won: (wallet.total_won ?? 0) + amount,
        total_won_elimin: (wallet.total_won_elimin ?? 0) + amount,
        last_spin_at: new Date().toISOString(),
      });
      // Supabase aynası: bakiye iki altyapıda birden güncel kalır.
      waitUntil(mirrorRecord(base44, 'GameWallet', updated));
      return Response.json({ ...walletView(updated), grid: null, wins: [], win: 0, chest_win: amount });
    }

    if (action === 'bet') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet });
      return Response.json({ ...walletView(updated), grid: null, wins: [], win: 0 });
    }

    if (action === 'spin') {
      const bet = clampBet(body.bet, BET_LEVELS, wallet.bet ?? DEFAULT_BET);
      const stake = bet * LINES;
      // Bedava tur ve satın alınan çevirme hakkı turları ücret almaz.
      const freeTurns = wallet.elimin_free_spins ?? 0;
      const sessionTurns = wallet.elimin_session_spins ?? 0;
      const inSession = sessionTurns > 0;
      const isFree = freeTurns > 0 || inSession;
      const cost = isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const grid = spinElimin();
      // Küme eşiği bu oyunda daha yüksektir: kazanç daha seyrek gelir.
      const result = evaluateFruit(grid, bet, { clusterMin: ELIMIN_CLUSTER_MIN, tiers: ELIMIN_CLUSTER_TIERS });
      const total = result.total;

      // Sandıklar barda birikir, on sandıkta durur.
      const chestGain = countOf(grid, 'chest');
      const chests = Math.min(CHEST_MAX, (wallet.elimin_chests ?? 0) + chestGain);

      // Zar dörtlüsü jackpot havuzunu patlatır: havuzun yarısı ödenir.
      const pool = jackpotOf(wallet);
      const jackpotTrigger = countOf(grid, 'dice') >= DICE_MIN;
      const jackpotWin = jackpotTrigger ? Math.floor(pool / 2) : 0;

      // Üç tavuk üç bedava tur verir; bedava turlar sırayla çevrilir.
      const freeTrigger = countOf(grid, 'chicken') >= CHICKEN_MIN;
      const freeLeft = Math.max(0, freeTurns - (inSession ? 0 : isFree ? 1 : 0)) + (freeTrigger ? FREE_SPINS : 0);

      const sessionLeft = Math.max(0, sessionTurns - (inSession ? 1 : 0));

      const payout = total + jackpotWin;
      // Jackpot havuzu: kaybedilen tur birikir, kazanan tur düşürür.
      const jackpot = Math.max(JACKPOT_BASE, pool + cost - payout);
      const bigWin = stake > 0 && total >= stake * BIG_WIN_MULTIPLE;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + payout,
        bet,
        elimin_free_spins: freeLeft,
        elimin_chests: chests,
        elimin_jackpot: jackpot,
        elimin_session_spins: sessionLeft,
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
        chest_gain: chestGain,
        free_trigger: freeTrigger,
        free_gain: freeTrigger ? FREE_SPINS : 0,
        jackpot_trigger: jackpotTrigger,
        jackpot_win: jackpotWin,
        big_win: bigWin ? total : 0,
      });
    }

    return Response.json({ ...walletView(wallet), grid: null, wins: [], win: 0 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}