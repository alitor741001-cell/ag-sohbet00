// Oyun ekranı, 1018 x 1545 boyutundaki referans görselin kendisidir.
// Aşağıdaki konumlar görselin piksellerinden ölçüldü; canlı kontroller görselin
// kendi butonlarının tam üzerine yerleşir.
export const ART_WIDTH = 1018;
export const ART_HEIGHT = 1545;

const frame = (x, y, w, h) => ({
  left: `${((x / ART_WIDTH) * 100).toFixed(2)}%`,
  top: `${((y / ART_HEIGHT) * 100).toFixed(2)}%`,
  width: `${((w / ART_WIDTH) * 100).toFixed(2)}%`,
  height: `${((h / ART_HEIGHT) * 100).toFixed(2)}%`,
});

export const SLOT_LAYOUT = {
  // Makara alanı — tur sırasında görselin kendisi burada döner.
  reelWindow: frame(25, 435, 968, 670),
  spin: frame(760, 1264, 236, 248),
  auto: frame(596, 1352, 160, 140),
  max: frame(382, 1434, 200, 90),
  balance: frame(24, 1440, 220, 78),
};