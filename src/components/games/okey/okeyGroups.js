import { COLOR_ORDER, isWild, numberOf, tileColor, tilePoint } from './okeyConfig';

// 101 OKEY GRUP MOTORU
// Eli gerçek oyun kurallarına göre gruplara ayırır:
//   SERİ  → aynı renkte ardışık en az 3 taş + aynı sayıdan 3-4 farklı renk
//   ÇİFT  → aynı renk ve aynı sayıdan iki taş (ikiz)
// Joker ve okey taşı yalnızca eksik yeri kapatmak için harcanır; hiçbir taş iki grupta
// yer almaz. Gruplara girmeyen taşlar ayrı bölümde kalır ve puana katılmaz.

const COLORS = ['R', 'S', 'M', 'Y'];
const MIN_SERI = 3;
// Bir seri ya da sayı grubu tamamlanırken harcanabilecek en fazla joker/okey.
const MAX_WILDS = 2;

const byColorThenNumber = (a, b) =>
  COLOR_ORDER[tileColor(a)] - COLOR_ORDER[tileColor(b)] || numberOf(a) - numberOf(b);

/** SERİ: aynı renkte ardışık diziler ve aynı sayıdan farklı renk grupları. */
function planSeri(hand, okey) {
  const naturals = hand.filter((tile) => !isWild(tile, okey));
  const wilds = hand.filter((tile) => isWild(tile, okey));
  const groups = [];
  const take = (tile) => {
    const at = naturals.indexOf(tile);
    if (at >= 0) naturals.splice(at, 1);
  };

  // 1) Renk içi seriler: küçükten büyüğe, aradaki eksik sayılar jokerle kapatılır.
  for (const color of COLORS) {
    const numbers = [...new Set(naturals.filter((tile) => tileColor(tile) === color).map(numberOf))].sort((a, b) => a - b);
    let index = 0;
    while (index < numbers.length) {
      const run = [numbers[index]];
      let gaps = 0;
      let cursor = index;
      // Dizi, tek sayılık boşluklar jokerle kapatılabildiği sürece uzatılır.
      while (cursor + 1 < numbers.length) {
        const gap = numbers[cursor + 1] - numbers[cursor] - 1;
        if (gap > 1 || gaps + gap > MAX_WILDS || gaps + gap > wilds.length) break;
        gaps += gap;
        run.push(numbers[cursor + 1]);
        cursor += 1;
      }
      const need = Math.max(0, MIN_SERI - run.length - gaps);
      // Tek taş seri sayılmaz: en az iki taş + en fazla iki joker.
      const valid = run.length >= 2 && run.length + gaps >= MIN_SERI && gaps + need <= MAX_WILDS && gaps + need <= wilds.length;
      if (!valid) {
        index += 1;
        continue;
      }
      const tiles = [];
      run.forEach((n, i) => {
        if (i) for (let g = 0; g < n - run[i - 1] - 1 && wilds.length; g += 1) tiles.push(wilds.shift());
        tiles.push(`${color}${n}`);
      });
      while (tiles.length < MIN_SERI && wilds.length) tiles.push(wilds.shift());
      run.forEach((n) => take(`${color}${n}`));
      groups.push(tiles);
      index = cursor + 1;
    }
  }

  // 2) Sayı grupları: aynı sayıdan 3 (ya da 4) farklı renk; aynı renk iki kez kullanılmaz.
  // Büyük sayılar önce değerlendirilir, eksik renk jokerle tamamlanır.
  for (let n = 13; n >= 1; n -= 1) {
    for (;;) {
      const mine = naturals.filter((tile) => numberOf(tile) === n);
      const colors = COLORS.filter((color) => mine.some((tile) => tileColor(tile) === color));
      if (colors.length >= MIN_SERI) {
        const picks = colors.map((color) => mine.find((tile) => tileColor(tile) === color));
        picks.forEach(take);
        groups.push(picks);
      } else if (colors.length === 2 && wilds.length) {
        const picks = colors.map((color) => mine.find((tile) => tileColor(tile) === color));
        picks.forEach(take);
        groups.push([...picks, wilds.shift()]);
      } else break;
    }
  }

  return { groups, leftovers: [...naturals, ...wilds] };
}

/** ÇİFT: aynı renk ve aynı sayıdan iki taş; eşi olmayan tek taşı joker tamamlar. */
function planCift(hand, okey) {
  const naturals = hand.filter((tile) => !isWild(tile, okey));
  const wilds = hand.filter((tile) => isWild(tile, okey));
  const counts = new Map();
  naturals.forEach((tile) => counts.set(tile, (counts.get(tile) || 0) + 1));

  const groups = [];
  const singles = [];
  [...counts.keys()]
    .sort((a, b) => numberOf(a) - numberOf(b) || COLOR_ORDER[tileColor(a)] - COLOR_ORDER[tileColor(b)])
    .forEach((tile) => {
      const count = counts.get(tile);
      for (let i = 0; i < Math.floor(count / 2); i += 1) groups.push([tile, tile]);
      if (count % 2) singles.push(tile);
    });

  // Eşsiz kalan taşlar en değerliden başlayarak jokerle eşleşir.
  const leftovers = [];
  singles
    .sort((a, b) => tilePoint(b) - tilePoint(a) || byColorThenNumber(a, b))
    .forEach((tile) => {
      if (wilds.length) groups.push([tile, wilds.shift()]);
      else leftovers.push(tile);
    });

  return { groups, leftovers: [...leftovers, ...wilds] };
}

/**
 * El dizilimi: gruplar bitişik sıralanır, kullanılamayan taşlar en sona ayrılır.
 * Dönen değer tahta sırası, grup başlangıç işaretleri ve grupların gerçek puanıdır.
 */
export function planHand(hand, mode, okey) {
  const tiles = Array.isArray(hand) ? hand : [];
  const plan = mode === 'cift' ? planCift(tiles, okey) : planSeri(tiles, okey);
  const breaks = [];
  const layout = [];
  plan.groups.forEach((group) => {
    breaks.push(layout.length);
    layout.push(...group);
  });
  if (plan.leftovers.length) {
    breaks.push(layout.length);
    layout.push(...[...plan.leftovers].sort(byColorThenNumber));
  }
  return {
    tiles: layout,
    breaks,
    total: plan.groups.flat().reduce((sum, tile) => sum + tilePoint(tile), 0),
  };
}

/** Gruplara girmeyen taşların sayısı: klasik okeyde bitişe engel olan "fazla" taşlar. */
export function leftoverCount(hand, mode, okey) {
  const tiles = Array.isArray(hand) ? hand : [];
  const plan = mode === 'cift' ? planCift(tiles, okey) : planSeri(tiles, okey);
  return plan.leftovers.length;
}