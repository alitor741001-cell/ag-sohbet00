// Oyun ekranı yerleşimi: tanıtım görseli 843x1264 oranında birebir görünür,
// canlı katmanlar görseldeki öğelerin tam üzerine yüzdeyle oturur.
export const SCREEN_WIDTH = 843;
export const SCREEN_HEIGHT = 1264;

// Yüzde kutusunu konumlandırma stiline çevirir.
export const boxStyle = (box) => ({
  left: `${box.left}%`,
  top: `${box.top}%`,
  width: `${box.width}%`,
  height: `${box.height}%`,
});

// Görseldeki 5x4 ızgaranın üzerine oturan canlı makara alanı (%).
export const REEL_BOX = { left: 4.5, top: 30, width: 91, height: 42.5 };

// Üst şerit: canlı bakiye ve görseldeki üç yuvarlak düğme.
export const BALANCE_BOX = { left: 4, top: 2.9, width: 23, height: 5 };
export const TOP_BUTTONS = { top: 0.9, size: 7.6, lefts: [70.2, 80.7, 89.7] };

// Alt kontrol paneli: durum şeridi, satın al, SPIN ve bahis satırı.
export const BANNER_BOX = { left: 6, top: 74.6, width: 88, height: 3.9 };
export const BUY_BOX = { left: 7, top: 79.5, width: 24, height: 10 };
export const SPIN_BOX = { left: 40.5, top: 78.5, width: 22, height: 11 };
export const BET_ROW = { left: 4, top: 90, width: 92, height: 5 };