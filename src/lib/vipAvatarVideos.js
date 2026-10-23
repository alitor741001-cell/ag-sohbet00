const V = 'https://media.base44.com/videos/public/6a77d66e4da6de214628ee62';
const VIDEOS = {
  6: `${V}/d0b7ee868_VIP_6_Avatar.mp4`,
  7: `${V}/1bd7c44e3_VIP_7_Avatar.mp4`,
  8: `${V}/fea46dc97_VIP_8_Avatar.mp4`,
  9: `${V}/b09ab836e_VIP_9_Avatar.mp4`,
  10: `${V}/8f24b0341_VIP_10_Avatar.mp4`,
  11: `${V}/bf784b9c0_VIP_11_Avatar.mp4`,
};

/** VIP seviyesine ait hareketli avatar videosu; eksik seviye en yakın videoyu kullanır. */
export default function vipAvatarVideo(level) {
  const n = Math.min(11, Math.max(6, Number(level) || 6));
  return VIDEOS[n];
}