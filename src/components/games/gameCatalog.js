import { GAME_COVER, GAME_COVER_WIDTH, GAME_COVER_HEIGHT } from './slotAssets';
import { ROCKET_COVER, ROCKET_COVER_WIDTH, ROCKET_COVER_HEIGHT } from './rocketAssets';
import { FRUIT_COVER, FRUIT_COVER_HEIGHT, FRUIT_COVER_WIDTH } from './fruit/fruitAssets';
import { DEDE_COVER, DEDE_COVER_HEIGHT, DEDE_COVER_WIDTH } from './dede/dedeAssets';
import { ROULETTE_COVER, ROULETTE_COVER_HEIGHT, ROULETTE_COVER_WIDTH } from './roulette/rouletteAssets';
import { SEKER_COVER, SEKER_COVER_HEIGHT, SEKER_COVER_WIDTH } from './seker/sekerAssets';
import { SEKERLI_COVER, SEKERLI_COVER_HEIGHT, SEKERLI_COVER_WIDTH } from './sekerli/sekerliAssets';
import { FUTBOL_COVER, FUTBOL_COVER_HEIGHT, FUTBOL_COVER_WIDTH } from './futbol/futbolAssets';

export const SEKERLI_MEYVE_ID = 'sekerli-meyve';
export const SLOT_ID = 'slot-frenzy';
export const ROCKET_ID = 'crash-rocket';
export const FRUIT_ID = 'fruit-sweet';
export const SEKER_ID = 'seker';
export const DEDE_ID = 'dede-olympus';
export const ROULETTE_ID = 'roulette';
export const FUTBOL_ID = 'altin-gol';

// Oyun merkezi kartları: kapak görseli durur, dokununca oyun açılır.
export const GAMES = [
  { id: FUTBOL_ID, title: 'ALTIN GOL', cover: FUTBOL_COVER, originWidth: FUTBOL_COVER_WIDTH, originHeight: FUTBOL_COVER_HEIGHT },
  { id: SEKERLI_MEYVE_ID, title: 'ŞEKERLİ MEYVE', cover: SEKERLI_COVER, originWidth: SEKERLI_COVER_WIDTH, originHeight: SEKERLI_COVER_HEIGHT },
  { id: ROULETTE_ID, title: 'ROULETTE', cover: ROULETTE_COVER, originWidth: ROULETTE_COVER_WIDTH, originHeight: ROULETTE_COVER_HEIGHT },
  { id: DEDE_ID, title: 'DEDE', cover: DEDE_COVER, originWidth: DEDE_COVER_WIDTH, originHeight: DEDE_COVER_HEIGHT },
  { id: FRUIT_ID, title: 'MEYVE', cover: FRUIT_COVER, originWidth: FRUIT_COVER_WIDTH, originHeight: FRUIT_COVER_HEIGHT },
  { id: SEKER_ID, title: 'ŞEKER', cover: SEKER_COVER, originWidth: SEKER_COVER_WIDTH, originHeight: SEKER_COVER_HEIGHT },
  { id: SLOT_ID, title: 'SLOT', cover: GAME_COVER, originWidth: GAME_COVER_WIDTH, originHeight: GAME_COVER_HEIGHT },
  { id: ROCKET_ID, title: 'ROCKET', cover: ROCKET_COVER, originWidth: ROCKET_COVER_WIDTH, originHeight: ROCKET_COVER_HEIGHT },
];