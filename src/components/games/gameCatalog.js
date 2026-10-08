import { GAME_COVER } from './slotAssets';
import { ROCKET_COVER } from './rocketAssets';
import { FRUIT_COVER, FRUIT_COVER_HEIGHT, FRUIT_COVER_WIDTH } from './fruit/fruitAssets';
import { DEDE_COVER, DEDE_COVER_HEIGHT, DEDE_COVER_WIDTH } from './dede/dedeAssets';
import { ROULETTE_COVER, ROULETTE_COVER_HEIGHT, ROULETTE_COVER_WIDTH } from './roulette/rouletteAssets';
import { SEKER_COVER, SEKER_COVER_HEIGHT, SEKER_COVER_WIDTH } from './seker/sekerAssets';

export const SLOT_ID = 'slot-frenzy';
export const ROCKET_ID = 'crash-rocket';
export const FRUIT_ID = 'fruit-sweet';
export const SEKER_ID = 'seker';
export const DEDE_ID = 'dede-olympus';
export const ROULETTE_ID = 'roulette';

// Oyun merkezi kartları: kapak görseli durur, dokununca oyun açılır.
export const GAMES = [
  { id: ROULETTE_ID, title: 'ROULETTE', cover: ROULETTE_COVER, originWidth: ROULETTE_COVER_WIDTH, originHeight: ROULETTE_COVER_HEIGHT },
  { id: DEDE_ID, title: 'DEDE', cover: DEDE_COVER, originWidth: DEDE_COVER_WIDTH, originHeight: DEDE_COVER_HEIGHT },
  { id: FRUIT_ID, title: 'MEYVE', cover: FRUIT_COVER, originWidth: FRUIT_COVER_WIDTH, originHeight: FRUIT_COVER_HEIGHT },
  { id: SEKER_ID, title: 'ŞEKER', cover: SEKER_COVER, originWidth: SEKER_COVER_WIDTH, originHeight: SEKER_COVER_HEIGHT },
  { id: SLOT_ID, title: 'SLOT FRENZY', cover: GAME_COVER, originWidth: 1058, originHeight: 1008 },
  { id: ROCKET_ID, title: 'CRASH ROCKET', cover: ROCKET_COVER, originWidth: 1135, originHeight: 928 },
];