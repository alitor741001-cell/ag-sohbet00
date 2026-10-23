/**
 * Ekran kenarından yapılan yatay kaydırmanın tarayıcı geri/ileri sayfa geçişini
 * tetiklemesini engeller: sola/sağa kaydırınca uygulama başka sayfaya kaymaz.
 */
const EDGE = 32;

export default function initEdgeSwipeGuard() {
  let start = null;
  window.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    const width = window.innerWidth;
    start = touch && (touch.clientX < EDGE || touch.clientX > width - EDGE)
      ? { x: touch.clientX, y: touch.clientY }
      : null;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (!start || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = Math.abs(touch.clientX - start.x);
    const dy = Math.abs(touch.clientY - start.y);
    if (dx > dy && event.cancelable) event.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', () => { start = null; }, { passive: true });
}