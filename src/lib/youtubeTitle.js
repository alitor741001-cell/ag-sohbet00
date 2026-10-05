/**
 * Film odalarında açılan YouTube videosunun başlığını bulur.
 * Oda kaydında yalnızca "YouTube videosu" gibi genel bir etiket tutulduğu için
 * gerçek başlık YouTube'un herkese açık oEmbed servisinden bir kez çekilip önbelleğe alınır.
 */
const titleCache = new Map();

// Oda kaydında anlam taşımayan genel başlıklar.
const GENERIC_TITLES = ['', 'youtube', 'youtube videosu', 'ekran', 'ekran paylaşımı'];

export function youtubeIdFromMovieId(movieId) {
  const value = String(movieId || '');
  return value.startsWith('yt:') ? value.slice(3) : '';
}

export function isGenericTitle(title) {
  return GENERIC_TITLES.includes(String(title || '').trim().toLowerCase());
}

export async function fetchYouTubeTitle(videoId) {
  if (!videoId) return '';
  if (titleCache.has(videoId)) return titleCache.get(videoId);
  const response = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
  ).catch(() => null);
  const title = response?.ok ? (await response.json().catch(() => null))?.title || '' : '';
  titleCache.set(videoId, title);
  return title;
}