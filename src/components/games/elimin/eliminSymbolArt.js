// ELİMİNSLOT sembol görselleri: kullanıcının gönderdiği referans seti.
// Gönderilen sette karşılığı olmadığı için lolipop mevcut görselinde kaldı.
import { FRUIT_ART } from '../fruit/fruitAssets';

const MEDIA_BASE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62';

export const ELIMIN_SYMBOL_ART = {
  lollipop: FRUIT_ART.lollipop,
  plum: `${MEDIA_BASE}/daf0c5624_IMG_1546.jpg`,
  grapes: `${MEDIA_BASE}/2eaab5ed5_IMG_1545.jpg`,
  melon: `${MEDIA_BASE}/449e969a3_IMG_1550.jpg`,
  apple: `${MEDIA_BASE}/cb18f3fc5_IMG_1551.jpg`,
  candy: `${MEDIA_BASE}/218453834_IMG_1548.jpg`,
  cherry: `${MEDIA_BASE}/1f761d942_IMG_1549.jpg`,
  banana: `${MEDIA_BASE}/085d9681b_IMG_1544.jpg`,
  chicken: `${MEDIA_BASE}/0aa7b1759_IMG_1547.jpg`,
  dice: `${MEDIA_BASE}/3c6b6fbd9_IMG_1542.jpg`,
  chest: `${MEDIA_BASE}/a8db20e22_IMG_1543.jpg`,
};

// Kartlar işlenirken bu kareye indirilir: hem makara hem ödeme tablosu aynı ölçüyü kullanır.
export const ELIMIN_ART_SIZE = 512;