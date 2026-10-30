import { useEffect } from 'react';

/**
 * Profil tasarımının alt kenarı, alt menü çubuğunun üst çizgisine oturur.
 * Kaydırma miktarı tahminle değil, çubuğun ekrandaki gerçek konumundan okunur:
 * hangi cihaz, hangi çentik olursa olsun tasarım çubuğun çerçevesine kadar iner.
 */
export default function useProfileNavLift(ref) {
  useEffect(() => {
    const apply = () => {
      const el = ref.current;
      const nav = document.querySelector('nav[aria-label="Ana menü"]');
      if (!el || !nav) return;
      const lift = Math.round(window.innerHeight - nav.getBoundingClientRect().top);
      if (lift > 0) el.style.setProperty('--profile-lift', `${lift}px`);
    };
    apply();
    // Çubuk görseli ve profil görseli sonradan yüklendiğinde ölçü birkaç kez tazelenir.
    const timers = [120, 450, 1200].map((delay) => window.setTimeout(apply, delay));
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, [ref]);
}