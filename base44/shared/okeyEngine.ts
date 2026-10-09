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

/**
 * Dağıtım: 106 taş, oyuncu sayısına göre hesaplanır. Her oyuncuya 21 taş ve bir gösterge
 * ayrılır; kalan taşların tümü ortaya konur — 4 oyuncuda 21, 3 oyuncuda 42, 2 oyuncuda 63.
 * Oynanmayan koltukların taşları da ortaya döner, hiç taş ziyan olmaz.
 */
export function dealOkey(playerCount: number = OKEY_MAX_SEATS) {
  const seated = Math.min(Math.max(Math.floor(playerCount) || 0, 1), OKEY_MAX_SEATS);
  const deck = shuffle(okeyDeck());
  const hands: string[][] = [[], [], [], []];
  for (let round = 0; round < TILES_PER_PLAYER; round += 1) {
    for (let seat = 0; seat < seated; seat += 1) hands[seat].push(deck.pop() as string);
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
 * Eksikler joker/okey ile tamamlanır. El yalnızca per ve çiftlerden kuruluysa
 * açılmaz: bitirmek için gruplar içinde en az bir seri şarttır.
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

// 101 OKEY: bitiren elin kalan taşları geçerli gruplara ayrılmalı ve en az 101 puan etmeli.
export const TARGET_SCORE = 101;

/** Taş puanı: 1 → 1, 2-9 → sayı değeri, 10/11/12/13 → 10 puan. */
export function tilePoint(tile: string): number {
  const n = numberOf(tile);
  if (!n) return 0;
  return n <= 9 ? n : 10;
}

/** Eldeki taşların toplam puanı. */
export const handScore = (tiles: string[]) =>
  tiles.reduce((total, tile) => total + tilePoint(tile), 0);

/**
 * Bitirici atış: atılacak taş çıkarıldığında kalan el geçerli gruplara ayrılıyor ve
 * en az 101 puan ediyorsa o taş ile kalan elin puanı döner. Okey/joker atılmaz.
 */
export function finishWith(tiles: string[], okey: string): { tile: string; score: number } | null {
  const seen = new Set<string>();
  let best: { tile: string; score: number } | null = null;
  for (const tile of tiles) {
    if (isWild(tile, okey) || seen.has(tile)) continue;
    seen.add(tile);
    const rest = removeOne(tiles, tile);
    if (!canFinish(rest, okey)) continue;
    const score = handScore(rest);
    if (score < TARGET_SCORE) continue;
    if (!best || score > best.score) best = { tile, score };
  }
  return best;
}

// === DİZİLİM PUANI ===
// İstemcideki dizilim motoruyla aynı ölçü: yalnızca gruplara giren taşlar sayılır,
// işe yaramayan taşlar puana katılmaz ve bitirmeye engel değildir.
const OKEY_COLOR_ORDER: Record<string, number> = { R: 0, S: 1, M: 2, Y: 3 };
const MIN_SERI = 3;
const MAX_WILDS = 2;

const colorOrderOf = (tile: string) => OKEY_COLOR_ORDER[colorOf(tile)] ?? 9;
const orderKey = (tile: string) => colorOrderOf(tile) * 100 + numberOf(tile);

/** SERİ: aynı renkte ardışık diziler ve aynı sayıdan farklı renk grupları. */
function planSeri(tiles: string[], okey: string) {
  const naturals = tiles.filter((tile) => !isWild(tile, okey));
  const wilds = tiles.filter((tile) => isWild(tile, okey));
  const groups: string[][] = [];
  const take = (tile: string) => {
    const at = naturals.indexOf(tile);
    if (at >= 0) naturals.splice(at, 1);
  };

  // Renk içi seriler: aradaki eksik sayılar jokerle kapatılır.
  for (const color of OKEY_COLORS) {
    const numbers = [...new Set(naturals.filter((tile) => colorOf(tile) === color).map(numberOf))]
      .sort((a, b) => a - b);
    let index = 0;
    while (index < numbers.length) {
      const run = [numbers[index]];
      let gaps = 0;
      let cursor = index;
      while (cursor + 1 < numbers.length) {
        const gap = numbers[cursor + 1] - numbers[cursor] - 1;
        if (gap > 1 || gaps + gap > MAX_WILDS || gaps + gap > wilds.length) break;
        gaps += gap;
        run.push(numbers[cursor + 1]);
        cursor += 1;
      }
      const need = Math.max(0, MIN_SERI - run.length - gaps);
      const valid = run.length >= 2 && run.length + gaps >= MIN_SERI && gaps + need <= MAX_WILDS && gaps + need <= wilds.length;
      if (!valid) {
        index += 1;
        continue;
      }
      const group: string[] = [];
      run.forEach((n, i) => {
        if (i) for (let g = 0; g < n - run[i - 1] - 1 && wilds.length; g += 1) group.push(wilds.shift() as string);
        group.push(`${color}${n}`);
      });
      while (group.length < MIN_SERI && wilds.length) group.push(wilds.shift() as string);
      run.forEach((n) => take(`${color}${n}`));
      groups.push(group);
      index = cursor + 1;
    }
  }

  // Sayı grupları: aynı sayıdan 3 (ya da 4) farklı renk; büyük sayılar önce değerlendirilir.
  for (let n = 13; n >= 1; n -= 1) {
    for (;;) {
      const mine = naturals.filter((tile) => numberOf(tile) === n);
      const colors = OKEY_COLORS.filter((color) => mine.some((tile) => colorOf(tile) === color));
      if (colors.length >= MIN_SERI) {
        const picks = colors.map((color) => mine.find((tile) => colorOf(tile) === color) as string);
        picks.forEach(take);
        groups.push(picks);
      } else if (colors.length === 2 && wilds.length) {
        const picks = colors.map((color) => mine.find((tile) => colorOf(tile) === color) as string);
        picks.forEach(take);
        groups.push([...picks, wilds.shift() as string]);
      } else break;
    }
  }

  return { groups, leftovers: [...naturals, ...wilds] };
}

/** ÇİFT: aynı renk ve aynı sayıdan iki taş; eşi olmayan tek taşı joker tamamlar. */
function planCift(tiles: string[], okey: string) {
  const naturals = tiles.filter((tile) => !isWild(tile, okey));
  const wilds = tiles.filter((tile) => isWild(tile, okey));
  const counts = new Map<string, number>();
  naturals.forEach((tile) => counts.set(tile, (counts.get(tile) || 0) + 1));

  const groups: string[][] = [];
  const singles: string[] = [];
  [...counts.keys()]
    .sort((a, b) => numberOf(a) - numberOf(b) || colorOrderOf(a) - colorOrderOf(b))
    .forEach((tile) => {
      const count = counts.get(tile) as number;
      for (let i = 0; i < Math.floor(count / 2); i += 1) groups.push([tile, tile]);
      if (count % 2) singles.push(tile);
    });

  const leftovers: string[] = [];
  singles
    .sort((a, b) => tilePoint(b) - tilePoint(a) || orderKey(a) - orderKey(b))
    .forEach((tile) => {
      if (wilds.length) groups.push([tile, wilds.shift() as string]);
      else leftovers.push(tile);
    });

  return { groups, leftovers: [...leftovers, ...wilds] };
}

/** Dizilim puanı: gruplara giren taşların toplamı ve işe yaramayan taşlar. */
function planScore(tiles: string[], okey: string, mode: string) {
  const plan = mode === 'cift' ? planCift(tiles, okey) : planSeri(tiles, okey);
  const score = plan.groups.flat().reduce((sum, tile) => sum + tilePoint(tile), 0);
  return { score, leftovers: plan.leftovers };
}

/** İki dizilimden yükseği: oyuncunun gördüğü puan bunun en iyisidir. */
export function bestPlanScore(tiles: string[], okey: string) {
  const seri = planScore(tiles, okey, 'seri');
  const cift = planScore(tiles, okey, 'cift');
  return cift.score > seri.score ? cift : seri;
}

/** Bitirirken atılacak taş: işe yaramayan taş önce gider, yoksa en düşük puanlı taş atılır. */
export function discardForFinish(tiles: string[], okey: string): string {
  const loose = bestPlanScore(tiles, okey).leftovers.filter((tile) => !isWild(tile, okey));
  const pool = (loose.length ? loose : tiles.filter((tile) => !isWild(tile, okey))).slice();
  pool.sort((a, b) => tilePoint(a) - tilePoint(b));
  return pool[0] || tiles[0];
}

/** Süresi dolan oyuncu için otomatik atış: joker dışında bir taş seçilir. */
export function autoDiscard(tiles: string[], okey: string): string {
  const plain = tiles.filter((tile) => !isWild(tile, okey));
  const pool = plain.length ? plain : tiles;
  return pool[pool.length - 1];
}