const ROOT = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/';
const packs = [
  ['dragon', 'f60db00ad', 50000, ['Alev Ejderhaları', 'Buz Ejderhası', 'Ametist Ejderhası', 'Zümrüt Ejderhası', 'Göksel Ejderha', 'Tutulma Ejderhası'], ['#ff713b','#85e9ff','#be8aff','#70edb6','#f7df91','#e89be7']],
  ['duality', 'b472408c1', 25000, ['Kızıl Mavi Nabız', 'Siber İkilik', 'Şimşek Dengesi', 'İkiz Anka', 'Kristal Kutuplar', 'Yakut ve Safir'], ['#ff667a','#739cff','#d4efff','#fa9c72','#c093ff','#7bcfff']],
  ['butterfly', 'ce5112a31', 15000, ['Pembe Kelebekler', 'Mavi Morfo', 'Altın Monark', 'Leylak Kanatlar', 'Jade Kelebekler', 'İnci Kanatlar'], ['#f2a6cb','#7ddaff','#ffc567','#cf9af4','#9decc8','#f3e5c5']],
  ['flower', '3fe66a9c2', 15000, ['Yakut Gül Bahçesi', 'Kiraz Çiçeği', 'Mor Salkım', 'İnci Zambak', 'Mavi Unutma Beni', 'Şakayık Tacı'], ['#f46b86','#ffc3d5','#c294f2','#f2e5bf','#8dbfff','#f5a4bb']],
  ['crescent', 'b14979762', 20000, ['Altın Gümüş Yay', 'Ateş Buz Yarım Ay', 'İnci Hilal', 'Ametist Zümrüt Yay', 'Buz Yörüngesi', 'Platin Taç'], ['#edcf82','#ff94bc','#f8dce5','#b7aff5','#a7e7ff','#ecd493']],
  ['star', '0e04088a0', 35000, ['Kayan Altın Yıldız', 'Ay ve İnciler', 'Mor Meteor', 'Satürn Yıldızları', 'Elmas Kuyruklu Yıldız'], ['#f5cf69','#e1edff','#cd9afa','#f2b2bd','#9aebff']],
];
export const FRAME_DESIGNS = packs.flatMap(([family, sheet, price, names, colors]) => names.map((name, index) => {
  const key = `${family}-${index + 1}`;
  return { key, family, name, glow: colors[index], price: price + index * 1000, category: 'seat-frame', min_vip: 0,
    image_url: `${ROOT}${sheet}_generated_image.png#ag-frame=${key}`,
    crop: { x: (index % 3) / 3, y: Math.floor(index / 3) / 2 + 1 / 12, w: 1 / 3, h: 1 / 3 },
    remove_white: true, published: true, reference_key: `ag35-${key}`, sort_order: -100 + packs.findIndex(pack => pack[0] === family) * 6 + index };
}));
export function frameDesignFor(imageUrl = '') {
  const key = imageUrl.split('#ag-frame=')[1];
  return key ? FRAME_DESIGNS.find(frame => frame.key === key) || null : null;
}
export const VIP_FRAME_KEYS = { 5: 'dragon-6', 6: 'dragon-1', 7: 'duality-2', 8: 'crescent-6', 9: 'crescent-2', 10: 'duality-5', 11: 'crescent-1', 12: 'butterfly-3' };