// Sistem teması: cihazın açık/koyu tercihi uygulamaya canlı uygulanır.
// Tercih okunamazsa premium sinema teması (koyu) varsayılan kalır.
const DARK_QUERY = '(prefers-color-scheme: dark)';
const LIGHT_QUERY = '(prefers-color-scheme: light)';

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  // Tarih seçici, kaydırma çubuğu gibi yerel kontroller de temayla uyumlu kalsın.
  root.style.colorScheme = theme;
}

/** Sistem temasını hemen uygular ve sonraki değişiklikleri izler. */
export default function initSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    applyTheme('dark');
    return () => {};
  }

  const dark = window.matchMedia(DARK_QUERY);
  const light = window.matchMedia(LIGHT_QUERY);
  // Sistem açıkça koyu ya da açık demiyorsa koyu sinema teması kullanılır.
  const current = () => (dark.matches ? 'dark' : light.matches ? 'light' : 'dark');
  const onChange = () => applyTheme(current());

  applyTheme(current());

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