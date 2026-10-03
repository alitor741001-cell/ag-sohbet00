import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { LINES, BIG_WIN_MULTIPLE, spinReels, evaluateGrid } from '../../shared/slotEngine.ts';

const START_COINS = 100000;
const BONUS_COINS = 25000;
const BONUS_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const MIN_BET = 10;
const MAX_BET = 1000;
const DEFAULT_BET = 100;
// Bakiye gerçek: bahis bakiyeden düşer, kazanç eklenir.
const UNLIMITED_COINS = false;
// Her turda toplam bahsin bu oranı GRAND ödül havuzuna eklenir.
const GRAND_RATE = 0.1;

function jackpotValues() {
  const seconds = Math.floor(Date.now() / 1000);
  return {
    mega: 1250000 + (Math.floor(seconds / 4) % 250000),
    grand: 250000 + (Math.floor(seconds / 3) % 80000),
    minor: 25000 + (Math.floor(seconds / 2) % 9000),
    major: 120000 + (Math.floor(seconds / 3) % 45000),
    mini: 5000 + (Math.floor(seconds / 2) % 2500),
  };
}

function bonusReady(wallet) {
  if (!wallet.last_bonus_at) return true;
  return Date.now() - new Date(wallet.last_bonus_at).getTime() >= BONUS_COOLDOWN_MS;
}

function canClaimBonus(wallet) {
  if (bonusReady(wallet)) return true;
  // Bakiye bir tura yetmiyorsa bonus beklemeden alınabilir.
  return (wallet.coins ?? START_COINS) < (wallet.bet ?? DEFAULT_BET) * LINES;
}

function walletView(wallet, isAdmin = false) {
  return {
    coins: wallet.coins ?? START_COINS,
    unlimited: UNLIMITED_COINS,
    no_limit: UNLIMITED_COINS || isAdmin,
    bet: wallet.bet ?? DEFAULT_BET,
    lines: LINES,
    spins: wallet.spins ?? 0,
    grand: wallet.grand ?? 0,
    jackpots: jackpotValues(),
    bonus_ready: canClaimBonus(wallet),
    bonus_amount: BONUS_COINS,
  };
}

function clampBet(value, fallback) {
  const numeric = Math.round(Number(value));
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.max(MIN_BET, Math.min(MAX_BET, numeric));
}

async function loadWallet(base44, user) {
  const found = await base44.asServiceRole.entities.GameWallet.filter({ user_id: user.id }, '-created_date', 1);
  if (found[0]) return found[0];
  return base44.asServiceRole.entities.GameWallet.create({
    user_id: user.id,
    user_name: user.full_name || '',
    coins: START_COINS,
    bet: DEFAULT_BET,
    lines: LINES,
    spins: 0,
    grand: 0,
    total_won: 0,
  });
}

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
    const wallet = await loadWallet(base44, user);
    // Yönetici hesabında coin sınırı yoktur.
    const isAdmin = user.role === 'admin';

    if (action === 'bet') {
      const bet = clampBet(body.bet, wallet.bet ?? DEFAULT_BET);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { bet });
      return Response.json({ ...walletView({ ...updated, last_bonus_at: wallet.last_bonus_at }, isAdmin), grid: null, wins: [], win: 0 });
    }

    if (action === 'bonus') {
      if (!canClaimBonus(wallet)) return Response.json({ error: 'Bonus henüz hazır değil.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: UNLIMITED_COINS ? START_COINS : (wallet.coins ?? START_COINS) + BONUS_COINS,
        last_bonus_at: new Date().toISOString(),
      });
      return Response.json({ ...walletView(updated, isAdmin), grid: null, wins: [], win: 0 });
    }

    if (action === 'spin') {
      const bet = clampBet(body.bet, wallet.bet ?? DEFAULT_BET);
      const cost = bet * LINES;
      let coins = wallet.coins ?? START_COINS;
      if (coins < cost) {
        // Yönetici hesabında sınır yok: bakiye bir tura yetmiyorsa otomatik tamamlanır.
        if (isAdmin) coins = Math.max(coins, START_COINS);
        else if (!UNLIMITED_COINS) return Response.json({ error: 'Yetersiz coin.' }, { status: 400 });
      }

      const grid = spinReels();
      const result = evaluateGrid(grid, bet);
      // Jackpot sembolü geldiğinde biriken GRAND havuzu ödenir, havuz sıfırlanır.
      const jackpotHit = result.wins.some((item) => item.symbol === 'jackpot');
      const pool = wallet.grand ?? 0;
      const jackpotPayout = jackpotHit ? pool : 0;
      const total = result.total + jackpotPayout;
      const grand = jackpotHit ? 0 : pool + Math.round(cost * GRAND_RATE);
      const bigWin = cost > 0 && total >= cost * BIG_WIN_MULTIPLE;
      const name = user.username || user.full_name || 'Kullanıcı';
      let celebrated = false;
      if (bigWin && typeof body.room_id === 'string' && body.room_id) {
        celebrated = await announceBigWin(base44, user, body.room_id, total, name).catch(() => false);
      }
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: coins - cost + total,
        bet,
        grand,
        spins: (wallet.spins ?? 0) + 1,
        total_won: (wallet.total_won ?? 0) + total,
        last_spin_at: new Date().toISOString(),
      });

      return Response.json({
        ...walletView(updated, isAdmin),
        grid,
        wins: result.wins,
        win: total,
        jackpot: jackpotPayout,
        cost,
        big_win: bigWin ? total : 0,
        celebrated,
      });
    }

    return Response.json({ ...walletView(wallet, isAdmin), grid: null, wins: [], win: 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}