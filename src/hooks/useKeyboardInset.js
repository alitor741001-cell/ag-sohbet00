import { useEffect, useState } from 'react';

/** Yazma alanı odakta mı: klavye yalnızca bir metin alanı odaktayken açılmış sayılır. */
function isTyping() {
  const el = document.activeElement;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

const layoutHeight = () => Math.round(document.documentElement?.clientHeight || window.innerHeight);

/**
 * Klavye ölçümü bütün bileşenler için tek yerde yapılır: kaç bileşen isterse istesin
 * tek dinleyici çalışır, ölçüm saniyede birkaç kez yinelenmez.
 */
const monitor = { inset: 0, cover: 0, visible: false, base: 0, width: 0, listeners: new Set(), teardown: null };

function publish(inset, cover, visible) {
  if (monitor.inset === inset && monitor.cover === cover && monitor.visible === visible) return;
  monitor.inset = inset;
  monitor.cover = cover;
  monitor.visible = visible;
  [...monitor.listeners].forEach((listener) => listener(monitor));
}

/**
 * İki cihaz davranışı birlikte karşılanır: sayfa alanı klavye için kısalmıyorsa (iOS)
 * klavye yüksekliği görünür alanın kapanan kısmıdır; sayfa alanı kısalıyorsa (Android,
 * uygulama içi görünüm) kısalma miktarıdır. Küçük oynamalar (adres çubuğu) klavye sayılmaz.
 */
function measure() {
  const layout = layoutHeight();
  const rotated = window.innerWidth !== monitor.width;
  monitor.width = window.innerWidth;
  if (!isTyping()) {
    // Klavye kapalıyken sayfa alanı en geniş hâlindedir: karşılaştırmanın tabanı budur.
    // Döndürmede taban yeni yüksekliğe geçer; klavye için kısalan alan tabanı bozmaz.
    if (rotated || layout >= monitor.base) monitor.base = layout;
    publish(0, 0, false);
    return;
  }
  const viewport = window.visualViewport;
  const visibleBottom = viewport ? viewport.height + viewport.offsetTop : layout;
  const covered = Math.round(layout - visibleBottom);
  const limit = Math.round(layout * 0.7);
  const inset = covered > 90 ? Math.min(Math.max(covered, 0), limit) : 0;
  // Çerçevesi klavyeden bağımsız sabit duran ekranlar için kaydırma, klavye açılmadan önceki
  // yükseklikten ölçülür: sayfa alanı kısalsa da kısalmıyor olsa da klavyenin kapladığı
  // yükseklik doğru çıkar.
  const cover = Math.round(monitor.base - visibleBottom);
  publish(inset, cover > 0 ? Math.min(cover, Math.round(monitor.base * 0.7)) : 0, inset > 0 || monitor.base - layout > 90);
}

function subscribe(listener) {
  monitor.listeners.add(listener);
  if (!monitor.teardown) {
    const viewport = window.visualViewport;
    let frame = 0;
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    // Klavye kapanışı her cihazda olayla gelmez: yazarken kısa aralıklarla yeniden ölçülür.
    const poll = setInterval(() => { if (isTyping() || monitor.visible) schedule(); }, 400);
    monitor.base = layoutHeight();
    monitor.width = window.innerWidth;
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    // Odak değişimi klavye açılış/kapanışını en güvenilir şekilde bildirir.
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    monitor.teardown = () => {
      cancelAnimationFrame(frame);
      clearInterval(poll);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
    };
  }
  measure();
  listener(monitor);
  return () => {
    monitor.listeners.delete(listener);
    if (!monitor.listeners.size) { monitor.teardown?.(); monitor.teardown = null; }
  };
}

/**
 * Sanal klavye açıldığında ekranın altından kapanan yüksekliği (px) verir: çubuklar
 * klavyenin hemen üstünde durur, klavye kapanınca aynı anda eski yerine döner.
 */
export default function useKeyboardInset() {
  const [inset, setInset] = useState(monitor.inset);
  useEffect(() => subscribe((state) => setInset(state.inset)), []);
  return inset;
}

/**
 * Klavyenin kapladığı yükseklik, klavye açılmadan önceki çerçeve yüksekliğine göre ölçülür.
 * Çerçevesi klavyeden bağımsız sabit duran ekranlarda (sesli oda) gereken kaydırma miktarı budur.
 */
export function useKeyboardCoverHeight() {
  const [cover, setCover] = useState(monitor.cover);
  useEffect(() => subscribe((state) => setCover(state.cover)), []);
  return cover;
}

/** Klavye görünür mü: yazma alanı klavye kapanınca kendiliğinden kapanır. */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(monitor.visible);
  useEffect(() => subscribe((state) => setOpen(state.visible)), []);
  return open;
}

/**
 * Klavye açılıp kapansa da değişmeyen çerçeve yüksekliği: oda düzeni klavyeden etkilenmez,
 * koltuklar ve sahne yerinden oynamaz — yalnızca sohbet bölümü yukarı kayar.
 */
export function useStableViewportHeight() {
  const [height, setHeight] = useState(() => layoutHeight());
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const update = () => {
      const next = layoutHeight();
      const rotated = window.innerWidth !== lastWidth;
      lastWidth = window.innerWidth;
      // Klavye için kısalan yükseklik yok sayılır; büyüme ve küçük oynamalar (adres çubuğu) uygulanır.
      setHeight((prev) => (!rotated && next < prev - 90 ? prev : next));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return height;
}