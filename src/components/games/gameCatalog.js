import { GAME_COVER } from './slotAssets';
import { ROCKET_COVER } from './rocketAssets';

export const SLOT_ID = 'slot-frenzy';
export const ROCKET_ID = 'crash-rocket';

// Oyun merkezi kartları: kapak görseli durur, dokununca oyun açılır.
export const GAMES = [
  { id: SLOT_ID, title: 'SLOT FRENZY', cover: GAME_COVER, originWidth: 1058, originHeight: 1008 },
  { id: ROCKET_ID, title: 'CRASH ROCKET', cover: ROCKET_COVER, originWidth: 1135, originHeight: 928 },
];