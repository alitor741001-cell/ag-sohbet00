import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import {
  BET_LEVELS,
  BIG_WIN_MULTIPLE,
  FREE_SPINS,
  LINES,
  SCATTER_MIN,
  evaluateFruit,
  spinFruit,
} from '../../shared/fruitEngine.ts';
import { DEFAULT_BET, START_COINS, clampBet, loadWallet, nearestBet } from '../../shared/gameWallet.ts';

// ELİMİNSLOT: 6 sütun x 5 satır kare kart meyve slotu.
// Motor meyve oyunuyla aynıdır; bu oyunun bedava turları ve toplam kazancı ayrı sayılır.

// Üst şeritte gösterilen uygulama jackpotu: cüzdanda biriken havuzların toplamı.
const POOL_KEYS = ['mini', 'big', 'mega', 'xmega'];
const POOL_BASE: Record<string, number> = { mini: 5000, big: 25000, mega: 250000, xmega: 400000 };

function jackpotTotal(wallet: Record<string, any>) {
  return POOL_KEYS.reduce((sum, key) => sum + (wallet[`pool_${key}`] ?? POOL_BASE[key]), 0);
}

// Oyun ekranının gördüğü bakiye, bahis, bedava tur ve jackpot bilgisi.
function walletView(wallet: Record<string, any>) {
  return {
    coins: wallet.coins ?? START_COINS,
    bet: nearestBet(wallet.bet ?? DEFAULT_BET, BET_LEVELS),
    lines: LINES,
    spins: wallet.spins ?? 0,
    // Altın muzdan kazanılan bedava turlar bu oyuna özeldir.
    free_spins: wallet.elimin_free_spins ?? 0,
    free_max: FREE_SPINS,
    // Bu oyunun kendi toplam kazancı: oyunlar birbirinden ayrı sayılır.
    total_won: wallet.total_won_elimin ?? 0,
    jackpot: jackpotTotal(wallet),
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

      const grid = spinFruit();
      const result = evaluateFruit(grid, bet);
      const total = result.total;
      // 4 ve üzeri altın muz hem bonus öder hem bedava tur verir.
      const freeTrigger = grid.flat().filter((symbol) => symbol === 'banana').length >= SCATTER_MIN;
      const freeLeft = Math.max(0, freeTurns - (isFree ? 1 : 0)) + (freeTrigger ? FREE_SPINS : 0);
      const bigWin = stake > 0 && total >= stake * BIG_WIN_MULTIPLE;

      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + total,
        bet,
        elimin_free_spins: freeLeft,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + total,
        total_won_elimin: (wallet.total_won_elimin ?? 0) + total,
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
        big_win: bigWin ? total : 0,
      });
    }

    return Response.json({ ...walletView(wallet), grid: null, wins: [], win: 0 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}