// Oyun ekranı görseli 941 x 1525. Konumlar görselin oranlarına göre normalize.
export const ART_WIDTH = 941;
export const ART_HEIGHT = 1525;

const f = (x, y, w, h) => ({
  left: `${(x * 100).toFixed(2)}%`,
  top: `${(y * 100).toFixed(2)}%`,
  width: `${(w * 100).toFixed(2)}%`,
  height: `${(h * 100).toFixed(2)}%`,
});

// Canlı kontrollerin görseldeki yerleri.
export const ROCKET_LAYOUT = {
  coinBox: f(0.225, 0.072, 0.31, 0.075), // "FK Coin 42.750" alanı
  recentValues: f(0.535, 0.105, 0.445, 0.05), // "1.12x 2.36x ..." şeridi
  bigMultiplier: f(0.26, 0.38, 0.48, 0.13), // ortadaki büyük çarpan
  playersList: f(0.012, 0.208, 0.275, 0.56), // sol oyuncu listesi
  playersHeader: f(0.012, 0.152, 0.275, 0.052), // "Oyuncular 1847" başlığı
  betAmount: f(0.135, 0.832, 0.25, 0.075), // "500" rakamı
  betMinus: f(0.045, 0.832, 0.075, 0.075),
  betPlus: f(0.405, 0.832, 0.075, 0.075),
  betButton: f(0.045, 0.918, 0.43, 0.066), // "Bahis yap" butonu
  betPanelRight: f(0.515, 0.79, 0.465, 0.19), // sağ panel = tur bilgisi
};