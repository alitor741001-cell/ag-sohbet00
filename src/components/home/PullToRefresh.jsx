import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

// Aşağı çekerek yenileme: bu mesafeye ulaşınca liste tazelenir.
const PULL_THRESHOLD = 50;
const MAX_PULL = 92;
const PULL_RATIO = 0.6;
const HOLD = 48;
const BUSY_MS = 1000;

/**
 * Aşağı çekerek yenileme sarmalayıcısı.
 * Çekme sırasında React durumu hiç değişmez: gösterge doğrudan DOM'a yazılır, bu yüzden
 * uzun listeler çekilirken yeniden çizilmez ve hareket akıcı kalır. Jest yalnızca sayfanın
 * en üstünden başlar; çekilirken tarayıcının kendi aşağı-çek-yenile davranışı durdurulur
 * ve parmağın altındaki kart yanlışlıkla açılmaz.
 */
export default function PullToRefresh({ children, onRefresh }) {
  const rootRef = useRef(null);
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const spinRef = useRef(null);
  const startY = useRef(null);
  const distance = useRef(0);
  const busy = useRef(false);
  const timer = useRef(0);
  const refresh = useRef(onRefresh);
  refresh.current = onRefresh;

  const paint = (value, text) => {
    if (boxRef.current) boxRef.current.style.height = `${Math.round(value)}px`;
    if (textRef.current) {
      textRef.current.textContent = text || (value >= PULL_THRESHOLD ? 'Bırak, yenile' : 'Yenilemek için çek');
      textRef.current.style.opacity = value ? '1' : '0';
    }
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const spinning = (on) => spinRef.current?.classList.toggle('animate-spin', !!on);
    const start = (event) => {
      if (busy.current || event.touches.length !== 1) return;
      // Yalnızca sayfanın en üstünden başlayan hareket yenileme sayılır.
      startY.current = window.scrollY <= 2 ? event.touches[0].clientY : null;
      distance.current = 0;
    };
    const move = (event) => {
      if (startY.current == null) return;
      const delta = event.touches[0].clientY - startY.current;
      if (delta <= 0) {
        if (distance.current) { distance.current = 0; paint(0); }
        return;
      }
      // Aşağı çekilirken sayfa kaymaz, tarayıcının kendi yenilemesi açılmaz.
      if (delta > 8 && event.cancelable) event.preventDefault();
      distance.current = Math.min(delta * PULL_RATIO, MAX_PULL);
      paint(distance.current);
    };
    const end = (event) => {
      if (startY.current == null) return;
      startY.current = null;
      // Çekme yapıldıysa dokunma bir tıklamaya dönüşmez: kart kendiliğinden açılmaz.
      if (distance.current > 8 && event.cancelable) event.preventDefault();
      if (distance.current < PULL_THRESHOLD) { distance.current = 0; paint(0); return; }
      busy.current = true;
      distance.current = HOLD;
      paint(HOLD, 'Yenileniyor…');
      spinning(true);
      refresh.current?.();
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        busy.current = false;
        distance.current = 0;
        spinning(false);
        paint(0);
      }, BUSY_MS);
    };
    // Kendi dinleyicimiz pasif değil: çekme sırasında tarayıcının kendi davranışı durdurulabilir.
    node.addEventListener('touchstart', start, { passive: true });
    node.addEventListener('touchmove', move, { passive: false });
    node.addEventListener('touchend', end);
    node.addEventListener('touchcancel', end);
    return () => {
      node.removeEventListener('touchstart', start);
      node.removeEventListener('touchmove', move);
      node.removeEventListener('touchend', end);
      node.removeEventListener('touchcancel', end);
    };
  }, []);

  return (
    <section ref={rootRef}>
      {/* Aşağı çekince açılan tazeleme göstergesi. */}
      <div ref={boxRef} className="flex items-center justify-center overflow-hidden" style={{ height: 0 }}>
        <span className="flex items-center gap-1.5 pb-2 text-[11px] font-bold text-premium-gold">
          <Loader2 ref={spinRef} className="h-3.5 w-3.5" />
          <span ref={textRef} className="opacity-0">Yenilemek için çek</span>
        </span>
      </div>
      {children}
    </section>
  );
}