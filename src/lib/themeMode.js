// Tema tercihi: 'system' | 'light' | 'dark' — seçim cihazda saklanır.
// 'system' seçiliyken cihazın açık/koyu tercihi uygulamaya canlı uygulanır;
// açık veya koyu seçildiyse cihaz teması değişse de uygulama sabit kalır.
// Tercih okunamazsa premium sinema teması (koyu) varsayılan kalır.
const DARK_QUERY = '(prefers-color-scheme: dark)';
const LIGHT_QUERY = '(prefers-color-scheme: light)';
const STORAGE_KEY = 'filmkeyfi_theme';
const MODES = ['system', 'light', 'dark'];

/** Kayıtlı tema tercihi: 'system', 'light' veya 'dark'. */
export function getThemeMode() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return MODES.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

/** Cihazın kendi tercihi: açıkça açık demiyorsa koyu sinema teması kullanılır. */
function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  if (window.matchMedia(DARK_QUERY).matches) return 'dark';
  if (window.matchMedia(LIGHT_QUERY).matches) return 'light';
  return 'dark';
}

/** Tercih ile cihaz temasını birleştirir: 'system' seçiliyse cihazın kararı geçerlidir. */
function resolveTheme() {
  const mode = getThemeMode();
  return mode === 'system' ? systemTheme() : mode;
}

/** Tema token'ı HSL kanalı olarak tutulur ("0 5% 7%"): theme-color etiketi için hex'e çevrilir. */
function channelsToHex(value) {
  const parts = String(value).trim().split(/[\s,]+/).map((part) => parseFloat(part));
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return '';
  const [hue, sat, light] = [parts[0], parts[1] / 100, parts[2] / 100];
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = light - chroma / 2;
  const [r, g, b] = hue < 60 ? [chroma, second, 0]
    : hue < 120 ? [second, chroma, 0]
      : hue < 180 ? [0, chroma, second]
        : hue < 240 ? [0, second, chroma]
          : hue < 300 ? [second, 0, chroma]
            : [chroma, 0, second];
  return `#${[r, g, b].map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, '0')).join('')}`;
}

/** Aktif temanın kendi zemini tarayıcı çubuğuna (theme-color) yazılır. */
function applyThemeColor() {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const hex = channelsToHex(getComputedStyle(document.documentElement).getPropertyValue('--background'));
  if (hex) meta.setAttribute('content', hex);
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  // Tarih seçici, kaydırma çubuğu gibi yerel kontroller de temayla uyumlu kalsın.
  root.style.colorScheme = theme;
  applyThemeColor();
}

/** Tema tercihini kaydeder ve anında uygular. */
export function setThemeMode(mode) {
  const next = MODES.includes(mode) ? mode : 'system';
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Depolama kapalıysa (gizli sekme) tercih saklanmaz; tema yine de uygulanır.
  }
  applyTheme(resolveTheme());
  return next;
}

/** Tercihi hemen uygular ve sistem temasındaki değişiklikleri izler. */
export default function initSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    applyTheme('dark');
    return () => {};
  }

  const dark = window.matchMedia(DARK_QUERY);
  const light = window.matchMedia(LIGHT_QUERY);
  // Tercih her değişiklikte yeniden okunur: 'system' ise cihaz kararı, değilse kayıtlı seçim geçerlidir.
  const onChange = () => applyTheme(resolveTheme());

  applyTheme(resolveTheme());

  // Eski WebView'lerde yalnızca addListener bulunur.
  const unsubscribe = [dark, light].map((query) => {
    if (query.addEventListener) {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    query.addListener(onChange);
    return () => query.removeListener(onChange);
  });

  return () => unsubscribe.forEach((off) => off());
}