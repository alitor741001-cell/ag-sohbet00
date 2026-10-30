const REF = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/3aec5d6d3_IMG_0481.jpg';
const art = (x, y, w, h) => ({ image_url: REF, crop: { x, y, w, h } });

export const DRAGON_ICONS = {
  shop: art(.13, .725, .118, .085),
  bag: art(.338, .725, .118, .085),
  level: art(.545, .725, .118, .085),
  agency: art(.755, .725, .118, .085),
  blocked: art(.288, .905, .09, .062),
  privacy: art(.456, .905, .09, .062),
  settings: art(.633, .905, .09, .062),
};