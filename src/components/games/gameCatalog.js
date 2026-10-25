import { GAME_COVER, GAME_COVER_WIDTH, GAME_COVER_HEIGHT } from './slotAssets';
import { ROCKET_COVER, ROCKET_COVER_WIDTH, ROCKET_COVER_HEIGHT } from './rocketAssets';
import { FRUIT_COVER, FRUIT_COVER_HEIGHT, FRUIT_COVER_WIDTH } from './fruit/fruitAssets';
import { DEDE_COVER, DEDE_COVER_HEIGHT, DEDE_COVER_WIDTH } from './dede/dedeAssets';
import { ROULETTE_COVER, ROULETTE_COVER_HEIGHT, ROULETTE_COVER_WIDTH } from './roulette/rouletteAssets';
import { SEKER_COVER, SEKER_COVER_HEIGHT, SEKER_COVER_WIDTH } from './seker/sekerAssets';
import { SEKERLI_COVER, SEKERLI_COVER_HEIGHT, SEKERLI_COVER_WIDTH } from './sekerli/sekerliAssets';
import { FUTBOL_COVER, FUTBOL_COVER_HEIGHT, FUTBOL_COVER_WIDTH } from './futbol/futbolAssets';
import { ELIMIN_COVER, ELIMIN_COVER_HEIGHT, ELIMIN_COVER_WIDTH } from './elimin/eliminAssets';
import {
  OKEY_CLASSIC_COVER,
  OKEY_CLASSIC_COVER_HEIGHT,
  OKEY_CLASSIC_COVER_WIDTH,
  OKEY_COVER,
  OKEY_COVER_HEIGHT,
  OKEY_COVER_WIDTH,
} from './okey/okeyAssets';
import { ZAR_COVER, ZAR_COVER_HEIGHT, ZAR_COVER_WIDTH } from './zar/zarAssets';

export const SEKERLI_MEYVE_ID = 'sekerli-meyve';
export const SLOT_ID = 'slot-frenzy';
export const ROCKET_ID = 'crash-rocket';
export const FRUIT_ID = 'fruit-sweet';
export const SEKER_ID = 'seker';
export const DEDE_ID = 'dede-olympus';
export const ROULETTE_ID = 'roulette';
export const FUTBOL_ID = 'altin-gol';
export const ELIMIN_ID = 'elimin-slot';
export const OKEY_ID = 'okey-101';
// Klasik OKEY: 14 taşlı sürüm, ayrı masa ve ayrı lobi.
export const OKEY_CLASSIC_ID = 'okey';
// ZAR: üç zarlı bahis masası (küçük, büyük, kaplan).
export const ZAR_ID = 'zar';

// Oyun merkezi kartları: kapak görseli durur, dokununca oyun açılır.
export const GAMES = [
  { id: OKEY_ID, title: '101 OKEY', cover: OKEY_COVER, originWidth: OKEY_COVER_WIDTH, originHeight: OKEY_COVER_HEIGHT },
  { id: OKEY_CLASSIC_ID, title: 'OKEY', cover: OKEY_CLASSIC_COVER, originWidth: OKEY_CLASSIC_COVER_WIDTH, originHeight: OKEY_CLASSIC_COVER_HEIGHT },
  { id: ZAR_ID, title: 'ZAR', cover: ZAR_COVER, originWidth: ZAR_COVER_WIDTH, originHeight: ZAR_COVER_HEIGHT },
  { id: ELIMIN_ID, title: 'ELİMİNSLOT', cover: ELIMIN_COVER, originWidth: ELIMIN_COVER_WIDTH, originHeight: ELIMIN_COVER_HEIGHT },
  { id: FUTBOL_ID, title: 'ALTIN GOL', cover: FUTBOL_COVER, originWidth: FUTBOL_COVER_WIDTH, originHeight: FUTBOL_COVER_HEIGHT },
  { id: SEKERLI_MEYVE_ID, title: 'ŞEKERLİ MEYVE', cover: SEKERLI_COVER, originWidth: SEKERLI_COVER_WIDTH, originHeight: SEKERLI_COVER_HEIGHT },
  { id: ROULETTE_ID, title: 'ROULETTE', cover: ROULETTE_COVER, originWidth: ROULETTE_COVER_WIDTH, originHeight: ROULETTE_COVER_HEIGHT },
  { id: DEDE_ID, title: 'DEDE', cover: DEDE_COVER, originWidth: DEDE_COVER_WIDTH, originHeight: DEDE_COVER_HEIGHT },
  { id: FRUIT_ID, title: 'MEYVE', cover: FRUIT_COVER, originWidth: FRUIT_COVER_WIDTH, originHeight: FRUIT_COVER_HEIGHT },
  { id: SEKER_ID, title: 'ŞEKER', cover: SEKER_COVER, originWidth: SEKER_COVER_WIDTH, originHeight: SEKER_COVER_HEIGHT },
  { id: SLOT_ID, title: 'SLOT', cover: GAME_COVER, originWidth: GAME_COVER_WIDTH, originHeight: GAME_COVER_HEIGHT },
  { id: ROCKET_ID, title: 'GÖKKARTAL', cover: ROCKET_COVER, originWidth: ROCKET_COVER_WIDTH, originHeight: ROCKET_COVER_HEIGHT },
];