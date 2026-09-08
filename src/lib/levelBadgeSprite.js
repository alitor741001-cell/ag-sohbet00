export const LEVEL_BADGE_SPRITE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/cb3eaa14f_3782A150-DDD3-4D18-8B3E-82C62A7860C7.png';

export const LEVEL_BADGE_FRAMES = [
  [1, 2, 24, 128, 69], [10, 132, 24, 130, 69], [25, 263, 24, 130, 69], [50, 394, 24, 127, 69],
  [75, 520, 24, 127, 69], [100, 646, 24, 130, 69], [150, 775, 24, 127, 69], [200, 900, 24, 124, 69],
  [250, 1, 98, 130, 69], [300, 129, 98, 132, 69], [350, 261, 98, 132, 69], [400, 392, 98, 128, 69],
  [450, 518, 98, 128, 69], [500, 645, 98, 131, 69], [550, 775, 98, 127, 69], [600, 900, 98, 124, 69],
  [650, 1, 173, 130, 72], [700, 129, 173, 132, 72], [750, 261, 173, 132, 72], [850, 392, 173, 130, 72],
  [900, 520, 173, 129, 72], [950, 775, 173, 127, 72], [975, 900, 173, 124, 72],
  [990, 263, 246, 145, 84], [995, 406, 246, 148, 84], [1000, 550, 242, 220, 91],
].map(([level, x, y, width, height]) => ({ level, x, y, width, height, src: `/level-badges/lvl-${level}.png` }));

export function getLevelBadgeFrame(value) {
  const level = Math.min(1000, Math.max(1, Math.floor(Number(value) || 1)));
  return [...LEVEL_BADGE_FRAMES].reverse().find((frame) => level >= frame.level) || LEVEL_BADGE_FRAMES[0];
}