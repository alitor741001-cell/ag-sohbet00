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
export default function PullToRefresh({ children, onRefresh, label = '', busyLabel = '', disabled = false }) {
  if (disabled) return <StillPage>{children}</StillPage>;
  return <PullArea onRefresh={onRefresh} label={label} busyLabel={busyLabel}>{children}</PullArea>;
}

/** Yenilemesiz sayfa: esneme kapanır, tema ve içerik yerinde sabit kalır. */
function StillPage({ children }) {
  useEffect(() => {
    document.documentElement.classList.add('no-bounce');
    return () => document.documentElement.classList.remove('no-bounce');
  }, []);
  return <section>{children}</section>;
}

function PullArea({ children, onRefresh, label, busyLabel }) {
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

  const prefix = label ? `${label} ` : '';
  const paint = (value, text) => {
    if (boxRef.current) boxRef.current.style.height = `${Math.round(value)}px`;
    if (textRef.current) {
      textRef.current.textContent = text || (value >= PULL_THRESHOLD ? `Bırak, ${label ? `${label.toLowerCase()} yenilensin` : 'yenile'}` : `${prefix}yenilemek için çek`);
      textRef.current.style.opacity = value ? '1' : '0';
    }
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const spinning = (on) => spinRef.current?.classList.toggle('animate-spin', !!on);
    const start = (event) => {
      startY.current = null;
      if (busy.current || event.touches.length !== 1) return;
      // Nested chat/list scrollers own their gesture; never intercept their scrolling.
      let target = event.target;
      while (target && target !== node) {
        if (target instanceof HTMLElement && target.scrollHeight > target.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(target).overflowY)) {
          startY.current = null;
          return;
        }
        target = target.parentElement;
      }
      if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      startY.current = window.scrollY <= 2 ? event.touches[0].clientY : null;
      distance.current = 0;
    };
    const move = (event) => {
      if (startY.current == null) return;
      if (event.touches.length !== 1) { startY.current = null; paint(0); return; }
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
      paint(HOLD, busyLabel || 'Yenileniyor…');
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
    const cancel = () => { startY.current = null; distance.current = 0; if (!busy.current) paint(0); };
    // Kendi dinleyicimiz pasif değil: çekme sırasında tarayıcının kendi davranışı durdurulabilir.
    node.addEventListener('touchstart', start, { passive: true });
    node.addEventListener('touchmove', move, { passive: false });
    node.addEventListener('touchend', end);
    node.addEventListener('touchcancel', cancel);
    return () => {
      node.removeEventListener('touchstart', start);
      node.removeEventListener('touchmove', move);
      node.removeEventListener('touchend', end);
      node.removeEventListener('touchcancel', cancel);
    };
  }, []);

  return (
    <section ref={rootRef}>
      {/* Aşağı çekince açılan tazeleme göstergesi: renkli neon kapsül ve dönen halka. */}
      <div ref={boxRef} className="flex items-center justify-center overflow-hidden" style={{ height: 0 }}>
        <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-premium-gold/45 px-3 py-1 shadow-[0_0_18px_-4px_rgba(220,38,38,0.95)]"
          style={{ background: 'linear-gradient(100deg, rgba(220,38,38,0.5), rgba(242,206,107,0.35) 55%, rgba(220,38,38,0.5))' }}>
          <Loader2 ref={spinRef} className="h-3.5 w-3.5 text-premium-gold" />
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5a5a]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ffd166]" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7ce7ff]" style={{ animationDelay: '300ms' }} />
          </span>
          <span ref={textRef} className="text-[11px] font-bold tracking-wide text-[#ffeec2] opacity-0">Yenilemek için çek</span>
        </span>
      </div>
      {children}
    </section>
  );
}