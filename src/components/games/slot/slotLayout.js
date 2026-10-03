// Oyun ekranı, 1018 x 1545 boyutundaki referans görselin kendisidir.
// Konumlar görselin piksellerinden ölçüldü: canlı kontroller görselin kendi
// butonlarının, canlı değerler de görselin kendi rakam alanlarının üzerine gelir.
export const ART_WIDTH = 1018;
export const ART_HEIGHT = 1545;

const frame = (x, y, w, h) => ({
  left: `${((x / ART_WIDTH) * 100).toFixed(2)}%`,
  top: `${((y / ART_HEIGHT) * 100).toFixed(2)}%`,
  width: `${((w / ART_WIDTH) * 100).toFixed(2)}%`,
  height: `${((h / ART_HEIGHT) * 100).toFixed(2)}%`,
});

// Görselin kendi butonları — görünmez dokunma alanları.
export const SLOT_LAYOUT = {
  // Makara alanı — tur sırasında görselin kendisi burada döner.
  reelWindow: frame(25, 435, 968, 670),
  spin: frame(760, 1264, 236, 248),
  auto: frame(596, 1352, 160, 140),
  max: frame(382, 1434, 200, 90),
  balance: frame(18, 1428, 320, 102),
  betMinus: frame(186, 1330, 100, 110),
  betPlus: frame(480, 1330, 104, 110),
};

// Görselde yazılı olan rakam alanları — canlı değerler bu kutulara yazılır.
export const SLOT_FIELDS = {
  lines: frame(92, 1268, 126, 54),
  totalBet: frame(296, 1268, 144, 54),
  win: frame(585, 1268, 150, 54),
  bet: frame(330, 1370, 104, 56),
  balance: frame(90, 1456, 170, 54),
  // En üstteki ödül rakamları sıfırlanır.
  jackpots: [
    frame(168, 296, 200, 48),
    frame(402, 296, 222, 48),
    frame(662, 296, 192, 48),
    frame(24, 358, 158, 46),
    frame(851, 358, 147, 46),
  ],
};