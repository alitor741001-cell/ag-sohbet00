// Oda ekranındaki harici kaynaklar: Google araması ve YouTube videosu.
export const YT_PREFIX = 'yt:';

/** YouTube linkini 11 haneli video kimliğine çevirir; geçersizse boş döner. */
export function youtubeIdFromUrl(value) {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') return (url.pathname.split('/')[1] || '').slice(0, 11);
    if (!host.endsWith('youtube.com') && !host.endsWith('youtube-nocookie.com')) return '';
    if (url.pathname === '/watch') return (url.searchParams.get('v') || '').slice(0, 11);
    const parts = url.pathname.split('/').filter(Boolean);
    if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) return (parts[1] || '').slice(0, 11);
    return '';
  } catch {
    return '';
  }
}

/** Oda film alanına yazılan YouTube kimliğini okur. */
export function youtubeVideoId(movieId) {
  return typeof movieId === 'string' && movieId.startsWith(YT_PREFIX) ? movieId.slice(YT_PREFIX.length) : '';
}

/** Google araması ayrı sekmede açılır. */
export function openGoogle(query = '') {
  const url = query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : 'https://www.google.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** YouTube: video verilmişse o videoyu, verilmemişse YouTube'u açar. */
export function openYouTube(videoId = '') {
  const url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : 'https://www.youtube.com';
  window.open(url, '_blank', 'noopener,noreferrer');
}