// Film arama yardımcıları: gerçek Google araması, yasal platformlar ve
// uygulama içinde oynatılabilen bağlantıların çözümlenmesi.
import { youtubeIdFromUrl } from '@/lib/mediaSource';

/** Arama türleri: film adı, oyuncu veya tür ile Google'da arama. */
export const SEARCH_MODES = [
  { key: 'title', label: 'Film Adı', suffix: 'film izle' },
  { key: 'actor', label: 'Oyuncu', suffix: 'oyuncusu filmleri izle' },
  { key: 'genre', label: 'Tür', suffix: 'filmleri izle' },
];

/** Kullanıcı girdisi URL kodlanır; arama adresi güvenli biçimde kurulur. */
export function googleSearchUrl(text, mode = 'title') {
  const value = (text || '').trim();
  if (!value) return '';
  const suffix = SEARCH_MODES.find((item) => item.key === mode)?.suffix || 'film izle';
  return `https://www.google.com/search?q=${encodeURIComponent(`${value} ${suffix}`)}`;
}

/** Yalnızca http/https adresleri tarayıcıda açılır. */
export function openInBrowser(url) {
  if (!/^https?:\/\//i.test(url || '')) return false;
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) window.location.href = url;
  return true;
}

/** Yapıştırılan bağlantıyı çözer: YouTube, doğrudan video ya da normal sayfa. */
export function resolveFilmMedia(raw) {
  const value = (raw || '').trim();
  if (!value) return null;

  const youtubeId = youtubeIdFromUrl(value);
  if (youtubeId) {
    return {
      kind: 'youtube',
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&playsinline=1`,
    };
  }

  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(parsed.protocol)) return null;

  const href = parsed.href;
  const direct = /\.(mp4|m4v|webm|ogv|ogg|mov)(\?|#|$)/i.test(href);
  return { kind: direct ? 'video' : 'page', url: href };
}