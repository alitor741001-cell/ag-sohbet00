import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';
import { recordLeaderWin } from '../../shared/gameLeaders.ts';
import { personalGameResult } from '../../shared/personalGameOdds.ts';
import { LINES, BET_LEVELS, BIG_WIN_MULTIPLE, spinReels, evaluateGrid } from '../../shared/slotEngine.ts';
import { DEFAULT_BET, START_COINS, clampBet, loadWallet, nearestBet } from '../../shared/gameWallet.ts';
import { allowedLevels, commitPool, loadPool, nextBonusState, poolState, settle, spinKind, withPoolState } from '../../shared/gamePool.ts';
import { slotPoolRules, slotPaidWins, alignSlotPools } from '../../shared/slotPool.ts';

// Bu tutar ve üzeri kazançlar büyük kazanç tablosuna girer.
const BIG_WIN_TABLE_MIN = 20000;
// Jackpot: ekranda 5 jackpot sembolü geldiğinde bahsin 120 katı ödenir.
const JACKPOT_SYMBOLS = 5;
const JACKPOT_MULTIPLE = 120;
// En düşük kademelerde jackpot çıkmaz: toplam bahis (bahis × 50 satır) 5.000'i geçmelidir.
const JACKPOT_MIN_STAKE = 5000;
// Ücretsiz çevirme: ekranda 3 'free' sembolü gelince 3 çevirme hakkı verilir.
const FREE_SYMBOLS = 3;
const FREE_SPINS = 3;
// Havuzlar: kaybedilen turda bahis, kazanılan turda kazanç tutarı o anki bahis kademesinin havuzunda işler.
const POOL_BASE = { mini: 5000, big: 25000, mega: 250000, xmega: 400000 };
const POOL_KEYS = Object.keys(POOL_BASE);

// Toplam bahis kademesi hangi havuzu besler (küçük bahisler MINI'de birikir).
function poolKeyForTotalBet(totalBet) {
  if (totalBet <= 25000) return 'mini';
  if (totalBet <= 50000) return 'big';
  return 'mega';
}

// Havuzlar ortaktır: tek kayıttan okunur, bütün oyuncular aynı rakamı görür.
const POOLS_KEY = 'slot_pools';

// Havuz tutarları: kayıtlı değer yoksa taban değerden başlar.
function poolValues(stored) {
  const source = stored || {};
  return POOL_KEYS.reduce((pools, key) => {
    const value = Math.round(Number(source[key]));
    pools[key] = Number.isFinite(value) && value >= 0 ? value : POOL_BASE[key];
    return pools;
  }, {});
}

// Ortak havuz kaydı: ana sayfadaki ve odadaki oyun aynı kaydı okur.
async function loadPools(base44) {
  const found = await base44.asServiceRole.entities.AppConfig
    .filter({ key: POOLS_KEY }, '-created_date', 1)
    .catch(() => null);
  let stored = {};
  try {
    stored = JSON.parse(found?.[0]?.value || '{}');
  } catch (error) {
    stored = {};
  }
  return { id: found?.[0]?.id || '', pools: poolValues(stored) };
}

// Turun havuz değişimi ortak kayda yazılır.
async function savePools(base44, id, pools) {
  const value = JSON.stringify(pools);
  if (id) return base44.asServiceRole.entities.AppConfig.update(id, { value }).catch(() => null);
  return base44.asServiceRole.entities.AppConfig.create({ key: POOLS_KEY, value }).catch(() => null);
}

// Jackpot havuzu: diğer havuzlarda birikenlerin toplamıdır.
function jackpotTotal(pools) {
  return POOL_KEYS.reduce((sum, key) => sum + pools[key], 0);
}
function walletView(wallet, isAdmin = false, storedPools = null, levels = BET_LEVELS) {
  const pools = poolValues(storedPools);
  const jackpot = jackpotTotal(pools);
  return {
    coins: wallet.coins ?? START_COINS,
    unlimited: false,
    no_limit: false,
    bet: nearestBet(wallet.bet ?? DEFAULT_BET, levels),
    bet_levels: levels,
    lines: LINES,
    spins: wallet.spins ?? 0,
    grand: jackpot,
    pools: { jackpot, ...pools },
    free_spins: wallet.free_spins ?? 0,
  };
}

// Bahis kademesi ve cüzdan yükleme paylaşılan modülden gelir: shared/gameWallet.ts

// Büyük ödülü oda sohbetine duyurur (tutar sunucuda hesaplanır).
async function announceBigWin(base44, user, roomId, amount, name) {
  const room = await base44.asServiceRole.entities.Room.get(roomId).catch(() => null);
  if (!room) return false;
  const isOwner = room.owner_id === user.id;
  const isParticipant = (room.participants || []).some((person) => person.user_id === user.id);
  if (!isOwner && !isParticipant) return false;
  const formatted = new Intl.NumberFormat('tr-TR').format(Math.round(amount));
  await base44.asServiceRole.entities.RoomMessage.create({
    room_id: roomId,
    user_id: user.id,
    user_name: name,
    user_avatar: user.avatar || '',
    type: 'slot_win',
    text: `🎰 BÜYÜK ÖDÜL! ${name}, slot oyununda ${formatted} coin kazandı!`,
  });
  return true;
}

export default async function (req) {
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

    // Canlı kazanan tablosu: en çok coin kazanan kullanıcılar.
    if (action === 'leaders') {
      const wallets = await base44.asServiceRole.entities.GameWallet.list('-total_won', 12);
      const leaders = wallets
        .filter((item) => (item.total_won ?? 0) > 0)
        .slice(0, 5)
        .map((item, index) => ({
          rank: index + 1,
          user_id: item.user_id,
          name: item.user_name || 'Kullanıcı',
          won: item.total_won ?? 0,
          coins: item.coins ?? 0,
        }));
      return Response.json({ leaders, me: user.id });
    }

    // Büyük kazanç tablosu: 20.000 coin ve üzeri turlar, profil ve gelen sembolle.
    if (action === 'bigwins') {
      const spins = await base44.asServiceRole.entities.GameSpin.list('-created_date', 80);
      const winners = spins
        .filter((spin) => (spin.win ?? 0) >= BIG_WIN_TABLE_MIN)
        .slice(0, 12)
        .map((spin) => ({
          id: spin.id,
          user_id: spin.user_id,
          name: spin.user_name || 'Kullanıcı',
          avatar: spin.user_avatar || '',
          won: spin.win ?? 0,
          symbol: spin.symbol || '',
          symbols: (spin.symbols || []).length ? spin.symbols : (spin.symbol ? [spin.symbol] : []),
          at: spin.created_date,
        }));
      return Response.json({ winners, me: user.id, min: BIG_WIN_TABLE_MIN });
    }

    // Ortak havuz rakamları: cüzdan okunmadan, bütün oyunculara aynı kayıttan.
    if (action === 'pools') {
      const stored = await loadPools(base44);
      const pool = await loadPool(base44, 'slot');
      const pools = alignSlotPools(stored.pools, pool.balance);
      const jackpot = jackpotTotal(pools);
      return Response.json({ grand: jackpot, pools: { jackpot, ...pools } });
    }

    const wallet = await loadWallet(base44, user);
    // Yönetici hesabında coin sınırı yoktur.
    const isAdmin = user.role === 'admin';
    // Havuzlar ortak kayıttan gelir: her oyuncuda aynı jackpot rakamları görünür.
    const poolRecord = await loadPools(base44);
    const pool = await loadPool(base44, 'slot');
    poolRecord.pools = alignSlotPools(poolRecord.pools, pool.balance);
    const levels = allowedLevels(slotPoolRules(pool, true), BET_LEVELS, LINES);

    // Kazanç geçmişi: kullanıcının son turları ve toplam kazancı.
    if (action === 'history') {
      const spins = await base44.entities.GameSpin.filter({ user_id: user.id }, '-created_date', 20);
      return Response.json({
        spins: spins.map((spin) => ({
          id: spin.id,
          bet: spin.bet ?? 0,
          cost: spin.cost ?? 0,
          win: spin.win ?? 0,
          coins: spin.coins_after ?? 0,
          big_win: !!spin.big_win,
          jackpot: spin.jackpot ?? 0,
          at: spin.created_date,
        })),
        summary: {
          total_won: wallet.total_won_slot ?? 0,
          spins: wallet.spins ?? 0,
          coins: wallet.coins ?? START_COINS,
        },
      });
    }

    if (action === 'bet') {
      const bet = clampBet(body.bet, levels, nearestBet(wallet.bet ?? DEFAULT_BET, levels));
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet });
      return Response.json({ ...walletView(updated, isAdmin, poolRecord.pools, levels), grid: null, wins: [], win: 0 });
    }

    if (action === 'spin') {
      const bet = clampBet(body.bet, levels, nearestBet(wallet.bet ?? DEFAULT_BET, levels));
      const stake = bet * LINES;
      // Ücretsiz çevirme hakkı varsa tur bedava oynanır.
      const isFree = (wallet.free_spins ?? 0) > 0;
      const state = poolState(wallet, 'slot');
      const kind = spinKind(state, { sessionTurns: 0, freeTurns: wallet.free_spins ?? 0, stake, sessionFallback: stake });
      const rules = slotPoolRules(pool, stake > JACKPOT_MIN_STAKE);
      const cost = isFree ? 0 : stake;
      const coins = wallet.coins ?? START_COINS;
      if (!isFree && coins < cost) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });

      const selected = await personalGameResult(base44, user, stake > JACKPOT_MIN_STAKE ? 'slotJackpot' : 'slot', () => {
        const grid = spinReels();
        return { grid, result: evaluateGrid(grid, bet) };
      }, outcome => outcome.result.total > 0 || (stake > JACKPOT_MIN_STAKE && outcome.grid.flat().filter(symbol => symbol === 'jackpot').length >= JACKPOT_SYMBOLS));
      const { grid, result } = selected;
      // Ekranda 5 jackpot sembolü geldiğinde jackpot çıkar: bahsin 120 katı ödenir.
      // Toplam bahis 5.000'i geçmeyen (en düşük kademe) turlarda jackpot çıkmaz.
      const jackpotHit = stake > JACKPOT_MIN_STAKE
        && grid.flat().filter((symbol) => symbol === 'jackpot').length >= JACKPOT_SYMBOLS;
      const jackpotPayout = jackpotHit ? bet * JACKPOT_MULTIPLE : 0;
      const rawTotal = result.total + jackpotPayout;
      const paid = settle(pool, rules, { value: kind.value, rawMultiple: rawTotal / stake, free: isFree, bonusWon: isFree ? state.bonus_won || 0 : 0, paid: cost });
      const total = paid.payout;
      const display = slotPaidWins(result.wins, jackpotPayout, total, rawTotal);
      // Ücretsiz çevirme: 3 'free' sembolü gelince 3 hak verilir, sonraki turlar bedava.
      const freeCount = grid.flat().filter((symbol) => symbol === 'free').length;
      const freeTrigger = freeCount >= FREE_SYMBOLS;
      const freeSpins = Math.max(0, (wallet.free_spins ?? 0) - (isFree ? 1 : 0)) + (freeTrigger ? FREE_SPINS : 0);
      // Ekrandaki alt havuzlar, tek ödeme fonunun dağılımıdır; ikinci bir ödeme yapılmaz.
      const pools = { ...poolRecord.pools };
      const poolKey = poolKeyForTotalBet(stake);
      pools[poolKey] += Math.round(cost * rules.rtp / 100);
      let debit = total;
      for (const key of [poolKey, ...POOL_KEYS.filter(key => key !== poolKey)]) {
        const amount = Math.min(debit, pools[key]);
        pools[key] -= amount;
        debit -= amount;
      }
      await commitPool(base44, pool, rules, { paid: cost, payout: total, tier: paid.tier, spin: true });
      // Jackpot havuzu: bütün havuzlarda birikenlerin toplamı.
      const grand = jackpotTotal(pools);
      const bigWin = stake > 0 && total >= stake * BIG_WIN_MULTIPLE;
      const name = user.username || user.full_name || 'Kullanıcı';
      // Tabloda gösterilecek sembol: jackpot önceliklidir, yoksa en yüksek kazançlı sembol.
      const bestWin = result.wins.reduce((best, item) => (!best || item.amount > best.amount ? item : best), null);
      const bestSymbol = jackpotHit ? 'jackpot' : bestWin?.symbol || '';
      // Şeritte gösterilecek semboller: jackpot ve kazandıran semboller (en fazla 3).
      const symbols = [...new Set([...(jackpotHit ? ['jackpot'] : []), ...result.wins.map((item) => item.symbol)])].slice(0, 3);
      let celebrated = false;
      if (bigWin && typeof body.room_id === 'string' && body.room_id) {
        celebrated = await announceBigWin(base44, user, body.room_id, total, name).catch(() => false);
      }
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + total,
        bet,
        grand,
        pool_mini: pools.mini,
        pool_big: pools.big,
        pool_mega: pools.mega,
        pool_xmega: pools.xmega,
        free_spins: freeSpins,
        pool_state: withPoolState(wallet, 'slot', nextBonusState(state, { kind, payout: total, sessionLeft: 0, freeLeft: freeSpins, freeBefore: wallet.free_spins ?? 0, granted: freeTrigger })),
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + total,
        total_won_slot: (wallet.total_won_slot ?? 0) + total,
        last_spin_at: new Date().toISOString(),
      });

      // Supabase aynası: bakiye ve havuzlar iki altyapıda birden güncel kalır.
      waitUntil(mirrorRecord(base44, 'GameWallet', updated));
      // Ortak havuz kaydı güncellenir: diğer oyuncular da aynı rakamı görür.
      waitUntil(savePools(base44, poolRecord.id, pools).catch(() => null));
      if (total > 0) waitUntil(recordLeaderWin(base44, 'slot', user, total).catch(() => null));

      // Tur, kazanç geçmişine işlenir.
      await base44.asServiceRole.entities.GameSpin.create({
        user_id: user.id,
        user_name: name,
        user_avatar: user.avatar || '',
        symbol: bestSymbol,
        symbols,
        bet,
        cost,
        win: total,
        coins_after: updated.coins ?? 0,
        big_win: bigWin,
        jackpot: display.jackpot,
      });

      return Response.json({
        ...walletView(updated, isAdmin, pools, levels),
        grid,
        wins: display.wins,
        win: total,
        jackpot: display.jackpot,
        jackpot_hit: jackpotHit,
        free_trigger: freeTrigger,
        cost,
        big_win: bigWin ? total : 0,
        celebrated,
      });
    }

    return Response.json({ ...walletView(wallet, isAdmin, poolRecord.pools, levels), grid: null, wins: [], win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}