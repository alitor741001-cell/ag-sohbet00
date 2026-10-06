import { useEffect, useState } from 'react';

/** Yazma alanı odakta mı: klavye yalnızca bir metin alanı odaktayken açılmış sayılır. */
function isTyping() {
  const el = document.activeElement;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

/** Sanal klavye açıldığında ekranın altından kapanan yüksekliği (px) verir. */
export default function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const update = () => {
      // Yazma alanı odakta değilse klavye yoktur: adres çubuğu açılıp kapanırken görünür
      // alan değişse de çubuklar yerinden oynamaz (yayınlar arası gezinirken zıplama olmaz).
      // Klavye kapanınca da odak gider ve çubuklar anında eski yerine döner.
      if (!isTyping()) { setInset(0); return; }
      // Klavye yüksekliği: görünür alanın altında kalan boşluk. Sayfa kaydırmasından doğan
      // kayma (offsetTop) çıkarılır; aksi hâlde çubuklar klavyenin üstünde boşlukta kalır.
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      const limit = Math.round(window.innerHeight * 0.7);
      // Adres çubuğu kaynaklı küçük oynamalar klavye sayılmaz: eşik yüksek tutulur.
      setInset(covered > 100 ? Math.min(Math.round(covered), limit) : 0);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    // Odak değişimi klavye açılış/kapanışını en güvenilir şekilde bildirir.
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);

  return inset;
}