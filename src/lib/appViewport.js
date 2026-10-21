// Cihazın gerçek görünür yüksekliği piksel olarak --app-height değişkenine yazılır.
// Böylece adres çubuğu açıkken, klavye kapanınca, ekran döndürüldüğünde ve dvh birimini
// desteklemeyen eski iOS/Android sürümlerinde de uygulama ekranın tamamını kaplar.
let frame = 0;

function applyHeight() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const height = window.innerHeight || document.documentElement.clientHeight;
    if (height > 0) {
      document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`);
    }
  });
}

export default function initAppViewport() {
  applyHeight();
  window.addEventListener('resize', applyHeight, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(applyHeight, 150));
  document.addEventListener('visibilitychange', applyHeight);
  window.visualViewport?.addEventListener('resize', applyHeight, { passive: true });
}