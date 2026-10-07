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
const monitor = { inset: 0, visible: false, base: 0, listeners: new Set(), teardown: null };

function publish(inset, visible) {
  if (monitor.inset === inset && monitor.visible === visible) return;
  monitor.inset = inset;
  monitor.visible = visible;
  [...monitor.listeners].forEach((listener) => listener(inset, visible));
}

/**
 * İki cihaz davranışı birlikte karşılanır: sayfa alanı klavye için kısalmıyorsa (iOS)
 * klavye yüksekliği görünür alanın kapanan kısmıdır; sayfa alanı kısalıyorsa (Android,
 * uygulama içi görünüm) kısalma miktarıdır. Küçük oynamalar (adres çubuğu) klavye sayılmaz.
 */
function measure() {
  const layout = layoutHeight();
  if (!isTyping()) {
    // Klavye kapalıyken sayfa alanı en geniş hâlindedir: karşılaştırmanın tabanı budur.
    monitor.base = Math.max(monitor.base, layout);
    publish(0, false);
    return;
  }
  const viewport = window.visualViewport;
  const covered = viewport ? Math.round(layout - viewport.height - viewport.offsetTop) : 0;
  const limit = Math.round(layout * 0.7);
  const inset = covered > 90 ? Math.min(Math.max(covered, 0), limit) : 0;
  publish(inset, inset > 0 || monitor.base - layout > 90);
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
  listener(monitor.inset, monitor.visible);
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
  useEffect(() => subscribe((nextInset) => setInset(nextInset)), []);
  return inset;
}

/** Klavye görünür mü: yazma alanı klavye kapanınca kendiliğinden kapanır. */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(monitor.visible);
  useEffect(() => subscribe((_, visible) => setOpen(visible)), []);
  return open;
}