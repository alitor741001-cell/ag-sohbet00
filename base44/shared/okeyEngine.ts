/**
 * 101 OKEY motoru: deste, gösterge/okey, el çözümleme ve bitirme kontrolü.
 * El çözümleme sunucu tarafındadır; istemci yalnızca sunucunun verdiği eli gösterir.
 */

export const OKEY_COLORS = ['R', 'S', 'M', 'Y'];
export const JOKER = 'J';
// 101 Okey dağıtımı: her oyuncuya 21 taş. İlk eli başlayan oyuncu desteden bir taş
// çektiği için eline 22 taş olur; 4 oyuncuda ortada tam 21 taş kalır (106 - 84 - 1).
export const TILES_PER_PLAYER = 21;
export const OKEY_MAX_SEATS = 4;
export const OKEY_BETS = [1000, 5000, 25000, 100000];
export const OKEY_START_COINS = 100000;
// Tur içi süreler: çekme ve atma adımlarının her birine ayrılan süre.
export const DRAW_MS = 25000;
export const DISCARD_MS = 25000;
const MAX_SEARCH = 20000;

/** 106 taşlık deste: dört renk x 1-13 x iki kopya + iki joker. */
export function okeyDeck(): string[] {
  const deck: string[] = [];
  for (const color of OKEY_COLORS) {
    for (let n = 1; n <= 13; n += 1) {
      deck.push(`${color}${n}`);
      deck.push(`${color}${n}`);
    }
  }
  deck.push(JOKER, JOKER);
  return deck;
}

export function shuffle(list: string[]): string[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const colorOf = (tile: string) => (tile === JOKER ? '' : String(tile || '')[0] || '');
export const numberOf = (tile: string) => (tile === JOKER ? 0 : Number(String(tile || '').slice(1)) || 0);

/** Joker ve okey taşı her yerde geçer: ikisi de joker sayılır. */
export const isWild = (tile: string, okey: string) => tile === JOKER || (!!okey && tile === okey);

/** Göstergeye göre okeyi belirler: aynı renkte bir büyük taş (13 → 1). Joker gösterge ise okey jokerdir. */
export function okeyOf(gosterge: string): string {
  if (!gosterge || gosterge === JOKER) return JOKER;
  const n = numberOf(gosterge);
  return `${colorOf(gosterge)}${n === 13 ? 1 : n + 1}`;
}

/** Dağıtım: 21 taş x 4 oyuncu, bir gösterge ve ortada kalan 21 taş. */
export function dealOkey() {
  const deck = shuffle(okeyDeck());
  const hands: string[][] = [[], [], [], []];
  for (let round = 0; round < TILES_PER_PLAYER; round += 1) {
    for (let seat = 0; seat < OKEY_MAX_SEATS; seat += 1) hands[seat].push(deck.pop() as string);
  }
  const gosterge = deck.pop() as string;
  return { hands, gosterge, okey: okeyOf(gosterge), stack: deck };
}

export function removeOne(list: string[], tile: string): string[] {
  const out = [...list];
  const at = out.indexOf(tile);
  if (at >= 0) out.splice(at, 1);
  return out;
}

export const removeAll = (list: string[], tiles: string[]) =>
  tiles.reduce((acc, tile) => removeOne(acc, tile), [...list]);

/**
 * Eldeki doğal taşlar geçerli gruplara ayrılabiliyor mu?
 * En küçük taşın bulunduğu grubu sırayla dener: seri (3-13 aynı renk sıralı),
 * per (aynı taştan iki tane) ve çift (aynı sayı, farklı renkler, 3-4 taş).
 * Eksikler joker/okey ile tamamlanır; bitirmek için en az bir seri şarttır.
 */
function solve(naturals: string[], wilds: number, seriUsed: boolean, memo: Map<string, boolean>): boolean {
  if (!naturals.length) {
    // Kalan taşların tümü joker: iki joker bir per, üç ve fazlası bir seri kurar.
    if (wilds === 0) return seriUsed;
    if (wilds === 1) return false;
    if (wilds === 2) return seriUsed;
    return true;
  }
  const key = `${naturals.join(',')}|${wilds}|${seriUsed ? 1 : 0}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  if (memo.size > MAX_SEARCH) return false;
  memo.set(key, false);

  const first = naturals[0];
  const color = colorOf(first);
  const num = numberOf(first);
  let ok = false;

  // SERİ: en küçük taşı içeren tüm aralıklar (uzunluk 3-13).
  for (let len = 3; len <= 13 && !ok; len += 1) {
    const startMin = Math.max(1, num - len + 1);
    const startMax = Math.min(num, 14 - len);
    for (let start = startMin; start <= startMax && !ok; start += 1) {
      const use: string[] = [];
      let need = 0;
      for (let n = start; n <= start + len - 1; n += 1) {
        const tile = `${color}${n}`;
        if (naturals.indexOf(tile) >= 0) use.push(tile);
        else need += 1;
      }
      if (need > wilds) continue;
      if (solve(removeAll(naturals, use), wilds - need, true, memo)) ok = true;
    }
  }

  // PER: aynı taştan iki tane, ya da bir taş + joker.
  if (!ok) {
    const twins = naturals.filter((tile) => tile === first).length;
    if (twins >= 2) ok = solve(removeAll(naturals, [first, first]), wilds, seriUsed, memo);
    else if (wilds >= 1) ok = solve(removeAll(naturals, [first]), wilds - 1, seriUsed, memo);
  }

  // ÇİFT: aynı sayı, farklı renkler (3-4 taş); eksik renkler jokerle tamamlanır.
  if (!ok) {
    const others = OKEY_COLORS.filter((c) => c !== color && naturals.indexOf(`${c}${num}`) >= 0);
    for (let mask = 0; mask < (1 << others.length) && !ok; mask += 1) {
      const picks: string[] = [];
      for (let bit = 0; bit < others.length; bit += 1) {
        if (mask & (1 << bit)) picks.push(`${others[bit]}${num}`);
      }
      const naturalCount = 1 + picks.length;
      const minNeed = Math.max(0, 3 - naturalCount);
      for (let need = minNeed; need + naturalCount <= 4 && need <= wilds && !ok; need += 1) {
        ok = solve(removeAll(naturals, [first, ...picks]), wilds - need, seriUsed, memo);
      }
    }
  }

  memo.set(key, ok);
  return ok;
}

/** Verilen taşlar (bitirme anında 21, el fazladan taşlıyken 22) geçerli gruplara ayrılabiliyor mu? */
export function canFinish(tiles: string[], okey: string): boolean {
  const wilds = tiles.filter((tile) => isWild(tile, okey)).length;
  const naturals = tiles.filter((tile) => !isWild(tile, okey)).sort();
  return solve(naturals, wilds, false, new Map());
}

/** Fazladan taşlı elde atılabilecek taş: kalan taşların tümü geçerliyse o taş bitirir. Okey atılmaz. */
export function findDiscard(tiles: string[], okey: string): string | null {
  const seen = new Set<string>();
  for (const tile of tiles) {
    if (isWild(tile, okey) || seen.has(tile)) continue;
    seen.add(tile);
    if (canFinish(removeOne(tiles, tile), okey)) return tile;
  }
  return null;
}

/** Süresi dolan oyuncu için otomatik atış: joker dışında bir taş seçilir. */
export function autoDiscard(tiles: string[], okey: string): string {
  const plain = tiles.filter((tile) => !isWild(tile, okey));
  const pool = plain.length ? plain : tiles;
  return pool[pool.length - 1];
}