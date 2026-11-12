import { playFruit, spinCell } from './fruitEngine.ts';

// ELİMİNSLOT motoru: meyve motorunun üstüne zar, tavuk ve sandık nesneleri eklenir.
// Zar: dört tanesi jackpot öder (toplam bahsin sabit katı: bahisle orantılı).
// Sandık: barda birikir, bar dolunca birikimini öder.
// Tavuk: üç tanesi üç bedava tur verir.
export const DICE_MIN = 4;
export const CHEST_MAX = 10;
export const CHICKEN_MIN = 3;
export const FREE_SPINS = 3;
// Jackpot ödemesi: toplam bahsin bu katı (ham değer; havuz katsayısıyla ölçeklenir).
export const JACKPOT_MULTIPLE = 100;
// Barda biriken her sandık, toplam bahsin bu katı kadar ham değer taşır.
export const CHEST_MULTIPLE = 0.5;
// Kazanç seyrek gelsin: küme 9'da başlar, kademe sınırları 12 ve 15.
const ELIMIN_CLUSTER_MIN = 9;
const ELIMIN_CLUSTER_TIERS = [9, 12, 15];
const CHEST_CHANCE = 0.002;
const CHICKEN_CHANCE = 0.01;
const DICE_CHANCE = 0.008;

// Lolipop bu oyunda yok: motordan gelen lolipop kareleri kalan meyvelere dağıtılır.
const ELIMIN_FRUIT_IDS = ['plum', 'grapes', 'melon', 'apple', 'candy', 'cherry'];
const randomFruit = () => ELIMIN_FRUIT_IDS[Math.floor(Math.random() * ELIMIN_FRUIT_IDS.length)];

function eliminCell() {
  const roll = Math.random();
  if (roll < DICE_CHANCE) return 'dice';
  if (roll < DICE_CHANCE + CHICKEN_CHANCE) return 'chicken';
  if (roll < DICE_CHANCE + CHICKEN_CHANCE + CHEST_CHANCE) return 'chest';
  const id = spinCell();
  return id === 'lollipop' ? randomFruit() : id;
}

export const countOf = (grid: string[][], id: string) =>
  grid.flat().filter((symbol) => symbol === id).length;

/** Bir tur: küme kazancı ve turun sonunda duran dizilimdeki ek nesneler. */
export function playElimin(bet: number) {
  const result = playFruit(bet, { clusterMin: ELIMIN_CLUSTER_MIN, tiers: ELIMIN_CLUSTER_TIERS }, eliminCell);
  const grid = result.grid;
  return {
    ...result,
    chestGain: countOf(grid, 'chest'),
    jackpotTrigger: countOf(grid, 'dice') >= DICE_MIN,
    freeTrigger: countOf(grid, 'chicken') >= CHICKEN_MIN,
  };
}