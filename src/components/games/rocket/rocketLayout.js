import { ROCKET_SCREEN } from '../rocketAssets';

// Oyun ekranı görseli 941 x 1525. Tüm konumlar görselin kendi piksellerinden
// ölçüldü: canlı kontroller görseldeki butonların tam üzerine oturur.
export const ART_WIDTH = 941;
export const ART_HEIGHT = 1525;

const f = (x, y, w, h) => ({
  left: `${(x * 100).toFixed(3)}%`,
  top: `${(y * 100).toFixed(3)}%`,
  width: `${(w * 100).toFixed(3)}%`,
  height: `${(h * 100).toFixed(3)}%`,
});

// Görselin kendi iki bahis paneli — görünmez dokunma alanları bu kutulara oturur.
const betPanel = (ox) => ({
  autoMinus: f(ox + 0.045, 0.801, 0.055, 0.038),
  autoValue: f(ox + 0.096, 0.799, 0.222, 0.042),
  autoPlus: f(ox + 0.316, 0.801, 0.055, 0.038),
  betMinus: f(ox + 0.005, 0.850, 0.066, 0.045),
  betValue: f(ox + 0.068, 0.848, 0.246, 0.048),
  betPlus: f(ox + 0.314, 0.850, 0.066, 0.045),
  button: f(ox, 0.904, 0.383, 0.061),
});

export const ROCKET_LAYOUT = {
  // Görselin kendi üst butonları: ek buton yok.
  menu: f(0.015, 0.01, 0.088, 0.057), // sol üst menü → oyun listesi
  settings: f(0.898, 0.012, 0.084, 0.05), // sağ üst ayarlar → paneli kapat
  // Canlı değerler
  coinBox: f(0.225, 0.088, 0.31, 0.056),
  recentValues: f(0.553, 0.088, 0.433, 0.056),
  bigMultiplier: f(0.28, 0.375, 0.54, 0.125),
  playersHeader: f(0.016, 0.161, 0.279, 0.039),
  playersList: f(0.014, 0.206, 0.283, 0.565),
  // Görseldeki sabit ses simgesi: hareketli gök katmanı altında kalmaması için
  // aynı piksellerden oluşan sabit bir yama ile üstten kapatılır.
  mutePatch: f(0.893, 0.160, 0.095, 0.062),
  // Roket ve çevresi: hareketli gök katmanının merkezi.
  robotBox: f(0.771, 0.314, 0.081, 0.076),
  engineGlow: f(0.56, 0.34, 0.34, 0.24),
  crashFlash: f(0.65, 0.25, 0.32, 0.28),
  crashSmoke: f(0.62, 0.21, 0.38, 0.36),
  slots: [betPanel(0.053), betPanel(0.547)],
};

// Görselin bir bölgesini birebir gösteren sabit yama (ağırlıklı olarak kapatma için).
export function artworkPatchStyle(box) {
  const x = parseFloat(box.left) / 100;
  const y = parseFloat(box.top) / 100;
  const w = parseFloat(box.width) / 100;
  const h = parseFloat(box.height) / 100;
  return {
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    backgroundImage: `url(${ROCKET_SCREEN})`,
    backgroundSize: `${(100 / w).toFixed(3)}% ${(100 / h).toFixed(3)}%`,
    backgroundPosition: `${((x / (1 - w)) * 100).toFixed(3)}% ${((y / (1 - h)) * 100).toFixed(3)}%`,
    backgroundRepeat: 'no-repeat',
  };
}