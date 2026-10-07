import { useEffect, useRef, useState } from 'react';

/** Yazma alanı odakta mı: klavye yalnızca bir metin alanı odaktayken açılmış sayılır. */
function isTyping() {
  const el = document.activeElement;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

/**
 * Sanal klavye açıldığında ekranın altından kapanan yüksekliği (px) verir.
 * Değer klavyeyle birlikte anlık güncellenir: çubuklar klavyenin hemen üstünde durur,
 * klavye kapanınca aynı anda eski yerine döner — arada siyah boşluk kalmaz.
 * Android ile iOS aynı davranır: ölçü sayfa alanının kendi yüksekliğinden alınır, klavye
 * kapanışını olayla bildirmeyen cihazlarda değer kendini kısa aralıklarla doğrular.
 */
export default function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  const insetRef = useRef(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;
    let frame = 0;

    const apply = (next) => {
      insetRef.current = next;
      setInset((prev) => (prev === next ? prev : next));
    };

    const measure = () => {
      frame = 0;
      // Yazma alanı odakta değilse klavye yoktur: çubuklar anında eski yerine döner
      // (adres çubuğu açılıp kapanırken veya sayfa kayarken zıplama olmaz).
      if (!isTyping()) { apply(0); return; }
      // Ölçü sayfa alanının kendi yüksekliğinden alınır. Android'de klavye açılınca alan
      // kendiliğinden kısalıyorsa ayrıca kaydırmaya gerek yoktur; kısalmıyorsa yalnızca
      // görünür alanın kapanan kısmı kadar kaydırılır. iOS'ta alan kısalmadığı için
      // klavye yüksekliği tam olarak buradan gelir.
      const layout = document.documentElement?.clientHeight || window.innerHeight;
      const covered = Math.round(layout - viewport.height - viewport.offsetTop);
      const limit = Math.round(layout * 0.7);
      // Adres çubuğu kaynaklı küçük oynamalar klavye sayılmaz.
      apply(covered > 90 ? Math.min(Math.max(covered, 0), limit) : 0);
    };

    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };

    measure();
    viewport.addEventListener('resize', schedule);
    viewport.addEventListener('scroll', schedule);
    // Odak değişimi klavye açılış/kapanışını en güvenilir şekilde bildirir.
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    // Klavye kapanışı her cihazda olayla gelmez: yazarken ya da çubuk kaydırılmışken
    // değer yeniden ölçülür, çubuk yukarıda takılı kalmaz.
    const poll = setInterval(() => { if (isTyping() || insetRef.current) schedule(); }, 400);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(poll);
      viewport.removeEventListener('resize', schedule);
      viewport.removeEventListener('scroll', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
    };
  }, []);

  return inset;
}