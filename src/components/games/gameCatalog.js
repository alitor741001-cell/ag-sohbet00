import { GAME_COVER } from './slotAssets';
import { ROCKET_COVER } from './rocketAssets';
import { FRUIT_COVER, FRUIT_COVER_HEIGHT, FRUIT_COVER_WIDTH } from './fruit/fruitAssets';
import { DEDE_COVER, DEDE_COVER_HEIGHT, DEDE_COVER_WIDTH } from './dede/dedeAssets';

export const SLOT_ID = 'slot-frenzy';
export const ROCKET_ID = 'crash-rocket';
export const FRUIT_ID = 'fruit-sweet';
export const DEDE_ID = 'dede-olympus';

// Oyun merkezi kartları: kapak görseli durur, dokununca oyun açılır.
export const GAMES = [
  { id: DEDE_ID, title: 'DEDE', cover: DEDE_COVER, originWidth: DEDE_COVER_WIDTH, originHeight: DEDE_COVER_HEIGHT },
  { id: FRUIT_ID, title: 'MEYVE', cover: FRUIT_COVER, originWidth: FRUIT_COVER_WIDTH, originHeight: FRUIT_COVER_HEIGHT },
  { id: SLOT_ID, title: 'SLOT FRENZY', cover: GAME_COVER, originWidth: 1058, originHeight: 1008 },
  { id: ROCKET_ID, title: 'CRASH ROCKET', cover: ROCKET_COVER, originWidth: 1135, originHeight: 928 },
];